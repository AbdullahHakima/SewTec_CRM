using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(string? search, string? type, string? assignedRepId, bool? isStale);
    Task<CustomerDto?> GetByIdAsync(string id);
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request);
    Task<CustomerDto> UpdateAsync(string id, UpdateCustomerRequest request);
    Task<CustomerDto> AddMachineAsync(string customerId, InstalledMachineDto machineDto);
}

public class CustomerService : ICustomerService
{
    private readonly CrmDbContext _context;

    public CustomerService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<CustomerDto>> GetAllAsync(string? search, string? type, string? assignedRepId, bool? isStale)
    {
        var query = _context.Customers
            .Include(c => c.InstalledMachines)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            var parsedType = MappingExtensions.ParseCustomerType(type);
            query = query.Where(c => c.Type == parsedType);
        }

        if (!string.IsNullOrEmpty(assignedRepId) && assignedRepId != "all")
        {
            query = query.Where(c => c.AssignedRepId == assignedRepId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(q) ||
                c.Phone.Contains(q) ||
                (c.ContactPerson != null && c.ContactPerson.ToLower().Contains(q)) ||
                (c.Address != null && c.Address.ToLower().Contains(q)) ||
                c.InstalledMachines.Any(m => m.Model.ToLower().Contains(q)));
        }

        var customers = await query.ToListAsync();

        if (isStale == true)
        {
            var now = DateTime.UtcNow;
            customers = customers.Where(c =>
            {
                var days = (now - c.LastContactAt).TotalDays;
                return c.IsVip ? days >= 14 : days >= 21;
            }).ToList();
        }

        return customers.Select(c => c.ToDto()).ToList();
    }

    public async Task<CustomerDto?> GetByIdAsync(string id)
    {
        var customer = await _context.Customers
            .Include(c => c.InstalledMachines)
            .FirstOrDefaultAsync(c => c.Id == id);

        return customer?.ToDto();
    }

    public static string NormalizePhone(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var sb = new System.Text.StringBuilder();
        foreach (var ch in raw)
        {
            if (ch >= '٠' && ch <= '٩') sb.Append((char)('0' + (ch - '٠')));
            else if (ch >= '0' && ch <= '9') sb.Append(ch);
        }
        var digits = sb.ToString();
        if (digits.StartsWith("0020") && (digits.Length == 15 || digits.Length == 14 || digits.Length == 13)) digits = digits.Substring(4);
        else if (digits.StartsWith("20") && (digits.Length == 13 || digits.Length == 12)) digits = digits.Substring(2);
        if (digits.Length == 10 && (digits.StartsWith("10") || digits.StartsWith("11") || digits.StartsWith("12") || digits.StartsWith("15")))
        {
            digits = "0" + digits;
        }
        return digits;
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("اسم العميل مطلوب ولا يمكن تركه فارغاً.");
        }

        var digits = NormalizePhone(request.Phone);
        if (digits.Length != 11)
        {
            throw new ArgumentException("رقم الهاتف يجب أن يتكون من 11 رقماً بالضبط.");
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneSecondary))
        {
            var secDigits = NormalizePhone(request.PhoneSecondary);
            if (secDigits.Length != 0 && secDigits.Length != 11)
            {
                throw new ArgumentException("رقم الهاتف الإضافي يجب أن يتكون من 11 رقماً بالضبط.");
            }
        }

        var now = DateTime.UtcNow;
        var newCustomer = new Customer
        {
            Id = $"cust_{Guid.NewGuid().ToString("N")}",
            BranchId = "mahalla",
            Name = request.Name.Trim(),
            Type = MappingExtensions.ParseCustomerType(request.Type),
            Status = CustomerStatus.Active,
            IsVip = false,
            Phone = request.Phone.Trim(),
            PhoneSecondary = request.PhoneSecondary?.Trim(),
            ContactPerson = request.ContactPerson?.Trim(),
            Address = string.IsNullOrWhiteSpace(request.Address) ? "المحلة الكبرى" : request.Address.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? "المحلة الكبرى" : request.City.Trim(),
            AssignedRepId = request.AssignedRepId,
            AssignedRepName = request.AssignedRepName,
            LifetimeSales = 0,
            OpenPipelineValue = 0,
            LastContactAt = now,
            Notes = request.Notes?.Trim(),
            CreatedAt = now
        };

        _context.Customers.Add(newCustomer);
        await _context.SaveChangesAsync();

        return newCustomer.ToDto();
    }

    public async Task<CustomerDto> UpdateAsync(string id, UpdateCustomerRequest request)
    {
        var customer = await _context.Customers
            .Include(c => c.InstalledMachines)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            throw new KeyNotFoundException($"Customer with id {id} not found");

        if (request.Name != null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("اسم العميل لا يمكن أن يكون فارغاً.");
            customer.Name = request.Name.Trim();
        }
        if (!string.IsNullOrEmpty(request.Type)) customer.Type = MappingExtensions.ParseCustomerType(request.Type);
        if (!string.IsNullOrEmpty(request.Phone))
        {
            var digits = NormalizePhone(request.Phone);
            if (digits.Length != 11)
            {
                throw new ArgumentException("رقم الهاتف يجب أن يتكون من 11 رقماً بالضبط.");
            }
            customer.Phone = request.Phone.Trim();
        }
        if (request.PhoneSecondary != null)
        {
            var secDigits = NormalizePhone(request.PhoneSecondary);
            if (secDigits.Length != 0 && secDigits.Length != 11)
            {
                throw new ArgumentException("رقم الهاتف الإضافي يجب أن يتكون من 11 رقماً بالضبط.");
            }
            customer.PhoneSecondary = request.PhoneSecondary.Trim();
        }
        if (request.ContactPerson != null) customer.ContactPerson = request.ContactPerson.Trim();
        if (!string.IsNullOrEmpty(request.Address)) customer.Address = request.Address.Trim();
        if (!string.IsNullOrEmpty(request.City)) customer.City = request.City.Trim();
        if (!string.IsNullOrEmpty(request.AssignedRepId)) customer.AssignedRepId = request.AssignedRepId;
        if (!string.IsNullOrEmpty(request.AssignedRepName)) customer.AssignedRepName = request.AssignedRepName;
        if (request.Notes != null) customer.Notes = request.Notes.Trim();
        if (request.IsVip.HasValue) customer.IsVip = request.IsVip.Value;

        // Auto-check VIP eligibility
        if (customer.LifetimeSales >= 250000 || customer.InstalledMachines.Sum(m => m.Quantity) >= 5)
        {
            customer.IsVip = true;
        }

        await _context.SaveChangesAsync();

        return customer.ToDto();
    }

    public async Task<CustomerDto> AddMachineAsync(string customerId, InstalledMachineDto machineDto)
    {
        var customer = await _context.Customers
            .Include(c => c.InstalledMachines)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer == null)
            throw new KeyNotFoundException($"Customer with id {customerId} not found");

        var machine = new InstalledMachine
        {
            CustomerId = customerId,
            Model = machineDto.Model,
            Quantity = machineDto.Quantity,
            SerialNumber = machineDto.SerialNumber,
            PurchaseYear = machineDto.PurchaseYear,
            PurchasedFromSewTec = machineDto.PurchasedFromSewTec
        };

        _context.InstalledMachines.Add(machine);

        if (customer.InstalledMachines.Sum(m => m.Quantity) >= 5)
        {
            customer.IsVip = true;
        }

        await _context.SaveChangesAsync();

        return customer.ToDto();
    }
}

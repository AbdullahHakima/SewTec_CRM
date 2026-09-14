using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public record MentoringNoteDto(
    string Id,
    string? RepId,
    string RepName,
    string Type,
    string Message,
    string Author,
    string CreatedAt
);

public record CreateMentoringNoteRequest(
    string RepId,
    string Type,
    string Message
);

public interface IMentoringService
{
    Task<List<MentoringNoteDto>> GetNotesAsync();
    Task<MentoringNoteDto> CreateNoteAsync(CreateMentoringNoteRequest request);
    Task<TeamMonitoringSummaryDto> GetMonitoringSummaryAsync();
}

public class MentoringService : IMentoringService
{
    private readonly CrmDbContext _context;

    public MentoringService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<MentoringNoteDto>> GetNotesAsync()
    {
        var notes = await _context.MentoringNotes
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notes.Select(n => new MentoringNoteDto(
            n.Id,
            n.RepId,
            n.RepName,
            n.Type,
            n.Message,
            n.Author,
            n.CreatedAt.ToString("o")
        )).ToList();
    }

    public async Task<MentoringNoteDto> CreateNoteAsync(CreateMentoringNoteRequest request)
    {
        var rep = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.RepId && u.IsActive)
            ?? throw new ArgumentException("المندوب غير متاح في هذا الفرع.");
        var note = new MentoringNote
        {
            Id = $"note_{Guid.NewGuid().ToString("N")}",
            RepId = rep.Id,
            RepName = rep.FullName,
            Type = request.Type.Trim(),
            Message = request.Message.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.MentoringNotes.Add(note);
        await _context.SaveChangesAsync();

        return new MentoringNoteDto(
            note.Id,
            note.RepId,
            note.RepName,
            note.Type,
            note.Message,
            note.Author,
            note.CreatedAt.ToString("o")
        );
    }

    public async Task<TeamMonitoringSummaryDto> GetMonitoringSummaryAsync()
    {
        return await TeamQueryService.SummaryAsync(_context);
    }
}

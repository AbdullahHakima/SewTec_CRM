using System.Text.Json;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.DTOs;

public static class MappingExtensions
{
    public static string ToSnakeCase(this Enum value)
    {
        var str = value.ToString();
        var result = new System.Text.StringBuilder();
        for (int i = 0; i < str.Length; i++)
        {
            var c = str[i];
            if (char.IsUpper(c))
            {
                if (i > 0) result.Append('_');
                result.Append(char.ToLowerInvariant(c));
            }
            else
            {
                result.Append(c);
            }
        }
        return result.ToString();
    }

    public static CustomerDto ToDto(this Customer c)
    {
        return new CustomerDto(
            c.Id,
            c.BranchId,
            c.Name,
            c.Type.ToSnakeCase(),
            c.Status.ToSnakeCase(),
            c.IsVip,
            c.Phone,
            c.PhoneSecondary,
            c.ContactPerson,
            c.Address,
            c.City,
            c.AssignedRepId,
            c.AssignedRepName,
            c.LifetimeSales,
            c.OpenPipelineValue,
            c.LastContactAt.ToString("o"),
            c.NextFollowUpAt?.ToString("o"),
            c.InstalledMachines.Select(m => new InstalledMachineDto(
                m.Model,
                m.Quantity,
                m.SerialNumber,
                m.PurchaseYear,
                m.PurchasedFromSewTec
            )).ToList(),
            c.Notes,
            c.CreatedAt.ToString("o"), c.Revision
        );
    }

    public static OpportunityDto ToDto(this Opportunity o)
    {
        return new OpportunityDto(
            o.Id,
            o.BranchId,
            o.CustomerId,
            o.CustomerName,
            o.Title,
            o.MachineModel,
            o.Quantity,
            o.EstimatedValue,
            o.Stage.ToSnakeCase(),
            o.StageUpdatedAt.ToString("o"),
            o.AssignedRepId,
            o.AssignedRepName,
            o.ExpectedCloseDate?.ToString("o"),
            o.QuotationRef,
            o.Notes,
            o.CreatedAt.ToString("o"), o.Revision
        );
    }

    public static FollowUpDto ToDto(this FollowUp f)
    {
        return new FollowUpDto(
            f.Id,
            f.BranchId,
            f.CustomerId,
            f.CustomerName,
            f.CustomerPhone,
            f.Channel.ToSnakeCase(),
            f.ScheduledAt.ToString("o"),
            f.Topic,
            f.Status.ToSnakeCase(),
            f.AssignedRepId,
            f.AssignedRepName,
            f.CompletedAt?.ToString("o"),
            f.Outcome?.ToSnakeCase(),
            f.OutcomeNote,
            f.NextFollowUpId, f.Revision
        );
    }

    public static InteractionDto ToDto(this Interaction i)
    {
        return new InteractionDto(
            i.Id,
            i.CustomerId,
            i.CustomerName,
            i.Channel.ToSnakeCase(),
            i.Outcome.ToSnakeCase(),
            i.Summary,
            i.UninterestedReason,
            i.PerformedBy,
            i.OccurredAt.ToString("o"),
            i.FollowUpId,
            i.OpportunityId
        );
    }

    public static ActivityDto ToDto(this Activity a)
    {
        ActivityMetadataDto? meta = null;
        if (!string.IsNullOrEmpty(a.MetadataJson))
        {
            try
            {
                meta = JsonSerializer.Deserialize<ActivityMetadataDto>(a.MetadataJson);
            }
            catch {}
        }

        return new ActivityDto(
            a.Id,
            a.CustomerId,
            a.Type.ToSnakeCase(),
            a.Title,
            a.Description,
            a.OccurredAt.ToString("o"),
            a.PerformedBy,
            meta
        );
    }

    public static ProductDto ToDto(this Product p)
    {
        List<string> features;
        try
        {
            features = string.IsNullOrEmpty(p.FeaturesJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(p.FeaturesJson) ?? new List<string>();
        }
        catch
        {
            features = new List<string>();
        }

        return new ProductDto(
            p.Id,
            p.Model,
            p.Brand,
            p.Category,
            p.SuggestedPriceEgp,
            p.DescriptionArabic,
            p.SpeedRpm,
            p.MaxStitchLengthMm,
            p.NeedleSystem,
            p.MotorType,
            p.HasAutomaticTrimmer,
            p.HasAutoFootLifter,
            p.HasReverseStitch,
            p.LubricationType,
            p.WarrantyMonths,
            p.InStock,
            p.StockCount,
            p.Application,
            features
        );
    }

    public static CustomerType ParseCustomerType(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "factory" => CustomerType.Factory,
            "workshop" => CustomerType.Workshop,
            "trader" => CustomerType.Trader,
            "individual" => CustomerType.Individual,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static CustomerStatus ParseCustomerStatus(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "active" => CustomerStatus.Active,
            "dormant" => CustomerStatus.Dormant,
            "inactive" => CustomerStatus.Inactive,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static OpportunityStage ParseOpportunityStage(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "new" => OpportunityStage.New,
            "contacted" => OpportunityStage.Contacted,
            "interested" => OpportunityStage.Interested,
            "quotation" => OpportunityStage.Quotation,
            "negotiation" => OpportunityStage.Negotiation,
            "won" => OpportunityStage.Won,
            "lost" => OpportunityStage.Lost,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static FollowUpChannel ParseFollowUpChannel(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "call" => FollowUpChannel.Call,
            "visit" => FollowUpChannel.Visit,
            "whatsapp" => FollowUpChannel.Whatsapp,
            "email" => FollowUpChannel.Email,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static FollowUpStatus ParseFollowUpStatus(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "scheduled" => FollowUpStatus.Scheduled,
            "completed" => FollowUpStatus.Completed,
            "missed" => FollowUpStatus.Missed,
            "cancelled" => FollowUpStatus.Cancelled,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static InteractionChannel ParseInteractionChannel(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "call" => InteractionChannel.Call,
            "visit" => InteractionChannel.Visit,
            "whatsapp" => InteractionChannel.Whatsapp,
            "email" => InteractionChannel.Email,
            "note" => InteractionChannel.Note,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }

    public static InteractionOutcome ParseInteractionOutcome(string val)
    {
        return val.ToLowerInvariant() switch
        {
            "interested" => InteractionOutcome.Interested,
            "quotation_requested" => InteractionOutcome.QuotationRequested,
            "needs_time" => InteractionOutcome.NeedsTime,
            "no_answer" => InteractionOutcome.NoAnswer,
            "not_interested" => InteractionOutcome.NotInterested,
            _ => throw new ArgumentException("القيمة المختارة غير صالحة.")
        };
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;

namespace SewTec.CRM.Api.Security;

public sealed class RevisionFilter(CrmDbContext db) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        var id = context.RouteData.Values["id"]?.ToString();
        if (id != null && request.Method is "PUT" or "PATCH" or "POST")
        {
            var controller = context.RouteData.Values["controller"]?.ToString();
            string? revision = controller switch
            {
                "Customers" => await db.Customers.Where(c => c.Id == id).Select(c => c.Revision).FirstOrDefaultAsync(),
                "Opportunities" => await db.Opportunities.Where(c => c.Id == id).Select(c => c.Revision).FirstOrDefaultAsync(),
                "FollowUps" => await db.FollowUps.Where(c => c.Id == id).Select(c => c.Revision).FirstOrDefaultAsync(),
                _ => null
            };
            if (revision != null)
            {
                var expected = request.Headers.IfMatch.ToString().Trim('"');
                if (string.IsNullOrEmpty(expected))
                {
                    context.Result = new ObjectResult(new { code = "revision_required", message = "حدّث البيانات قبل حفظ التغيير." }) { StatusCode = 428 };
                    return;
                }
                if (expected != revision) throw new ConflictException("stale_edit", "تم تعديل البيانات. حدّث الصفحة قبل الحفظ.");
            }
        }
        await next();
    }
}

using System.Security.Claims;

namespace SewTec.CRM.Api.Security;

public sealed class CurrentUser(IHttpContextAccessor accessor)
{
    public bool IsRequest => accessor.HttpContext != null;
    public string Id => accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    public string BranchId => accessor.HttpContext?.User.FindFirstValue("branchId") ?? "";
    public string Name => accessor.HttpContext?.User.FindFirstValue("fullName") ?? "";
    public bool IsAdmin => accessor.HttpContext?.User.IsInRole("admin") == true;
}

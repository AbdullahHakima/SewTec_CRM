namespace SewTec.CRM.Api.Services;

public static class BranchClock
{
    private static readonly TimeZoneInfo Cairo = TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo");
    public static DateTime Today => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Cairo).Date;
    public static DateTime DayStartUtc => TimeZoneInfo.ConvertTimeToUtc(Today, Cairo);
    public static DateTime NextDayStartUtc => TimeZoneInfo.ConvertTimeToUtc(Today.AddDays(1), Cairo);
    public static DateTime TomorrowAtElevenUtc() => TimeZoneInfo.ConvertTimeToUtc(Today.AddDays(1).AddHours(11), Cairo);
}

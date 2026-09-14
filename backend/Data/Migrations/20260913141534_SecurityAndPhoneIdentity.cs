using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SewTec.CRM.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SecurityAndPhoneIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Revision",
                table: "Opportunities",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BranchId",
                table: "MentoringNotes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Revision",
                table: "FollowUps",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Revision",
                table: "Customers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AppUser",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionVersion",
                table: "AppUser",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CustomerPhones",
                columns: table => new
                {
                    NormalizedPhone = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPhones", x => x.NormalizedPhone);
                    table.ForeignKey(
                        name: "FK_CustomerPhones_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FollowUps_CustomerId_Status_ScheduledAt",
                table: "FollowUps",
                columns: new[] { "CustomerId", "Status", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_BranchId_AssignedRepId",
                table: "Customers",
                columns: new[] { "BranchId", "AssignedRepId" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPhones_CustomerId",
                table: "CustomerPhones",
                column: "CustomerId");
            migrationBuilder.Sql("UPDATE Customers SET Revision = lower(hex(randomblob(16)));");
            migrationBuilder.Sql("UPDATE Opportunities SET Revision = lower(hex(randomblob(16)));");
            migrationBuilder.Sql("UPDATE FollowUps SET Revision = lower(hex(randomblob(16)));");
            migrationBuilder.Sql("UPDATE AppUser SET SessionVersion = lower(hex(randomblob(16))), Username = lower(trim(Username));");
            // Legacy notes without a unique branch match stay quarantined (empty branch).
            migrationBuilder.Sql("UPDATE MentoringNotes SET BranchId = COALESCE((SELECT min(BranchId) FROM AppUser WHERE FullName = MentoringNotes.RepName HAVING count(DISTINCT BranchId) = 1), '');");
            migrationBuilder.Sql(@"
WITH RECURSIVE raw(Id, Phone) AS (
 SELECT Id, Phone FROM Customers UNION ALL SELECT Id, PhoneSecondary FROM Customers WHERE PhoneSecondary IS NOT NULL AND trim(PhoneSecondary) <> ''
), digits(Id, remaining, value) AS (
 SELECT Id, Phone, '' FROM raw
 UNION ALL SELECT Id, substr(remaining, 2), value || CASE
 WHEN substr(remaining,1,1) BETWEEN '0' AND '9' THEN substr(remaining,1,1)
 WHEN instr('٠١٢٣٤٥٦٧٨٩',substr(remaining,1,1)) > 0 THEN CAST(instr('٠١٢٣٤٥٦٧٨٩',substr(remaining,1,1))-1 AS TEXT)
 ELSE '' END FROM digits WHERE length(remaining) > 0
), local(Id, value) AS (
 SELECT Id, CASE WHEN value LIKE '0020%' AND length(value) BETWEEN 13 AND 15 THEN substr(value,5)
 WHEN value LIKE '20%' AND length(value) IN (12,13) THEN substr(value,3) ELSE value END FROM digits WHERE remaining = ''
)
INSERT INTO CustomerPhones(NormalizedPhone, CustomerId)
SELECT DISTINCT CASE WHEN length(value)=10 AND substr(value,1,2) IN ('10','11','12','15') THEN '0'||value ELSE value END, Id FROM local;");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerPhones");

            migrationBuilder.DropIndex(
                name: "IX_FollowUps_CustomerId_Status_ScheduledAt",
                table: "FollowUps");

            migrationBuilder.DropIndex(
                name: "IX_Customers_BranchId_AssignedRepId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Revision",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "MentoringNotes");

            migrationBuilder.DropColumn(
                name: "Revision",
                table: "FollowUps");

            migrationBuilder.DropColumn(
                name: "Revision",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "AppUser");

            migrationBuilder.DropColumn(
                name: "SessionVersion",
                table: "AppUser");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SewTec.CRM.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DurableActors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActorId",
                table: "MentoringNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepId",
                table: "MentoringNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorId",
                table: "Interactions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorId",
                table: "Activities",
                type: "TEXT",
                nullable: true);
            migrationBuilder.Sql("""
                UPDATE Interactions SET ActorId = (SELECT MIN(u.Id) FROM AppUser u JOIN Customers c ON c.Id=Interactions.CustomerId WHERE u.BranchId=c.BranchId AND u.FullName=Interactions.PerformedBy HAVING COUNT(*)=1);
                UPDATE Activities SET ActorId = (SELECT MIN(u.Id) FROM AppUser u JOIN Customers c ON c.Id=Activities.CustomerId WHERE u.BranchId=c.BranchId AND u.FullName=Activities.PerformedBy HAVING COUNT(*)=1);
                UPDATE MentoringNotes SET RepId = (SELECT MIN(u.Id) FROM AppUser u WHERE u.BranchId=MentoringNotes.BranchId AND u.FullName=MentoringNotes.RepName HAVING COUNT(*)=1);
                UPDATE MentoringNotes SET ActorId = (SELECT MIN(u.Id) FROM AppUser u WHERE u.BranchId=MentoringNotes.BranchId AND u.FullName=MentoringNotes.Author HAVING COUNT(*)=1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActorId",
                table: "MentoringNotes");

            migrationBuilder.DropColumn(
                name: "RepId",
                table: "MentoringNotes");

            migrationBuilder.DropColumn(
                name: "ActorId",
                table: "Interactions");

            migrationBuilder.DropColumn(
                name: "ActorId",
                table: "Activities");
        }
    }
}

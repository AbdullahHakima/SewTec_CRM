using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SewTec.CRM.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class LegacyBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUser",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUser", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    IsVip = table.Column<bool>(type: "INTEGER", nullable: false),
                    Phone = table.Column<string>(type: "TEXT", nullable: false),
                    PhoneSecondary = table.Column<string>(type: "TEXT", nullable: true),
                    ContactPerson = table.Column<string>(type: "TEXT", nullable: true),
                    Address = table.Column<string>(type: "TEXT", nullable: false),
                    City = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedRepId = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedRepName = table.Column<string>(type: "TEXT", nullable: false),
                    LifetimeSales = table.Column<decimal>(type: "TEXT", nullable: false),
                    OpenPipelineValue = table.Column<decimal>(type: "TEXT", nullable: false),
                    LastContactAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NextFollowUpAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MentoringNotes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    RepName = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    Author = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MentoringNotes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Model = table.Column<string>(type: "TEXT", nullable: false),
                    Brand = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    SuggestedPriceEgp = table.Column<decimal>(type: "TEXT", nullable: false),
                    DescriptionArabic = table.Column<string>(type: "TEXT", nullable: false),
                    SpeedRpm = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxStitchLengthMm = table.Column<decimal>(type: "TEXT", nullable: false),
                    NeedleSystem = table.Column<string>(type: "TEXT", nullable: false),
                    MotorType = table.Column<string>(type: "TEXT", nullable: false),
                    HasAutomaticTrimmer = table.Column<bool>(type: "INTEGER", nullable: false),
                    HasAutoFootLifter = table.Column<bool>(type: "INTEGER", nullable: false),
                    HasReverseStitch = table.Column<bool>(type: "INTEGER", nullable: false),
                    LubricationType = table.Column<string>(type: "TEXT", nullable: false),
                    WarrantyMonths = table.Column<int>(type: "INTEGER", nullable: false),
                    InStock = table.Column<bool>(type: "INTEGER", nullable: false),
                    StockCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Application = table.Column<string>(type: "TEXT", nullable: false),
                    FeaturesJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PerformedBy = table.Column<string>(type: "TEXT", nullable: false),
                    MetadataJson = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Activities_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FollowUps",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerName = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerPhone = table.Column<string>(type: "TEXT", nullable: false),
                    Channel = table.Column<string>(type: "TEXT", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Topic = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedRepId = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedRepName = table.Column<string>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Outcome = table.Column<string>(type: "TEXT", nullable: true),
                    OutcomeNote = table.Column<string>(type: "TEXT", nullable: true),
                    NextFollowUpId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FollowUps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FollowUps_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InstalledMachines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false),
                    Model = table.Column<string>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    SerialNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PurchaseYear = table.Column<int>(type: "INTEGER", nullable: false),
                    PurchasedFromSewTec = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstalledMachines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InstalledMachines_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Interactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerName = table.Column<string>(type: "TEXT", nullable: false),
                    Channel = table.Column<string>(type: "TEXT", nullable: false),
                    Outcome = table.Column<string>(type: "TEXT", nullable: false),
                    Summary = table.Column<string>(type: "TEXT", nullable: false),
                    UninterestedReason = table.Column<string>(type: "TEXT", nullable: true),
                    PerformedBy = table.Column<string>(type: "TEXT", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FollowUpId = table.Column<string>(type: "TEXT", nullable: true),
                    OpportunityId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Interactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Interactions_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Opportunities",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerId = table.Column<string>(type: "TEXT", nullable: false),
                    CustomerName = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    MachineModel = table.Column<string>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedValue = table.Column<decimal>(type: "TEXT", nullable: true),
                    Stage = table.Column<string>(type: "TEXT", nullable: false),
                    StageUpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AssignedRepId = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedRepName = table.Column<string>(type: "TEXT", nullable: false),
                    ExpectedCloseDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    QuotationRef = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Opportunities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Opportunities_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Activities_CustomerId",
                table: "Activities",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUser_Username",
                table: "AppUser",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_BranchId",
                table: "Customers",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Phone",
                table: "Customers",
                column: "Phone");

            migrationBuilder.CreateIndex(
                name: "IX_FollowUps_CustomerId",
                table: "FollowUps",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_FollowUps_Status",
                table: "FollowUps",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InstalledMachines_CustomerId",
                table: "InstalledMachines",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Interactions_CustomerId",
                table: "Interactions",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunities_CustomerId",
                table: "Opportunities",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunities_Stage",
                table: "Opportunities",
                column: "Stage");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "AppUser");

            migrationBuilder.DropTable(
                name: "FollowUps");

            migrationBuilder.DropTable(
                name: "InstalledMachines");

            migrationBuilder.DropTable(
                name: "Interactions");

            migrationBuilder.DropTable(
                name: "MentoringNotes");

            migrationBuilder.DropTable(
                name: "Opportunities");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Customers");
        }
    }
}

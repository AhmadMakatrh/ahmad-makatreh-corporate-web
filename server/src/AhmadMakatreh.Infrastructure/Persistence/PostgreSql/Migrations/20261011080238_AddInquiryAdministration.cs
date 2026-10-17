using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql.Migrations
{
    /// <inheritdoc />
    public partial class AddInquiryAdministration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "NotificationAttemptedAtUtc",
                table: "inquiries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotificationStatus",
                table: "inquiries",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_inquiries_created_id",
                table: "inquiries",
                columns: new[] { "CreatedAtUtc", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_inquiries_created_id",
                table: "inquiries");

            migrationBuilder.DropColumn(
                name: "NotificationAttemptedAtUtc",
                table: "inquiries");

            migrationBuilder.DropColumn(
                name: "NotificationStatus",
                table: "inquiries");
        }
    }
}

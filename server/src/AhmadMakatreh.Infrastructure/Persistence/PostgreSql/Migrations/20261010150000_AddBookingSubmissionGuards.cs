using AhmadMakatreh.Infrastructure.Persistence.PostgreSql;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261010150000_AddBookingSubmissionGuards")]
public partial class AddBookingSubmissionGuards : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "booking_submission_guards",
            columns: table => new
            {
                ip_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                payload_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                attempt_count = table.Column<int>(type: "integer", nullable: false),
                window_started_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                blocked_until_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                expires_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("pk_booking_submission_guards", x => x.ip_hash));

        migrationBuilder.CreateIndex(
            name: "ix_booking_submission_guards_expires_at_utc",
            table: "booking_submission_guards",
            column: "expires_at_utc");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "booking_submission_guards");
    }
}

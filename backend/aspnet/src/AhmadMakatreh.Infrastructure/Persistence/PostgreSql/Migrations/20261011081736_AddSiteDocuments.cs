using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "site_documents",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DraftJson = table.Column<string>(type: "jsonb", nullable: false),
                    PublishedJson = table.Column<string>(type: "jsonb", nullable: true),
                    PreviousPublishedJson = table.Column<string>(type: "jsonb", nullable: true),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_documents", x => x.Key);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "site_documents");
        }
    }
}

// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AppDbContext
using AhmadMakatreh.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using DbContextOptionsOfAppDbContextRef = global::Microsoft.EntityFrameworkCore.DbContextOptions<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext>;
using DbSetOfSiteDocumentVersionRef = global::Microsoft.EntityFrameworkCore.DbSet<global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion>;
using DbSetOfSiteDocumentRef = global::Microsoft.EntityFrameworkCore.DbSet<global::AhmadMakatreh.Domain.Entities.SiteDocument>;
using SiteDocumentVersionRef = global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion;
using DbSetOfInquiryReplyRef = global::Microsoft.EntityFrameworkCore.DbSet<global::AhmadMakatreh.Domain.Entities.InquiryReply>;
using DbSetOfMediaAssetRef = global::Microsoft.EntityFrameworkCore.DbSet<global::AhmadMakatreh.Domain.Entities.MediaAsset>;
using DbSetOfInquiryRef = global::Microsoft.EntityFrameworkCore.DbSet<global::AhmadMakatreh.Domain.Entities.Inquiry>;
using DeleteBehaviorRef = global::Microsoft.EntityFrameworkCore.DeleteBehavior;
using SiteDocumentRef = global::AhmadMakatreh.Domain.Entities.SiteDocument;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using ModelBuilderRef = global::Microsoft.EntityFrameworkCore.ModelBuilder;
using MediaAssetRef = global::AhmadMakatreh.Domain.Entities.MediaAsset;
using DbContextRef = global::Microsoft.EntityFrameworkCore.DbContext;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

/// <summary>
/// Entity Framework Core database context for PostgreSQL.
/// </summary>
public class AppDbContext : DbContextRef
{
    public AppDbContext(DbContextOptionsOfAppDbContextRef options) : base(options) { }

    public DbSetOfInquiryRef Inquiries => Set<InquiryRef>();
    public DbSetOfSiteDocumentRef SiteDocuments => Set<SiteDocumentRef>();
    public DbSetOfSiteDocumentVersionRef SiteDocumentVersions => Set<SiteDocumentVersionRef>();
    public DbSetOfMediaAssetRef MediaAssets => Set<MediaAssetRef>();
    public DbSetOfInquiryReplyRef InquiryReplies => Set<InquiryReplyRef>();

    protected override void OnModelCreating(ModelBuilderRef modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<InquiryReplyRef>(builder =>
        {
            builder.ToTable("inquiry_replies"); builder.HasKey(r => r.Id); builder.Property(r => r.Subject).HasMaxLength(200);
            builder.Property(r => r.Body).HasMaxLength(10000); builder.Property(r => r.Actor).HasMaxLength(255); builder.Property(r => r.Status).HasMaxLength(30);
            builder.HasIndex(r => new { r.InquiryId, r.CreatedAtUtc, r.Id }); builder.HasOne<InquiryRef>().WithMany().HasForeignKey(r => r.InquiryId).OnDelete(DeleteBehaviorRef.Restrict);
        });
        modelBuilder.Entity<MediaAssetRef>(builder =>
        {
            builder.ToTable("media_assets"); builder.HasKey(m => m.Id);
            builder.Property(m => m.ObjectKey).HasMaxLength(100); builder.Property(m => m.Url).HasMaxLength(2048);
            builder.Property(m => m.OriginalName).HasMaxLength(200); builder.Property(m => m.ContentType).HasMaxLength(100);
            builder.Property(m => m.Sha256).HasMaxLength(64); builder.Property(m => m.Actor).HasMaxLength(255);
            builder.HasIndex(m => new { m.CreatedAtUtc, m.Id });
        });
        modelBuilder.Entity<SiteDocumentRef>(builder =>
        {
            builder.ToTable("site_documents"); builder.HasKey(d => d.Key);
            builder.Property(d => d.Key).HasMaxLength(30);
            builder.Property(d => d.DraftJson).HasColumnType("jsonb");
            builder.Property(d => d.PublishedJson).HasColumnType("jsonb");
            builder.Property(d => d.PreviousPublishedJson).HasColumnType("jsonb");
            builder.Ignore(d => d.History);
        });
        modelBuilder.Entity<SiteDocumentVersionRef>(builder =>
        {
            builder.ToTable("site_document_versions"); builder.HasKey(v => new { v.DocumentKey, v.Revision });
            builder.Property(v => v.DocumentKey).HasMaxLength(30); builder.Property(v => v.Action).HasMaxLength(30);
            builder.Property(v => v.Actor).HasMaxLength(255); builder.Property(v => v.DataJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<InquiryRef>(builder =>
        {
            builder.ToTable("inquiries");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.ReferenceId)
                .HasMaxLength(50)
                .IsRequired();

            builder.HasIndex(i => i.ReferenceId)
                .IsUnique()
                .HasDatabaseName("ix_inquiries_reference_id");

            builder.Property(i => i.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(i => i.Email)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(i => i.ProjectDetails)
                .HasMaxLength(4000)
                .IsRequired();

            builder.Property(i => i.ServiceKey)
                .HasMaxLength(30);

            builder.Property(i => i.InquiryCategory)
                .HasMaxLength(30);

            builder.Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(i => i.CreatedAtUtc)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            builder.Property(i => i.UpdatedAtUtc)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            builder.Property(i => i.NotificationStatus).HasMaxLength(30);
            builder.Property(i => i.AdminNotes).HasMaxLength(10000).HasDefaultValue(string.Empty);
            builder.Property(i => i.NotesUpdatedBy).HasMaxLength(255);
            builder.Property(i => i.NotificationAttemptedAtUtc).HasColumnType("timestamp with time zone");
            builder.HasIndex(i => new { i.CreatedAtUtc, i.Id }).HasDatabaseName("ix_inquiries_created_id");
        });
    }
}

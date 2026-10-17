// codeguard:components:start
// codeguard:defines: PostgreSqlSiteDocumentRepository
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TaskOfIReadOnlyDictionaryRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyDictionary<string, string>>;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Application.Interfaces.SiteVersionSummary>>;
using TaskOfIReadOnlyListRef2 = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.SiteDocument>>;
using TaskOfSiteDocumentVersionRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion?>;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using TaskOfSiteDocumentRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocument?>;
using SiteVersionSummaryRef = global::AhmadMakatreh.Application.Interfaces.SiteVersionSummary;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

public class PostgreSqlSiteDocumentRepository(AppDbContextRef context) : ISiteDocumentRepositoryRef
{
    public TaskOfSiteDocumentRef GetAsync(string key, CancellationTokenRef token) => context.SiteDocuments.AsNoTracking().FirstOrDefaultAsync(d => d.Key == key, token);

    public async TaskOfBooleanRef SaveDraftAsync(string key, string json, long expectedRevision, CancellationTokenRef token, string actor = "system", string action = "save")
    {
        if (expectedRevision == 0)
            return await context.Database.ExecuteSqlInterpolatedAsync($"""
                WITH changed AS (
                    INSERT INTO site_documents ("Key", "DraftJson", "Revision", "UpdatedAtUtc")
                    VALUES ({key}, CAST({json} AS jsonb), 1, now()) ON CONFLICT ("Key") DO NOTHING RETURNING *
                ) INSERT INTO site_document_versions ("DocumentKey", "Revision", "Action", "Actor", "CreatedAtUtc", "DataJson")
                  SELECT "Key", "Revision", {action}, {actor}, "UpdatedAtUtc", "DraftJson" FROM changed
                """, token) == 1;
        return await context.Database.ExecuteSqlInterpolatedAsync($"""
            WITH changed AS (
                UPDATE site_documents SET "DraftJson" = CAST({json} AS jsonb), "Revision" = "Revision" + 1, "UpdatedAtUtc" = now()
                WHERE "Key" = {key} AND "Revision" = {expectedRevision} RETURNING *
            ) INSERT INTO site_document_versions ("DocumentKey", "Revision", "Action", "Actor", "CreatedAtUtc", "DataJson")
              SELECT "Key", "Revision", {action}, {actor}, "UpdatedAtUtc", "DraftJson" FROM changed
            """, token) == 1;
    }

    public async TaskOfBooleanRef PublishAsync(string key, long expectedRevision, bool restorePrevious, CancellationTokenRef token, string actor = "system")
    {
        if (restorePrevious)
            return await context.Database.ExecuteSqlInterpolatedAsync($"""
                WITH changed AS (
                    UPDATE site_documents SET "PublishedJson" = "PreviousPublishedJson", "PreviousPublishedJson" = "PublishedJson",
                        "Revision" = "Revision" + 1, "PublishedAtUtc" = now(), "UpdatedAtUtc" = now()
                    WHERE "Key" = {key} AND "Revision" = {expectedRevision} AND "PreviousPublishedJson" IS NOT NULL RETURNING *
                ) INSERT INTO site_document_versions ("DocumentKey", "Revision", "Action", "Actor", "CreatedAtUtc", "DataJson")
                  SELECT "Key", "Revision", 'rollbackPublished', {actor}, "UpdatedAtUtc", "PublishedJson" FROM changed
                """, token) == 1;
        return await context.Database.ExecuteSqlInterpolatedAsync($"""
            WITH changed AS (
                UPDATE site_documents SET "PreviousPublishedJson" = "PublishedJson", "PublishedJson" = "DraftJson",
                    "Revision" = "Revision" + 1, "PublishedAtUtc" = now(), "UpdatedAtUtc" = now()
                WHERE "Key" = {key} AND "Revision" = {expectedRevision} AND ("PublishedJson" IS NULL OR "DraftJson" != "PublishedJson") RETURNING *
            ) INSERT INTO site_document_versions ("DocumentKey", "Revision", "Action", "Actor", "CreatedAtUtc", "DataJson")
              SELECT "Key", "Revision", 'publish', {actor}, "UpdatedAtUtc", "PublishedJson" FROM changed
            """, token) == 1;
    }

    public async TaskOfIReadOnlyDictionaryRef GetPublishedAsync(CancellationTokenRef token) =>
        await context.SiteDocuments.AsNoTracking().Where(d => d.PublishedJson != null)
            .Select(d => new { d.Key, d.PublishedJson }).ToDictionaryAsync(d => d.Key, d => d.PublishedJson!, token);

    public async TaskOfIReadOnlyListRef2 GetDocumentsAsync(CancellationTokenRef token) =>
        await context.SiteDocuments.AsNoTracking().Where(d => d.Key == "content" || d.Key == "pages" || d.Key == "pricing").Take(3).ToListAsync(token);
    public async TaskOfIReadOnlyListRef HistoryAsync(string key, long beforeRevision, int limit, CancellationTokenRef token) =>
        await context.SiteDocumentVersions.AsNoTracking().Where(v => v.DocumentKey == key && v.Revision < beforeRevision).OrderByDescending(v => v.Revision)
            .Take(limit).Select(v => new SiteVersionSummaryRef(v.Revision, v.Action, v.Actor, v.CreatedAtUtc)).ToListAsync(token);
    public TaskOfSiteDocumentVersionRef VersionAsync(string key, long revision, CancellationTokenRef token) =>
        context.SiteDocumentVersions.AsNoTracking().FirstOrDefaultAsync(v => v.DocumentKey == key && v.Revision == revision, token);
}

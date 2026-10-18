// codeguard:components:start
// codeguard:defines: PostgreSqlMediaRepository
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.MediaAsset>>;
using TaskOfMediaAssetRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.MediaAsset?>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IMediaRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IMediaRepository;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using MediaAssetRef = global::AhmadMakatreh.Domain.Entities.MediaAsset;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

public class PostgreSqlMediaRepository(AppDbContextRef context) : IMediaRepositoryRef
{
    public TaskOfMediaAssetRef GetAsync(GuidRef id, CancellationTokenRef token) => context.MediaAssets.AsNoTracking().FirstOrDefaultAsync(row => row.Id == id, token);
    public async TaskOfIReadOnlyListRef ListAsync(DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token) =>
        await context.MediaAssets.AsNoTracking().Where(row => !row.Archived && (beforeDate == null || row.CreatedAtUtc < beforeDate || (row.CreatedAtUtc == beforeDate && row.Id.CompareTo(beforeId!.Value) < 0)))
            .OrderByDescending(row => row.CreatedAtUtc).ThenByDescending(row => row.Id).Take(limit).ToListAsync(token);
    public async TaskOfBooleanRef AddAsync(MediaAssetRef asset, CancellationTokenRef token) => await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO media_assets ("Id", "ObjectKey", "Url", "OriginalName", "ContentType", "Sha256", "Size", "CreatedAtUtc", "Actor", "Archived")
        VALUES ({asset.Id}, {asset.ObjectKey}, {asset.Url}, {asset.OriginalName}, {asset.ContentType}, {asset.Sha256}, {asset.Size}, {asset.CreatedAtUtc}, {asset.Actor}, false)
        ON CONFLICT ("Id") DO NOTHING
        """, token) == 1;
    public async TaskOfBooleanRef ArchiveAsync(GuidRef id, CancellationTokenRef token) => await context.MediaAssets.Where(row => row.Id == id && !row.Archived).ExecuteUpdateAsync(set => set.SetProperty(row => row.Archived, true), token) == 1;
}

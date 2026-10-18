// codeguard:components:start
// codeguard:defines: AdminMediaEndpoints
using System.Security.Cryptography;
using System.Text.Json;
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Validation;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Storage;
using Microsoft.AspNetCore.Http.Features;
using IHttpMaxRequestBodySizeFeatureRef = global::Microsoft.AspNetCore.Http.Features.IHttpMaxRequestBodySizeFeature;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using LocalMediaStorageRef = global::AhmadMakatreh.Infrastructure.Storage.LocalMediaStorage;
using ArgumentExceptionRef = global::System.ArgumentException;
using IMediaRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IMediaRepository;
using ILoggerFactoryRef = global::Microsoft.Extensions.Logging.ILoggerFactory;
using MediaValidatorRef = global::AhmadMakatreh.Application.Validation.MediaValidator;
using IMediaStorageRef = global::AhmadMakatreh.Application.Interfaces.IMediaStorage;
using InquiryPagingRef = global::AhmadMakatreh.Application.Models.InquiryPaging;
using JsonValueKindRef = global::System.Text.Json.JsonValueKind;
using MemoryStreamRef = global::System.IO.MemoryStream;
using JsonDocumentRef = global::System.Text.Json.JsonDocument;
using HttpContextRef = global::Microsoft.AspNetCore.Http.HttpContext;
using JsonElementRef = global::System.Text.Json.JsonElement;
using MediaAssetRef = global::AhmadMakatreh.Domain.Entities.MediaAsset;
using ExceptionRef = global::System.Exception;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using ConvertRef = global::System.Convert;
using SHA256Ref = global::System.Security.Cryptography.SHA256;
using GuidRef = global::System.Guid;
using PathRef = global::System.IO.Path;
using FileRef = global::System.IO.File;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Api.Endpoints;

public static class AdminMediaEndpoints
{
    public static IEndpointRouteBuilderRef MapAdminMediaEndpoints(this IEndpointRouteBuilderRef app)
    {
        var group = app.MapAdminGroup();
        group.MapGet("/media", async (string? cursor, IMediaRepositoryRef repository, IMediaStorageRef storage, CancellationTokenRef token) =>
        {
            if (!InquiryPagingRef.TryParse(cursor, out var before, out var id)) return ResultsRef.BadRequest(new { message = "Invalid cursor." });
            var rows = await repository.ListAsync(before, id, 26, token);
            return ResultsRef.Ok(new { items = rows.Take(25).Select(PublicAsset), configured = storage.IsConfigured,
                nextCursor = rows.Count > 25 ? InquiryPagingRef.Cursor(rows[24].CreatedAtUtc, rows[24].Id) : null });
        });
        group.MapPost("/media/{id:guid}", async (GuidRef id, string? name, HttpContextRef http, IMediaRepositoryRef repository, IMediaStorageRef storage, ILoggerFactoryRef logs, CancellationTokenRef token) =>
        {
            if (!storage.IsConfigured) return ResultsRef.Problem(statusCode: 503, title: "Media storage is not configured.");
            if (id == GuidRef.Empty || string.IsNullOrWhiteSpace(name) || name.Length > 200 || name.Any(char.IsControl)) return ResultsRef.BadRequest(new { message = "Invalid file name or upload ID." });
            var bodyLimit = http.Features.Get<IHttpMaxRequestBodySizeFeatureRef>();
            if (bodyLimit is { IsReadOnly: false }) bodyLimit.MaxRequestBodySize = MediaValidatorRef.MaxBytes;
            if (http.Request.ContentLength > MediaValidatorRef.MaxBytes) return ResultsRef.StatusCode(413);
            using var memory = new MemoryStreamRef(); var buffer = new byte[81920]; int count;
            while ((count = await http.Request.Body.ReadAsync(buffer, token)) > 0)
            {
                if (memory.Length + count > MediaValidatorRef.MaxBytes) return ResultsRef.StatusCode(413);
                memory.Write(buffer, 0, count);
            }
            var bytes = memory.ToArray(); var format = MediaValidatorRef.Detect(bytes);
            if (format is null) return ResultsRef.BadRequest(new { message = "Only PNG, JPEG, WebP and PDF files up to 10 MiB are supported." });
            var hash = ConvertRef.ToHexStringLower(SHA256Ref.HashData(bytes));
            var existing = await repository.GetAsync(id, token);
            if (existing is not null) return existing.Sha256 == hash && !existing.Archived ? ResultsRef.Ok(PublicAsset(existing)) : ResultsRef.Conflict(new { message = "Upload ID already used for a different or archived file." });
            var key = GuidRef.NewGuid().ToString("N") + format.Value.Extension;
            try { await storage.PutAsync(key, bytes, format.Value.ContentType, token); }
            catch (ExceptionRef exception) when (!token.IsCancellationRequested)
            {
                logs.CreateLogger("AdminMedia").LogError("Media storage unavailable: {ErrorType}.", exception.GetType().Name);
                return ResultsRef.Problem(statusCode: 503, title: "Media storage unavailable. No asset was saved.");
            }
            var asset = new MediaAssetRef { Id = id, ObjectKey = key, Url = storage.PublicUrl(key), OriginalName = PathRef.GetFileName(name.Replace('\\', '/')),
                ContentType = format.Value.ContentType, Sha256 = hash, Size = bytes.Length, CreatedAtUtc = DateTimeRef.UtcNow, Actor = http.User.FindFirst("email")?.Value ?? "unknown" };
            bool added;
            try { added = await repository.AddAsync(asset, token); }
            catch (ExceptionRef)
            {
                // A commit may have succeeded before the connection failed; retain the object rather than deleting a possibly referenced file.
                logs.CreateLogger("AdminMedia").LogError("Media metadata persistence failed. Reconcile orphaned objects during maintenance."); throw;
            }
            if (added) return ResultsRef.Ok(PublicAsset(asset));
            await storage.DeleteAsync(key, token);
            existing = await repository.GetAsync(id, token);
            return existing?.Sha256 == hash && !existing.Archived ? ResultsRef.Ok(PublicAsset(existing)) : ResultsRef.Conflict(new { message = "Upload ID conflict." });
        }).RequireRateLimiting("AdminUploadPolicy");
        group.MapPost("/media/{id:guid}/archive", async (GuidRef id, IMediaRepositoryRef repository, ISiteDocumentRepositoryRef documents, CancellationTokenRef token) =>
        {
            var asset = await repository.GetAsync(id, token);
            if (asset is null) return ResultsRef.NotFound();
            if (asset.Archived) return ResultsRef.NoContent();
            var current = await documents.GetDocumentsAsync(token);
            if (current.Any(document => References(document.DraftJson, asset.Url) || References(document.PublishedJson, asset.Url)))
                return ResultsRef.Conflict(new { code = "media_referenced", message = "File is referenced in a draft or published document." });
            await repository.ArchiveAsync(id, token);
            // Library removal is reversible at storage level; URLs remain valid across concurrent publication and history restores.
            return ResultsRef.NoContent();
        });
        app.MapGet("/api/media/{key}", (string key, IMediaStorageRef storage, HttpContextRef http) =>
        {
            if (storage is not LocalMediaStorageRef local) return ResultsRef.NotFound();
            string path; try { path = local.PathFor(key); } catch (ArgumentExceptionRef) { return ResultsRef.NotFound(); }
            if (!FileRef.Exists(path)) return ResultsRef.NotFound();
            var type = PathRef.GetExtension(key) switch { ".png" => "image/png", ".jpg" => "image/jpeg", ".webp" => "image/webp", _ => "application/pdf" };
            http.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return ResultsRef.File(path, type, fileDownloadName: type == "application/pdf" ? key : null);
        });
        return app;
    }
    private static object PublicAsset(MediaAssetRef asset) => new { asset.Id, asset.Url, asset.OriginalName, asset.ContentType, asset.Size, asset.CreatedAtUtc };
    private static bool References(string? json, string url)
    {
        if (json is null) return false;
        using var document = JsonDocumentRef.Parse(json);
        return Contains(document.RootElement, url);
    }
    private static bool Contains(JsonElementRef node, string url) => node.ValueKind switch
    {
        JsonValueKindRef.String => node.GetString() == url,
        JsonValueKindRef.Array => node.EnumerateArray().Any(item => Contains(item, url)),
        JsonValueKindRef.Object => node.EnumerateObject().Any(property => Contains(property.Value, url)),
        _ => false
    };
}

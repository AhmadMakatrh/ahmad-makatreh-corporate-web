// codeguard:components:start
// codeguard:defines: AdminSiteEndpoints, DraftRequest, PublishRequest, RestoreRequest
using System.Text.Json;
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Validation;
using OperationCanceledExceptionRef = global::System.OperationCanceledException;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using SiteDocumentValidatorRef = global::AhmadMakatreh.Application.Validation.SiteDocumentValidator;
using IPublishedSiteReaderRef = global::AhmadMakatreh.Application.Interfaces.IPublishedSiteReader;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using PublishRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminSiteEndpoints.PublishRequest;
using RestoreRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminSiteEndpoints.RestoreRequest;
using ILoggerFactoryRef = global::Microsoft.Extensions.Logging.ILoggerFactory;
using DraftRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminSiteEndpoints.DraftRequest;
using JsonElementRef = global::System.Text.Json.JsonElement;
using HttpContextRef = global::Microsoft.AspNetCore.Http.HttpContext;
using ExceptionRef = global::System.Exception;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Api.Endpoints;

public static class AdminSiteEndpoints
{
    private static readonly string[] Keys = ["pricing", "content", "pages"];
    public static IEndpointRouteBuilderRef MapAdminSiteEndpoints(this IEndpointRouteBuilderRef app)
    {
        var group = app.MapAdminGroup();
        group.MapGet("/documents/{key}", async (string key, ISiteDocumentRepositoryRef store, CancellationTokenRef token) =>
        {
            if (!Keys.Contains(key)) return ResultsRef.NotFound();
            var document = await store.GetAsync(key, token);
            return ResultsRef.Ok(new { key, revision = document?.Revision ?? 0, draft = document is null ? (JsonElementRef?)null : JsonSerializerRef.Deserialize<JsonElementRef>(document.DraftJson),
                document?.PublishedAtUtc, hasPrevious = document?.PreviousPublishedJson is not null,
                isPublished = document is not null && document.DraftJson == document.PublishedJson });
        });
        group.MapPut("/documents/{key}", async (string key, DraftRequestRef request, HttpContextRef http, ISiteDocumentRepositoryRef store, CancellationTokenRef token) =>
        {
            if (!Keys.Contains(key)) return ResultsRef.NotFound();
            var error = SiteDocumentValidatorRef.Validate(key, request.Data);
            if (request.ExpectedRevision < 0 || error is not null) return ResultsRef.BadRequest(new { message = error ?? "Invalid revision." });
            var saved = await store.SaveDraftAsync(key, request.Data.GetRawText(), request.ExpectedRevision, token, Actor(http));
            return saved ? ResultsRef.Ok(new { revision = request.ExpectedRevision + 1 }) : ResultsRef.Conflict(new { message = "Document changed. Reload before saving." });
        });
        group.MapPost("/documents/{key}/publish", async (string key, PublishRequestRef request, HttpContextRef http, ISiteDocumentRepositoryRef store, IPublishedSiteReaderRef reader, CancellationTokenRef token) =>
        {
            if (!Keys.Contains(key)) return ResultsRef.NotFound();
            if (request.ExpectedRevision < 1) return ResultsRef.BadRequest(new { message = "Save a draft before publishing." });
            var saved = await store.PublishAsync(key, request.ExpectedRevision, request.RestorePrevious, token, Actor(http));
            if (!saved) return ResultsRef.Conflict(new { message = "Document changed, is already published, or previous publication is unavailable." });
            reader.Invalidate();
            return ResultsRef.Ok(new { revision = request.ExpectedRevision + 1, publishedAtUtc = DateTimeRef.UtcNow });
        });
        group.MapGet("/documents/{key}/history", async (string key, long? before, ISiteDocumentRepositoryRef store, CancellationTokenRef token) =>
        {
            if (!Keys.Contains(key)) return ResultsRef.NotFound();
            if (before <= 0) return ResultsRef.BadRequest(new { message = "Invalid revision cursor." });
            var rows = await store.HistoryAsync(key, before ?? long.MaxValue, 26, token);
            return ResultsRef.Ok(new { items = rows.Take(25), nextBefore = rows.Count > 25 ? (long?)rows[24].Revision : null });
        });
        group.MapPost("/documents/{key}/restore", async (string key, RestoreRequestRef request, HttpContextRef http, ISiteDocumentRepositoryRef store, CancellationTokenRef token) =>
        {
            if (!Keys.Contains(key)) return ResultsRef.NotFound();
            if (request.Revision < 1 || request.ExpectedRevision < 1) return ResultsRef.BadRequest(new { message = "Invalid revision." });
            var version = await store.VersionAsync(key, request.Revision, token);
            if (version is null) return ResultsRef.NotFound();
            var data = JsonSerializerRef.Deserialize<JsonElementRef>(version.DataJson);
            var error = SiteDocumentValidatorRef.Validate(key, data);
            if (error is not null) return ResultsRef.BadRequest(new { message = error });
            var saved = await store.SaveDraftAsync(key, version.DataJson, request.ExpectedRevision, token, Actor(http), $"restore:{request.Revision}");
            return saved ? ResultsRef.Ok(new { revision = request.ExpectedRevision + 1, draft = data }) : ResultsRef.Conflict(new { message = "Document changed. Reload before restoring." });
        });
        group.MapGet("/backup/documents", async (ISiteDocumentRepositoryRef store, CancellationTokenRef token) => ResultsRef.Ok(new
        {
            format = "ahmad-site-documents", version = 1, exportedAtUtc = DateTimeRef.UtcNow,
            documents = (await store.GetDocumentsAsync(token)).Select(d => new { key = d.Key, revision = d.Revision,
                draft = JsonSerializerRef.Deserialize<JsonElementRef>(d.DraftJson), published = d.PublishedJson is null ? (JsonElementRef?)null : JsonSerializerRef.Deserialize<JsonElementRef>(d.PublishedJson) })
        }));
        app.MapGet("/api/site", async (HttpContextRef http, IPublishedSiteReaderRef reader, ILoggerFactoryRef logs, CancellationTokenRef token) =>
        {
            try
            {
                var snapshot = await reader.ReadAsync(token);
                http.Response.Headers.ETag = snapshot.ETag;
                http.Response.Headers.CacheControl = "public, max-age=30";
                return http.Request.Headers.IfNoneMatch.ToString() == snapshot.ETag
                    ? ResultsRef.StatusCode(304) : ResultsRef.Content(snapshot.Json, "application/json");
            }
            catch (OperationCanceledExceptionRef) when (token.IsCancellationRequested) { throw; }
            catch (ExceptionRef exception)
            {
                logs.CreateLogger("PublishedSite").LogError("Published site unavailable: {ErrorType}.", exception.GetType().Name);
                http.Response.Headers.CacheControl = "no-store";
                return ResultsRef.Problem(statusCode: 503, title: "Published content unavailable.");
            }
        });
        return app;
    }

    public record DraftRequest(long ExpectedRevision, JsonElementRef Data);
    public record PublishRequest(long ExpectedRevision, bool RestorePrevious = false);
    public record RestoreRequest(long Revision, long ExpectedRevision);
    private static string Actor(HttpContextRef http) => http.User.FindFirst("email")?.Value ?? "unknown";
}

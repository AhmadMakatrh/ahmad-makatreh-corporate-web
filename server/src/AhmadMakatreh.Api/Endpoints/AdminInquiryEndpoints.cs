// codeguard:components:start
// codeguard:defines: AdminInquiryEndpoints, StatusRequest, NotesRequest, ReplyRequest, ExportRequest, InquiryBackup
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Enums;
using Microsoft.AspNetCore.Antiforgery;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Application.Validation;
using DateTimeStylesRef = global::System.Globalization.DateTimeStyles;
using CultureInfoRef = global::System.Globalization.CultureInfo;
using IAdminInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IAdminInquiryRepository;
using IInquiryReplyRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplyRepository;
using CancellationTokenSourceRef = global::System.Threading.CancellationTokenSource;
using SubmitBookingValidatorRef = global::AhmadMakatreh.Application.Validation.SubmitBookingValidator;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using IInquiryReplySenderRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplySender;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using InquiryCategoriesRef = global::AhmadMakatreh.Application.Models.InquiryCategories;
using ILoggerFactoryRef = global::Microsoft.Extensions.Logging.ILoggerFactory;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using InquiryPagingRef = global::AhmadMakatreh.Application.Models.InquiryPaging;
using InquiryFilterRef = global::AhmadMakatreh.Application.Models.InquiryFilter;
using StatusRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminInquiryEndpoints.StatusRequest;
using ExportRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminInquiryEndpoints.ExportRequest;
using InquiryBackupRef = global::AhmadMakatreh.Api.Endpoints.AdminInquiryEndpoints.InquiryBackup;
using IAntiforgeryRef = global::Microsoft.AspNetCore.Antiforgery.IAntiforgery;
using DateTimeKindRef = global::System.DateTimeKind;
using NotesRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminInquiryEndpoints.NotesRequest;
using ReplyRequestRef = global::AhmadMakatreh.Api.Endpoints.AdminInquiryEndpoints.ReplyRequest;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using HttpContextRef = global::Microsoft.AspNetCore.Http.HttpContext;
using ExceptionRef = global::System.Exception;
using TimeSpanRef = global::System.TimeSpan;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
using EnumRef = global::System.Enum;
// codeguard:components:end

namespace AhmadMakatreh.Api.Endpoints;

public static class AdminInquiryEndpoints
{
    public static readonly string[] NotificationStates = ["accepted", "failed", "disabled", "timedOut", "unknown"];

    public static IEndpointRouteBuilderRef MapAdminInquiryEndpoints(this IEndpointRouteBuilderRef app)
    {
        var group = app.MapAdminGroup();
        group.MapGet("/session", (HttpContextRef http, IAntiforgeryRef antiforgery) =>
            ResultsRef.Ok(new { email = http.User.FindFirst("email")?.Value, csrfToken = antiforgery.GetAndStoreTokens(http).RequestToken }));

        group.MapGet("/inquiries", async (HttpContextRef http, IAdminInquiryRepositoryRef repository, CancellationTokenRef token) =>
        {
            var q = http.Request.Query;
            var search = q["search"].ToString().Trim(); var category = q["category"].ToString();
            var statusText = q["status"].ToString(); var notification = q["notificationStatus"].ToString();
            InquiryStatusRef? status = null;
            if (statusText.Length > 0)
            {
                if (!EnumRef.TryParse<InquiryStatusRef>(statusText, out var parsed) || !EnumRef.IsDefined(parsed))
                    return ResultsRef.BadRequest(new { message = "Invalid inquiry status." });
                status = parsed;
            }
            var pageSize = 25;
            if (q.ContainsKey("pageSize") && (!int.TryParse(q["pageSize"], out pageSize) || pageSize < 1 || pageSize > 100))
                return ResultsRef.BadRequest(new { message = "Page size must be between 1 and 100." });
            if (search.Length > 100 || category.Length > 30 || (category.Length > 0 && InquiryCategoriesRef.GetDetails(category) is null)
                || (notification.Length > 0 && !NotificationStates.Contains(notification)))
                return ResultsRef.BadRequest(new { message = "Invalid inquiry filters." });
            if (!InquiryPagingRef.TryParse(q["cursor"], out var before, out var id))
                return ResultsRef.BadRequest(new { message = "Invalid inquiry cursor." });
            if (!TryDate(q["from"], out var from) || !TryDate(q["to"], out var to)
                || (to is not null && to >= DateTimeRef.MaxValue.Date) || (from is not null && to is not null && from > to))
                return ResultsRef.BadRequest(new { message = "Invalid date range." });
            var filter = new InquiryFilterRef(search, category, status, notification, from, to?.AddDays(1), pageSize, before, id);
            return ResultsRef.Ok(await repository.ListAsync(filter, token));
        });

        group.MapGet("/inquiries/{id:guid}", async (GuidRef id, IAdminInquiryRepositoryRef repository, IInquiryReplySenderRef sender, CancellationTokenRef token) =>
        {
            var inquiry = await repository.GetAsync(id, token);
            return inquiry is null ? ResultsRef.NotFound() : ResultsRef.Ok(new
            {
                inquiry.Id, inquiry.ReferenceId, inquiry.Name, inquiry.Email, inquiry.ProjectDetails,
                inquiry.InquiryCategory, inquiry.ServiceKey, status = inquiry.Status.ToString(),
                inquiry.NotificationStatus, inquiry.NotificationAttemptedAtUtc, inquiry.CreatedAtUtc, inquiry.UpdatedAtUtc,
                inquiry.AdminNotes, inquiry.NotesUpdatedBy, replyEnabled = sender.IsConfigured
            });
        });

        group.MapPatch("/inquiries/{id:guid}/status", async (GuidRef id, StatusRequestRef request, IAdminInquiryRepositoryRef repository, CancellationTokenRef token) =>
        {
            if (!EnumRef.TryParse<InquiryStatusRef>(request.Status, out var status) || !EnumRef.IsDefined(status) || request.ExpectedUpdatedAtUtc.Kind != DateTimeKindRef.Utc)
                return ResultsRef.BadRequest(new { message = "Invalid inquiry status or revision." });
            // PostgreSQL stores microsecond precision; returning the same precision avoids false conflicts.
            var now = DateTimeRef.UtcNow;
            var updatedAt = new DateTimeRef(now.Ticks - now.Ticks % 10, DateTimeKindRef.Utc);
            var updated = await repository.UpdateStatusAsync(id, status, request.ExpectedUpdatedAtUtc, updatedAt, token);
            return updated ? ResultsRef.Ok(new { id, status = status.ToString(), updatedAtUtc = updatedAt })
                : ResultsRef.Conflict(new { message = "The request changed. Reload its details before saving." });
        });
        group.MapPatch("/inquiries/{id:guid}/notes", async (GuidRef id, NotesRequestRef request, HttpContextRef http, IAdminInquiryRepositoryRef repository, CancellationTokenRef token) =>
        {
            if (request.Notes is null || request.Notes.Length > 10000 || request.ExpectedUpdatedAtUtc.Kind != DateTimeKindRef.Utc) return ResultsRef.BadRequest(new { message = "Invalid notes or revision." });
            var updatedAt = Timestamp(); var actor = http.User.FindFirst("email")?.Value ?? "unknown";
            var saved = await repository.UpdateNotesAsync(id, request.Notes, actor, request.ExpectedUpdatedAtUtc, updatedAt, token);
            return saved ? ResultsRef.Ok(new { id, adminNotes = request.Notes, notesUpdatedBy = actor, updatedAtUtc = updatedAt }) : ResultsRef.Conflict(new { message = "Inquiry changed. Reload before saving." });
        });
        group.MapGet("/inquiries/{id:guid}/replies", async (GuidRef id, string? cursor, IInquiryReplyRepositoryRef repository, CancellationTokenRef token) =>
        {
            if (!InquiryPagingRef.TryParse(cursor, out var before, out var beforeId)) return ResultsRef.BadRequest(new { message = "Invalid cursor." });
            var rows = await repository.ListAsync(id, before, beforeId, 26, token);
            return ResultsRef.Ok(new { items = rows.Take(25), nextCursor = rows.Count > 25 ? InquiryPagingRef.Cursor(rows[24].CreatedAtUtc, rows[24].Id) : null });
        });
        group.MapPost("/inquiries/{id:guid}/replies", async (GuidRef id, ReplyRequestRef request, HttpContextRef http, IAdminInquiryRepositoryRef inquiries, IInquiryReplyRepositoryRef replies, IInquiryReplySenderRef sender, ILoggerFactoryRef logs, CancellationTokenRef token) =>
        {
            if (request.OperationId == GuidRef.Empty || string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Length > 200 || request.Subject.Any(char.IsControl)
                || string.IsNullOrWhiteSpace(request.Body) || request.Body.Length > 10000) return ResultsRef.BadRequest(new { message = "Invalid reply subject, body or operation ID." });
            var existing = await replies.GetAsync(request.OperationId, token);
            if (existing is not null) return SameReply(existing, id, request) ? ResultsRef.Ok(existing) : ResultsRef.Conflict(new { message = "Reply ID was used for a different message." });
            if (!sender.IsConfigured) return ResultsRef.Problem(statusCode: 503, title: "SMTP replies are not configured.");
            var inquiry = await inquiries.GetAsync(id, token);
            if (inquiry is null) return ResultsRef.NotFound();
            var reply = new InquiryReplyRef { Id = request.OperationId, InquiryId = id, Subject = request.Subject, Body = request.Body, Actor = http.User.FindFirst("email")?.Value ?? "unknown", CreatedAtUtc = Timestamp() };
            if (!await replies.AddAsync(reply, token))
            {
                existing = await replies.GetAsync(request.OperationId, token);
                return existing is not null && SameReply(existing, id, request) ? ResultsRef.Ok(existing) : ResultsRef.Conflict(new { message = "Reply ID conflict." });
            }
            string status;
            try { status = await sender.SendAsync(inquiry, reply, token); }
            catch (ExceptionRef exception)
            {
                logs.CreateLogger("InquiryReply").LogError("Reply dispatch outcome is unknown: {ErrorType}.", exception.GetType().Name); status = "unknown";
            }
            // Persist the outcome even if the requesting browser disconnected. A pending/unknown reply is never resent automatically.
            using var completion = new CancellationTokenSourceRef(TimeSpanRef.FromSeconds(5));
            await replies.CompleteAsync(reply.Id, status, completion.Token);
            reply.Status = status; reply.CompletedAtUtc = Timestamp(); return ResultsRef.Ok(reply);
        }).RequireRateLimiting("AdminReplyPolicy");
        group.MapPost("/inquiries/export", async (ExportRequestRef request, IAdminInquiryRepositoryRef repository, CancellationTokenRef token) =>
        {
            if (request.Ids is null || request.Ids.Length is < 1 or > 100 || request.Ids.Distinct().Count() != request.Ids.Length) return ResultsRef.BadRequest(new { message = "Export 1–100 unique inquiries per file." });
            return ResultsRef.Ok(new { format = "ahmad-site-inquiries", version = 1, exportedAtUtc = DateTimeRef.UtcNow, items = await repository.ExportAsync(request.Ids, token) });
        });
        group.MapPost("/inquiries/import", async (InquiryBackupRef request, IAdminInquiryRepositoryRef repository, CancellationTokenRef token) =>
        {
            if (request.Format != "ahmad-site-inquiries" || request.Version != 1 || request.Items is null || request.Items.Length > 100
                || request.Items.Select(row => row?.Id).Distinct().Count() != request.Items.Length || request.Items.Select(row => row?.ReferenceId).Distinct().Count() != request.Items.Length
                || request.Items.Any(row => !ValidBackupInquiry(row))) return ResultsRef.BadRequest(new { message = "Invalid inquiry backup. Maximum 100 records." });
            var count = await repository.ImportMissingAsync(request.Items, token);
            return count >= 0 ? ResultsRef.Ok(new { imported = count, skipped = request.Items.Length - count }) : ResultsRef.Conflict(new { message = "Concurrent restore detected. Retry the same backup after reviewing current data." });
        });
        return app;
    }

    private static bool TryDate(string? text, out DateTimeRef? date)
    {
        date = null;
        if (string.IsNullOrEmpty(text)) return true;
        if (!DateTimeRef.TryParseExact(text, "yyyy-MM-dd", CultureInfoRef.InvariantCulture,
            DateTimeStylesRef.AssumeUniversal | DateTimeStylesRef.AdjustToUniversal, out var parsed)) return false;
        date = parsed; return true;
    }

    public record StatusRequest(string Status, DateTimeRef ExpectedUpdatedAtUtc);
    public record NotesRequest(string Notes, DateTimeRef ExpectedUpdatedAtUtc);
    public record ReplyRequest(GuidRef OperationId, string Subject, string Body);
    public record ExportRequest(GuidRef[] Ids);
    public record InquiryBackup(string Format, int Version, InquiryRef[] Items);
    private static bool SameReply(InquiryReplyRef reply, GuidRef inquiryId, ReplyRequestRef request) => reply.InquiryId == inquiryId && reply.Subject == request.Subject && reply.Body == request.Body;
    private static DateTimeRef Timestamp() { var now = DateTimeRef.UtcNow; return new DateTimeRef(now.Ticks - now.Ticks % 10, DateTimeKindRef.Utc); }
    private static bool ValidBackupInquiry(InquiryRef? row) => row is not null && row.Id != GuidRef.Empty && !string.IsNullOrWhiteSpace(row.ReferenceId) && row.ReferenceId.Length <= 50
        && EnumRef.IsDefined(row.Status) && row.CreatedAtUtc.Kind == DateTimeKindRef.Utc && row.UpdatedAtUtc.Kind == DateTimeKindRef.Utc && row.UpdatedAtUtc >= row.CreatedAtUtc
        && row.AdminNotes is not null && row.AdminNotes.Length <= 10000 && (row.NotesUpdatedBy is null || row.NotesUpdatedBy.Length <= 255) && (row.ServiceKey is null || row.ServiceKey.Length <= 30)
        && row.Name is not null && row.Name.Length <= 100 && row.Email is not null && row.Email.Length <= 255 && row.ProjectDetails is not null && row.ProjectDetails.Length <= 4000
        && (row.NotificationStatus is null || NotificationStates.Contains(row.NotificationStatus)) && (row.NotificationAttemptedAtUtc is null || row.NotificationAttemptedAtUtc.Value.Kind == DateTimeKindRef.Utc)
        && SubmitBookingValidatorRef.Validate(new SubmitBookingCommandRef(row.Name, row.Email, row.ProjectDetails, null, null, row.ServiceKey, row.InquiryCategory), allowPublishedService: true).IsValid;
}

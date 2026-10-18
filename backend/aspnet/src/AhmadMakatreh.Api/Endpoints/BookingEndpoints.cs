// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingEndpoints
using AhmadMakatreh.Api.Contracts;
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Services;
using Microsoft.AspNetCore.Mvc;
using CultureInfoRef = global::System.Globalization.CultureInfo;
using IBookingApplicationServiceRef = global::AhmadMakatreh.Application.Services.IBookingApplicationService;
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using ClientIpResolverRef = global::AhmadMakatreh.Api.Security.ClientIpResolver;
using BookingResponseRef = global::AhmadMakatreh.Api.Contracts.BookingResponse;
using BookingRequestRef = global::AhmadMakatreh.Api.Contracts.BookingRequest;
using IConfigurationRef = global::Microsoft.Extensions.Configuration.IConfiguration;
using BookingResultRef = global::AhmadMakatreh.Application.Models.BookingResult;
using HttpContextRef = global::Microsoft.AspNetCore.Http.HttpContext;
using StatusCodesRef = global::Microsoft.AspNetCore.Http.StatusCodes;
using FromBodyAttributeRef = global::Microsoft.AspNetCore.Mvc.FromBodyAttribute;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using MathRef = global::System.Math;
// codeguard:components:end

namespace AhmadMakatreh.Api.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilderRef MapBookingEndpoints(this IEndpointRouteBuilderRef app)
    {
        var group = app.MapGroup("/api/booking")
                       .WithTags("Booking");

        group.MapPost("/", async (
            [FromBodyAttributeRef] BookingRequestRef request,
            HttpContextRef httpContext,
            IConfigurationRef configuration,
            IBookingApplicationServiceRef bookingService,
            CancellationTokenRef cancellationToken) =>
        {
            var remoteIp = ClientIpResolverRef.Resolve(httpContext, configuration);

            // Map API contract into application command
            var command = new SubmitBookingCommandRef(
                Name: request.Name,
                Email: request.Email,
                ProjectDetails: request.ProjectDetails,
                TurnstileToken: request.TurnstileToken,
                RemoteIp: remoteIp,
                ServiceKey: request.ServiceKey,
                InquiryCategory: request.InquiryCategory
            );

            var result = await bookingService.ProcessBookingAsync(command, cancellationToken);

            var response = new BookingResponseRef
            {
                Success = result.Success,
                ReferenceId = result.ReferenceId,
                Message = result.Message,
                Errors = result.Errors,
                Code = result.FailureCode,
                RetryAfterSeconds = result.RetryAfterSeconds,
                NotificationStatus = result.NotificationStatus switch
                {
                    NotificationDispatchStatusRef.Accepted => "accepted",
                    NotificationDispatchStatusRef.Failed => "failed",
                    NotificationDispatchStatusRef.Disabled => "disabled",
                    NotificationDispatchStatusRef.TimedOut => "timedOut",
                    NotificationDispatchStatusRef.Unknown => "unknown",
                    _ => null
                }
            };

            if (response.Success) return ResultsRef.Ok(response);
            if (response.Code == BookingResultRef.DuplicateSubmissionCode) return ResultsRef.Conflict(response);
            if (response.Code == BookingResultRef.IpBlockedCode)
            {
                var retryAfter = MathRef.Max(1, response.RetryAfterSeconds ?? 1);
                httpContext.Response.Headers.RetryAfter = retryAfter.ToString(CultureInfoRef.InvariantCulture);
                return ResultsRef.Json(response, statusCode: StatusCodesRef.Status429TooManyRequests);
            }

            return ResultsRef.BadRequest(response);
        })
        .WithName("SubmitBooking")
        .RequireRateLimiting("BookingPolicy")
        .Produces<BookingResponseRef>(StatusCodesRef.Status200OK)
        .Produces<BookingResponseRef>(StatusCodesRef.Status400BadRequest)
        .Produces<BookingResponseRef>(StatusCodesRef.Status409Conflict)
        .Produces(StatusCodesRef.Status429TooManyRequests);

        return app;
    }
}

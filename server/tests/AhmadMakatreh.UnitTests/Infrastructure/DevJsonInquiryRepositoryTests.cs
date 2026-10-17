// codeguard:components:start
// codeguard:defines: DevJsonInquiryRepositoryTests
using System.Security.Cryptography;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Persistence;
using AhmadMakatreh.Infrastructure.Persistence.DevJson;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using NullLoggerOfDevJsonInquiryRepositoryRef = global::Microsoft.Extensions.Logging.Abstractions.NullLogger<global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository>;
using ListOfBookingSubmissionOutcomeRef = global::System.Collections.Generic.List<global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome>;
using BookingSubmissionDispositionRef = global::AhmadMakatreh.Application.Models.BookingSubmissionDisposition;
using DevJsonInquiryRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using BookingAbuseHasherRef = global::AhmadMakatreh.Infrastructure.Persistence.BookingAbuseHasher;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class DevJsonInquiryRepositoryTests
{
    [FactAttributeRef]
    public async TaskRef AddUnlessDuplicateAsync_BlocksOnTheSixthIdenticalSubmission()
    {
        var repository = new DevJsonInquiryRepositoryRef(
            new BookingAbuseHasherRef(RandomNumberGeneratorRef.GetBytes(32)),
            NullLoggerOfDevJsonInquiryRepositoryRef.Instance);
        var unique = GuidRef.NewGuid().ToString("N");
        var inquiry = new InquiryRef(
            GuidRef.NewGuid(),
            $"REQ-{unique}",
            "Duplicate Guard Test",
            $"duplicate-{unique}@example.com",
            $"Identical submission test {unique}.",
            inquiryCategory: "software-project");

        var first = await repository.AddUnlessDuplicateAsync(inquiry, "192.0.2.10");
        var retries = new ListOfBookingSubmissionOutcomeRef();
        for (var retry = 0; retry < 5; retry++)
        {
            retries.Add(await repository.AddUnlessDuplicateAsync(inquiry, "192.0.2.10"));
        }

        first.Disposition.Should().Be(BookingSubmissionDispositionRef.Stored);
        retries.Take(4).Should().OnlyContain(result => result.Disposition == BookingSubmissionDispositionRef.Duplicate);
        retries[4].Disposition.Should().Be(BookingSubmissionDispositionRef.IpBlocked);
        retries[4].RetryAfterSeconds.Should().Be(1800);
    }
}

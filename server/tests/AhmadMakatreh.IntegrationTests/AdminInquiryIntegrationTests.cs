// codeguard:components:start
// codeguard:defines: AdminInquiryIntegrationTests
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using AhmadMakatreh.Infrastructure.Persistence.DevJson;
using AhmadMakatreh.Infrastructure.Storage;
using AhmadMakatreh.Infrastructure.Persistence;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using Xunit;
using StaticConfigurationManagerOfOpenIdConnectConfigurationRef = global::Microsoft.IdentityModel.Protocols.StaticConfigurationManager<global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>;
using NullLoggerOfDevJsonInquiryRepositoryRef = global::Microsoft.Extensions.Logging.Abstractions.NullLogger<global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository>;
using WebApplicationFactoryOfProgramRef = global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>;
using DevJsonSiteDocumentRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonSiteDocumentRepository;
using DevJsonInquiryReplyRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryReplyRepository;
using OpenIdConnectConfigurationRef = global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration;
using DevJsonInquiryRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using IAdminInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IAdminInquiryRepository;
using IInquiryReplyRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplyRepository;
using JwtSecurityTokenHandlerRef = global::System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler;
using DevJsonMediaRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonMediaRepository;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using IInquiryReplySenderRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplySender;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using BookingAbuseHasherRef = global::AhmadMakatreh.Infrastructure.Persistence.BookingAbuseHasher;
using SigningCredentialsRef = global::Microsoft.IdentityModel.Tokens.SigningCredentials;
using SecurityAlgorithmsRef = global::Microsoft.IdentityModel.Tokens.SecurityAlgorithms;
using LocalMediaStorageRef = global::AhmadMakatreh.Infrastructure.Storage.LocalMediaStorage;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IMediaRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IMediaRepository;
using ByteArrayContentRef = global::System.Net.Http.ByteArrayContent;
using JwtBearerOptionsRef = global::Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions;
using JwtSecurityTokenRef = global::System.IdentityModel.Tokens.Jwt.JwtSecurityToken;
using HttpStatusCodeRef = global::System.Net.HttpStatusCode;
using RsaSecurityKeyRef = global::Microsoft.IdentityModel.Tokens.RsaSecurityKey;
using IMediaStorageRef = global::AhmadMakatreh.Application.Interfaces.IMediaStorage;
using StringContentRef = global::System.Net.Http.StringContent;
using TaskOfStringRef = global::System.Threading.Tasks.Task<string>;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using InquiryPageRef = global::AhmadMakatreh.Application.Models.InquiryPage;
using JsonElementRef = global::System.Text.Json.JsonElement;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using EncodingRef = global::System.Text.Encoding;
using InterlockedRef = global::System.Threading.Interlocked;
using SecurityKeyRef = global::Microsoft.IdentityModel.Tokens.SecurityKey;
using AdminAccessRef = global::AhmadMakatreh.Api.Security.AdminAccess;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using EnumerableRef = global::System.Linq.Enumerable;
using DirectoryRef = global::System.IO.Directory;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using ConvertRef = global::System.Convert;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using ClaimRef = global::System.Security.Claims.Claim;
using TaskRef = global::System.Threading.Tasks.Task;
using FactAttributeRef = global::Xunit.FactAttribute;
using GuidRef = global::System.Guid;
using PathRef = global::System.IO.Path;
using FileRef = global::System.IO.File;
using RSARef = global::System.Security.Cryptography.RSA;
using DateTimeRef = global::System.DateTime;
using ArrayRef = global::System.Array;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class AdminInquiryIntegrationTests
{
    private const string Issuer = "https://test-admin.cloudflareaccess.com";
    private const string IssuerRef = Issuer;
    private const string Audience = "admin-test-audience";
    private const string AudienceRef = Audience;

    [TheoryAttributeRef]
    [InlineDataAttributeRef("/api/admin/session")]
    [InlineDataAttributeRef("/api/admin/inquiries")]
    [InlineDataAttributeRef("/api/admin/media")]
    [InlineDataAttributeRef("/api/admin/backup/documents")]
    [InlineDataAttributeRef("/api/admin/documents/content/history")]
    [InlineDataAttributeRef("/api/admin/inquiries/00000000-0000-0000-0000-000000000001")]
    public async TaskRef UnauthenticatedAdminReadIsRejected(string path)
    {
        await using var factory = new WebApplicationFactoryOfProgramRef().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
        });
        using var client = factory.CreateClient();
        var response = await client.GetAsync(path);
        response.StatusCode.Should().Be(HttpStatusCodeRef.Unauthorized);
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("expired", 401)]
    [InlineDataAttributeRef("audience", 401)]
    [InlineDataAttributeRef("issuer", 401)]
    [InlineDataAttributeRef("signature", 401)]
    [InlineDataAttributeRef("email", 403)]
    [InlineDataAttributeRef("type", 403)]
    [InlineDataAttributeRef("malformed", 401)]
    public async TaskRef InvalidIdentityIsRejected(string variant, int code)
    {
        using var rsa = RSARef.Create(2048);
        var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        await using var factory = CreateFactory(key);
        using var client = factory.CreateClient();
        using var forgedRsa = RSARef.Create(2048);
        var signer = variant == "signature" ? new RsaSecurityKeyRef(forgedRsa) { KeyId = "first" } : key;
        var assertion = variant == "malformed" ? "not.a.jwt" : Token(signer, variant);
        client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", assertion);
        (await client.GetAsync("/api/admin/inquiries")).StatusCode.Should().Be((HttpStatusCodeRef)code);
    }

    [FactAttributeRef]
    public async TaskRef SignedSessionFiltersPaginationAndConditionalWriteWork()
    {
        using var rsa = RSARef.Create(2048);
        var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        await using var factory = CreateFactory(key);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
        var unique = GuidRef.NewGuid().ToString("N");
        var repository = factory.Services.GetRequiredService<IInquiryRepositoryRef>();
        var older = new InquiryRef(GuidRef.NewGuid(), unique + "1", unique, "test@example.com", "Private details", inquiryCategory: "software-project");
        var newer = new InquiryRef(GuidRef.NewGuid(), unique + "2", unique, "test@example.com", "Other private details", inquiryCategory: "software-project");
        await repository.AddAsync(older); await repository.AddAsync(newer);
        await repository.RecordNotificationAsync(newer.Id, "failed", DateTimeRef.UtcNow);

        var page = await client.GetFromJsonAsync<InquiryPageRef>($"/api/admin/inquiries?search={unique}&pageSize=1");
        page!.Items.Should().HaveCount(1); page.Items[0].Id.Should().Be(newer.Id);
        page.NextCursor.Should().NotBeNull();
        var second = await client.GetFromJsonAsync<InquiryPageRef>($"/api/admin/inquiries?search={unique}&pageSize=1&cursor={page.NextCursor}");
        second!.Items[0].Id.Should().Be(older.Id); second.NextCursor.Should().BeNull();
        var filtered = await client.GetFromJsonAsync<InquiryPageRef>($"/api/admin/inquiries?search={unique}&notificationStatus=failed");
        filtered!.Items.Should().HaveCount(1);
        (await client.GetAsync("/api/admin/inquiries?pageSize=101")).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
        (await client.GetAsync("/api/admin/inquiries?cursor=bad")).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);

        var write = new { status = "Contacted", expectedUpdatedAtUtc = newer.UpdatedAtUtc };
        var withoutCsrf = await client.PatchAsJsonAsync($"/api/admin/inquiries/{newer.Id}/status", write);
        withoutCsrf.StatusCode.Should().Be(HttpStatusCodeRef.Forbidden);
        var sessionResponse = await client.GetAsync("/api/admin/session");
        var session = await sessionResponse.Content.ReadFromJsonAsync<Session>();
        var cookie = sessionResponse.Headers.GetValues("Set-Cookie").Single().Split(';')[0];
        client.DefaultRequestHeaders.Add("Cookie", cookie);
        client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken);
        client.DefaultRequestHeaders.Add("Origin", "https://foreign.example.com");
        (await client.PatchAsJsonAsync($"/api/admin/inquiries/{newer.Id}/status", write)).StatusCode.Should().Be(HttpStatusCodeRef.Forbidden);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
        (await client.PatchAsJsonAsync($"/api/admin/inquiries/{newer.Id}/status", write)).StatusCode.Should().Be(HttpStatusCodeRef.OK);
        (await client.PatchAsJsonAsync($"/api/admin/inquiries/{newer.Id}/status", write)).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
        var saved = await repository.GetByReferenceIdAsync(newer.ReferenceId);
        saved!.Status.ToString().Should().Be("Contacted"); saved.NotificationStatus.Should().Be("failed");
    }

    [FactAttributeRef]
    public async TaskRef MultipleAccessSigningKeysSelectByKid()
    {
        using var first = RSARef.Create(2048); using var second = RSARef.Create(2048);
        var key1 = new RsaSecurityKeyRef(first) { KeyId = "first" };
        var key2 = new RsaSecurityKeyRef(second) { KeyId = "rotated" };
        await using var factory = CreateFactory(key1, key2);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key2));
        (await client.GetAsync("/api/admin/session")).StatusCode.Should().Be(HttpStatusCodeRef.OK);
    }

    [FactAttributeRef]
    public async TaskRef RealLocalUploadDeduplicationReferenceProtectionHistoryAndBackupWork()
    {
        var folder = PathRef.Combine(PathRef.GetTempPath(), "admin-completion-" + GuidRef.NewGuid());
        using var rsa = RSARef.Create(2048); var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        try
        {
            await using var factory = CreateFactory(key).WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            {
                services.RemoveAll<IMediaRepositoryRef>(); services.AddSingleton<IMediaRepositoryRef>(new DevJsonMediaRepositoryRef(PathRef.Combine(folder, "media.json")));
                services.RemoveAll<IMediaStorageRef>(); services.AddSingleton<IMediaStorageRef>(new LocalMediaStorageRef(PathRef.Combine(folder, "objects")));
                services.RemoveAll<ISiteDocumentRepositoryRef>(); services.AddSingleton<ISiteDocumentRepositoryRef>(new DevJsonSiteDocumentRepositoryRef(PathRef.Combine(folder, "documents.json")));
            }));
            using var client = factory.CreateClient(); client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
            var sessionResponse = await client.GetAsync("/api/admin/session"); var session = await sessionResponse.Content.ReadFromJsonAsync<Session>();
            client.DefaultRequestHeaders.Add("Cookie", sessionResponse.Headers.GetValues("Set-Cookie").Single().Split(';')[0]);
            client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken); client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
            var id = GuidRef.NewGuid(); var png = ConvertRef.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=");
            var upload = await client.PostAsync($"/api/admin/media/{id}?name=test.png", new ByteArrayContentRef(png)); upload.StatusCode.Should().Be(HttpStatusCodeRef.OK);
            var asset = await upload.Content.ReadFromJsonAsync<JsonElementRef>(); var url = asset.GetProperty("url").GetString()!;
            (await client.GetByteArrayAsync(url)).Should().Equal(png);
            (await client.PostAsync($"/api/admin/media/{id}?name=test.png", new ByteArrayContentRef(png))).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            DirectoryRef.GetFiles(PathRef.Combine(folder, "objects")).Should().HaveCount(1);
            (await client.PostAsync($"/api/admin/media/{GuidRef.NewGuid()}?name=bad.svg", new StringContentRef("<svg onload='alert(1)'/>"))).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
            var draft = new { assets = new { heroImageUrl = url } };
            (await client.PutAsJsonAsync("/api/admin/documents/content", new { expectedRevision = 0, data = draft })).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            (await client.PostAsJsonAsync("/api/admin/documents/content/publish", new { expectedRevision = 1 })).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            (await client.PostAsJsonAsync($"/api/admin/media/{id}/archive", new { })).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
            (await client.PutAsJsonAsync("/api/admin/documents/content", new { expectedRevision = 2, data = new { assets = new { heroImageUrl = "" } } })).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            var history = await client.GetFromJsonAsync<JsonElementRef>("/api/admin/documents/content/history"); history.GetProperty("items").GetArrayLength().Should().Be(3);
            history.GetProperty("items")[0].GetProperty("actor").GetString().Should().Be("owner@example.com");
            (await client.PostAsJsonAsync("/api/admin/documents/content/restore", new { revision = 1, expectedRevision = 3 })).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            var restoredHistory = await client.GetFromJsonAsync<JsonElementRef>("/api/admin/documents/content/history");
            restoredHistory.GetProperty("items")[0].GetProperty("action").GetString().Should().Be("restore:1");
            (await client.PostAsJsonAsync("/api/admin/documents/content/restore", new { revision = 1, expectedRevision = 3 })).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
            var backup = await client.GetFromJsonAsync<JsonElementRef>("/api/admin/backup/documents"); backup.GetProperty("format").GetString().Should().Be("ahmad-site-documents");
            backup.GetProperty("documents")[0].GetProperty("published").GetProperty("assets").GetProperty("heroImageUrl").GetString().Should().Be(url);
            backup.GetRawText().Should().NotContain("csrfToken");
        }
        finally { if (DirectoryRef.Exists(folder)) DirectoryRef.Delete(folder, true); }
    }

    [FactAttributeRef]
    public async TaskRef NotesExportSafeImportAndConcurrentRepliesDoNotSendDuplicateMail()
    {
        var folder = PathRef.Combine(PathRef.GetTempPath(), "admin-inquiries-" + GuidRef.NewGuid());
        using var rsa = RSARef.Create(2048); var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        var sender = new RecordingReplySender();
        try
        {
            var repository = new DevJsonInquiryRepositoryRef(new BookingAbuseHasherRef(RandomNumberGeneratorRef.GetBytes(32)), NullLoggerOfDevJsonInquiryRepositoryRef.Instance, PathRef.Combine(folder, "inquiries.json"));
            await using var factory = CreateFactory(key).WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            {
                services.RemoveAll<IInquiryRepositoryRef>(); services.AddSingleton<IInquiryRepositoryRef>(repository);
                services.RemoveAll<IAdminInquiryRepositoryRef>(); services.AddSingleton<IAdminInquiryRepositoryRef>(repository);
                services.RemoveAll<IInquiryReplyRepositoryRef>(); services.AddSingleton<IInquiryReplyRepositoryRef>(new DevJsonInquiryReplyRepositoryRef(PathRef.Combine(folder, "replies.json")));
                services.RemoveAll<IInquiryReplySenderRef>(); services.AddSingleton<IInquiryReplySenderRef>(sender);
            }));
            var inquiry = new InquiryRef(GuidRef.NewGuid(), "TEST-" + GuidRef.NewGuid().ToString("N"), "Owner", "test@example.test", "Details", inquiryCategory: "other");
            await repository.AddAsync(inquiry);
            using var client = factory.CreateClient(); client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
            var sessionResponse = await client.GetAsync("/api/admin/session"); var session = await sessionResponse.Content.ReadFromJsonAsync<Session>();
            client.DefaultRequestHeaders.Add("Cookie", sessionResponse.Headers.GetValues("Set-Cookie").Single().Split(';')[0]);
            client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken); client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
            var notes = new { notes = "Private note", expectedUpdatedAtUtc = inquiry.UpdatedAtUtc };
            (await client.PatchAsJsonAsync($"/api/admin/inquiries/{inquiry.Id}/notes", notes)).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            (await client.PatchAsJsonAsync($"/api/admin/inquiries/{inquiry.Id}/notes", notes)).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
            var export = await client.PostAsJsonAsync("/api/admin/inquiries/export", new { ids = new[] { inquiry.Id } });
            var backup = await export.Content.ReadFromJsonAsync<JsonElementRef>(); backup.GetProperty("items")[0].GetProperty("adminNotes").GetString().Should().Be("Private note");
            var imported = await client.PostAsJsonAsync("/api/admin/inquiries/import", backup);
            (await imported.Content.ReadFromJsonAsync<JsonElementRef>()).GetProperty("imported").GetInt32().Should().Be(0);
            var missing = new InquiryRef(GuidRef.NewGuid(), "RESTORE-" + GuidRef.NewGuid().ToString("N"), "Restored", "restore@example.test", "Restored details", inquiryCategory: "other");
            var restore = new { format = "ahmad-site-inquiries", version = 1, items = new[] { missing } };
            (await client.PostAsJsonAsync("/api/admin/inquiries/import", restore)).StatusCode.Should().Be(HttpStatusCodeRef.OK);
            (await client.PostAsJsonAsync("/api/admin/inquiries/import", new { format = "wrong", version = 1, items = new[] { missing } })).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
            sender.Calls.Should().Be(0);
            var request = new { operationId = GuidRef.NewGuid(), subject = "Re: TEST", body = "Hello" };
            var responses = await TaskRef.WhenAll(EnumerableRef.Range(0, 3).Select(_ => client.PostAsJsonAsync($"/api/admin/inquiries/{inquiry.Id}/replies", request)));
            responses.Should().OnlyContain(response => response.StatusCode == HttpStatusCodeRef.OK); sender.Calls.Should().Be(1);
            var repeat = await client.PostAsJsonAsync($"/api/admin/inquiries/{inquiry.Id}/replies", request);
            (await repeat.Content.ReadFromJsonAsync<JsonElementRef>()).GetProperty("status").GetString().Should().Be("accepted"); sender.Calls.Should().Be(1);
            (await client.PostAsJsonAsync($"/api/admin/inquiries/{inquiry.Id}/replies", new { request.operationId, request.subject, body = "Changed" })).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
            var history = await client.GetFromJsonAsync<JsonElementRef>($"/api/admin/inquiries/{inquiry.Id}/replies"); history.GetProperty("items").GetArrayLength().Should().Be(1);
        }
        finally { if (DirectoryRef.Exists(folder)) DirectoryRef.Delete(folder, true); }
    }

    [FactAttributeRef]
    public async TaskRef LargeInquiryBackupImportsWithoutIncreasingOtherAdminBodyLimits()
    {
        var folder = PathRef.Combine(PathRef.GetTempPath(), "admin-inquiry-import-" + GuidRef.NewGuid());
        using var rsa = RSARef.Create(2048); var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        try
        {
            var repository = new DevJsonInquiryRepositoryRef(new BookingAbuseHasherRef(RandomNumberGeneratorRef.GetBytes(32)), NullLoggerOfDevJsonInquiryRepositoryRef.Instance, PathRef.Combine(folder, "inquiries.json"));
            await using var factory = CreateFactory(key).WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            {
                services.RemoveAll<IInquiryRepositoryRef>(); services.AddSingleton<IInquiryRepositoryRef>(repository);
                services.RemoveAll<IAdminInquiryRepositoryRef>(); services.AddSingleton<IAdminInquiryRepositoryRef>(repository);
            }));
            var items = EnumerableRef.Range(0, 100).Select(_ => new InquiryRef(GuidRef.NewGuid(), "BACKUP-" + GuidRef.NewGuid().ToString("N"),
                new string('ا', 100), "restore@example.test", new string('ا', 4000), inquiryCategory: "other") { AdminNotes = new string('ا', 10000) }).ToArray();
            var backup = JsonSerializerRef.Serialize(new { format = "ahmad-site-inquiries", version = 1, items });
            EncodingRef.UTF8.GetByteCount(backup).Should().BeInRange(2 * 1024 * 1024 + 1, 10 * 1024 * 1024);
            using var client = factory.CreateClient(); client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
            var sessionResponse = await client.GetAsync("/api/admin/session"); var session = await sessionResponse.Content.ReadFromJsonAsync<Session>();
            client.DefaultRequestHeaders.Add("Cookie", sessionResponse.Headers.GetValues("Set-Cookie").Single().Split(';')[0]);
            client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken); client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
            using var importBody = new StringContentRef(backup, EncodingRef.UTF8, "application/json");
            var imported = await client.PostAsync("/api/admin/inquiries/import", importBody);
            imported.StatusCode.Should().Be(HttpStatusCodeRef.OK);
            (await imported.Content.ReadFromJsonAsync<JsonElementRef>()).GetProperty("imported").GetInt32().Should().Be(100);
            using var ordinaryBody = new StringContentRef(backup, EncodingRef.UTF8, "application/json");
            (await client.PutAsync("/api/admin/documents/content", ordinaryBody)).StatusCode.Should().Be(HttpStatusCodeRef.RequestEntityTooLarge);
            using var oversizedBody = new StringContentRef(new string('x', 10 * 1024 * 1024 + 1), EncodingRef.UTF8, "application/json");
            (await client.PostAsync("/api/admin/inquiries/import", oversizedBody)).StatusCode.Should().Be(HttpStatusCodeRef.RequestEntityTooLarge);
        }
        finally { if (DirectoryRef.Exists(folder)) DirectoryRef.Delete(folder, true); }
    }

    private sealed class RecordingReplySender : IInquiryReplySenderRef
    {
        public int Calls;
        public bool IsConfigured => true;
        public async TaskOfStringRef SendAsync(InquiryRef inquiry, InquiryReplyRef reply, CancellationTokenRef token) { InterlockedRef.Increment(ref Calls); await TaskRef.Delay(100, token); return "accepted"; }
    }

    [FactAttributeRef]
    public async TaskRef FailedLocalStorageDoesNotSaveMediaMetadata()
    {
        var folder = PathRef.Combine(PathRef.GetTempPath(), "admin-storage-failure-" + GuidRef.NewGuid());
        using var rsa = RSARef.Create(2048); var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        try
        {
            DirectoryRef.CreateDirectory(folder);
            var blockedRoot = PathRef.Combine(folder, "blocked"); await FileRef.WriteAllTextAsync(blockedRoot, "not a directory");
            var repository = new DevJsonMediaRepositoryRef(PathRef.Combine(folder, "media.json"));
            await using var factory = CreateFactory(key).WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            {
                services.RemoveAll<IMediaRepositoryRef>(); services.AddSingleton<IMediaRepositoryRef>(repository);
                services.RemoveAll<IMediaStorageRef>(); services.AddSingleton<IMediaStorageRef>(new LocalMediaStorageRef(blockedRoot));
            }));
            using var client = factory.CreateClient(); client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
            var response = await client.GetAsync("/api/admin/session"); var session = await response.Content.ReadFromJsonAsync<Session>();
            client.DefaultRequestHeaders.Add("Cookie", response.Headers.GetValues("Set-Cookie").Single().Split(';')[0]);
            client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken); client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
            var id = GuidRef.NewGuid(); var png = ConvertRef.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=");
            (await client.PostAsync($"/api/admin/media/{id}?name=test.png", new ByteArrayContentRef(png))).StatusCode.Should().Be(HttpStatusCodeRef.ServiceUnavailable);
            (await repository.GetAsync(id, default)).Should().BeNull();
        }
        finally { if (DirectoryRef.Exists(folder)) DirectoryRef.Delete(folder, true); }
    }

    private static WebApplicationFactoryOfProgramRef CreateFactory(params SecurityKeyRef[] keys) =>
        new WebApplicationFactoryOfProgramRef().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development"); builder.UseSetting("Persistence:Provider", "Json");
            builder.UseSetting("AdminAccess:TeamDomain", IssuerRef); builder.UseSetting("AdminAccess:Audience", AudienceRef);
            builder.UseSetting("AdminAccess:AllowedEmails:0", "owner@example.com");
            builder.ConfigureServices(services => services.PostConfigure<JwtBearerOptionsRef>(AdminAccessRef.Scheme, options =>
            {
                var configuration = new OpenIdConnectConfigurationRef { Issuer = IssuerRef };
                foreach (var key in keys) configuration.SigningKeys.Add(key);
                options.ConfigurationManager = new StaticConfigurationManagerOfOpenIdConnectConfigurationRef(configuration);
            }));
        });

    private static string Token(SecurityKeyRef key, string variant = "valid")
    {
        var now = DateTimeRef.UtcNow;
        var token = new JwtSecurityTokenRef(
            variant == "issuer" ? "https://foreign.example.com" : IssuerRef,
            variant == "audience" ? "another-audience" : AudienceRef,
            [new ClaimRef("email", variant == "email" ? "stranger@example.com" : "owner@example.com"),
             new ClaimRef("type", variant == "type" ? "service" : "app"), new ClaimRef("sub", "owner-id")],
            now.AddMinutes(-10), variant == "expired" ? now.AddMinutes(-5) : now.AddMinutes(10),
            new SigningCredentialsRef(key, SecurityAlgorithmsRef.RsaSha256));
        return new JwtSecurityTokenHandlerRef().WriteToken(token);
    }

    private record Session(string Email, string CsrfToken);

    [FactAttributeRef]
    public async TaskRef DraftPublicationConflictRestorationAndSnapshotCachingWork()
    {
        using var rsa = RSARef.Create(2048);
        var key = new RsaSecurityKeyRef(rsa) { KeyId = "first" };
        await using var factory = CreateFactory(key);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cf-Access-Jwt-Assertion", Token(key));
        var sessionResponse = await client.GetAsync("/api/admin/session");
        var session = await sessionResponse.Content.ReadFromJsonAsync<Session>();
        client.DefaultRequestHeaders.Add("Cookie", sessionResponse.Headers.GetValues("Set-Cookie").Single().Split(';')[0]);
        client.DefaultRequestHeaders.Add("X-Admin-CSRF", session!.CsrfToken);
        client.DefaultRequestHeaders.Add("Origin", "https://admin.ahmad-makatreh.vip");
        var existing = await client.GetFromJsonAsync<JsonElementRef>("/api/admin/documents/pricing");
        var revision = existing.GetProperty("revision").GetInt64();
        var marker = GuidRef.NewGuid().ToString("N");
        var pricing = new { packages = new[] { new { key = "test-package", price = 100, hidden = false,
            title = new { ar = marker, en = marker }, description = new { ar = "وصف", en = "Description" }, features = new { ar = new[] { "ميزة" }, en = new[] { "Feature" } } } }, offers = ArrayRef.Empty<object>() };
        var save = await client.PutAsJsonAsync("/api/admin/documents/pricing", new { expectedRevision = revision, data = pricing });
        save.StatusCode.Should().Be(HttpStatusCodeRef.OK); revision++;
        (await client.GetStringAsync("/api/site")).Should().NotContain(marker);
        var publish = await client.PostAsJsonAsync("/api/admin/documents/pricing/publish", new { expectedRevision = revision });
        publish.StatusCode.Should().Be(HttpStatusCodeRef.OK); revision++;
        var snapshot = await client.GetAsync("/api/site");
        (await snapshot.Content.ReadAsStringAsync()).Should().Contain(marker);
        client.DefaultRequestHeaders.IfNoneMatch.Add(snapshot.Headers.ETag!);
        (await client.GetAsync("/api/site")).StatusCode.Should().Be(HttpStatusCodeRef.NotModified);
        client.DefaultRequestHeaders.IfNoneMatch.Clear();
        (await client.PutAsJsonAsync("/api/admin/documents/pricing", new { expectedRevision = revision - 1, data = pricing })).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
        var second = new { packages = ArrayRef.Empty<object>(), offers = ArrayRef.Empty<object>() };
        (await client.PutAsJsonAsync("/api/admin/documents/pricing", new { expectedRevision = revision, data = second })).StatusCode.Should().Be(HttpStatusCodeRef.OK); revision++;
        (await client.GetStringAsync("/api/site")).Should().Contain(marker);
        (await client.PostAsJsonAsync("/api/admin/documents/pricing/publish", new { expectedRevision = revision })).StatusCode.Should().Be(HttpStatusCodeRef.OK); revision++;
        (await client.GetStringAsync("/api/site")).Should().NotContain(marker);
        (await client.PostAsJsonAsync("/api/admin/documents/pricing/publish", new { expectedRevision = revision })).StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
        (await client.PostAsJsonAsync("/api/admin/documents/pricing/publish", new { expectedRevision = revision, restorePrevious = true })).StatusCode.Should().Be(HttpStatusCodeRef.OK);
        (await client.GetStringAsync("/api/site")).Should().Contain(marker);
        var invalidPages = new { pages = new[] { new { slug = "admin", title = new { ar = "عنوان", en = "Title" }, description = new { ar = "", en = "" }, sections = ArrayRef.Empty<object>() } } };
        (await client.PutAsJsonAsync("/api/admin/documents/pages", new { expectedRevision = 0, data = invalidPages })).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
        var invalidContent = new { assets = new { heroImageUrl = "javascript:alert(1)" } };
        (await client.PutAsJsonAsync("/api/admin/documents/content", new { expectedRevision = 0, data = invalidContent })).StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
    }
}

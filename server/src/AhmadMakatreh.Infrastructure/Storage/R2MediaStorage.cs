// codeguard:components:start
// codeguard:defines: R2MediaStorage
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Infrastructure.Options;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using IOptionsOfMediaOptionsRef = global::Microsoft.Extensions.Options.IOptions<global::AhmadMakatreh.Infrastructure.Options.MediaOptions>;
using BasicAWSCredentialsRef = global::Amazon.Runtime.BasicAWSCredentials;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using PutObjectRequestRef = global::Amazon.S3.Model.PutObjectRequest;
using AmazonS3ClientRef = global::Amazon.S3.AmazonS3Client;
using AmazonS3ConfigRef = global::Amazon.S3.AmazonS3Config;
using IMediaStorageRef = global::AhmadMakatreh.Application.Interfaces.IMediaStorage;
using MediaOptionsRef = global::AhmadMakatreh.Infrastructure.Options.MediaOptions;
using MemoryStreamRef = global::System.IO.MemoryStream;
using TimeSpanRef = global::System.TimeSpan;
using UriKindRef = global::System.UriKind;
using RegexRef = global::System.Text.RegularExpressions.Regex;
using TaskRef = global::System.Threading.Tasks.Task;
using UriRef = global::System.Uri;
using IDisposableRef = global::System.IDisposable;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Storage;

public sealed class R2MediaStorage : IMediaStorageRef, IDisposableRef
{
    private readonly AmazonS3ClientRef? _client;
    private readonly MediaOptionsRef _options;
    public R2MediaStorage(IOptionsOfMediaOptionsRef options)
    {
        _options = options.Value;
        if (_options.Provider == "Disabled") return;
        if (_options.Provider != "R2" || !RegexRef.IsMatch(_options.AccountId, "^[a-f0-9]{32}$") || string.IsNullOrWhiteSpace(_options.Bucket)
            || string.IsNullOrWhiteSpace(_options.AccessKeyId) || string.IsNullOrWhiteSpace(_options.SecretAccessKey)
            || !UriRef.TryCreate(_options.PublicBaseUrl, UriKindRef.Absolute, out var uri) || uri.Scheme != "https" || uri.UserInfo.Length > 0 || uri.Query.Length > 0 || uri.Fragment.Length > 0)
            throw new InvalidOperationExceptionRef("Invalid R2 media configuration. Use environment secrets and an HTTPS public URL.");
        _client = new AmazonS3ClientRef(new BasicAWSCredentialsRef(_options.AccessKeyId, _options.SecretAccessKey), new AmazonS3ConfigRef
        { ServiceURL = $"https://{_options.AccountId}.r2.cloudflarestorage.com", AuthenticationRegion = "auto", ForcePathStyle = true, MaxErrorRetry = 0, Timeout = TimeSpanRef.FromSeconds(45) });
    }
    public bool IsConfigured => _client is not null;
    public string PublicUrl(string key) => _options.PublicBaseUrl.TrimEnd('/') + "/" + key;
    public async TaskRef PutAsync(string key, byte[] data, string contentType, CancellationTokenRef token)
    {
        if (_client is null) throw new InvalidOperationExceptionRef("Media storage is not configured.");
        using var stream = new MemoryStreamRef(data, false);
        await _client.PutObjectAsync(new PutObjectRequestRef { BucketName = _options.Bucket, Key = key, InputStream = stream, ContentType = contentType,
            DisablePayloadSigning = true, DisableDefaultChecksumValidation = true, AutoCloseStream = false,
            Headers = { CacheControl = "public, max-age=31536000, immutable", ContentDisposition = contentType == "application/pdf" ? "attachment" : "inline" } }, token);
    }
    public async TaskRef DeleteAsync(string key, CancellationTokenRef token)
    {
        if (_client is null) throw new InvalidOperationExceptionRef("Media storage is not configured.");
        await _client.DeleteObjectAsync(_options.Bucket, key, token);
    }
    public void Dispose() => _client?.Dispose();
}

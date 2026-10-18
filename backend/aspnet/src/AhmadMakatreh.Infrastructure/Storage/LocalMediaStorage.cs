// codeguard:components:start
// codeguard:defines: LocalMediaStorage
using System.Text.RegularExpressions;
using AhmadMakatreh.Application.Interfaces;
using ArgumentExceptionRef = global::System.ArgumentException;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IMediaStorageRef = global::AhmadMakatreh.Application.Interfaces.IMediaStorage;
using RegexOptionsRef = global::System.Text.RegularExpressions.RegexOptions;
using AppContextRef = global::System.AppContext;
using FileStreamRef = global::System.IO.FileStream;
using FileAccessRef = global::System.IO.FileAccess;
using DirectoryRef = global::System.IO.Directory;
using FileShareRef = global::System.IO.FileShare;
using TimeSpanRef = global::System.TimeSpan;
using FileModeRef = global::System.IO.FileMode;
using RegexRef = global::System.Text.RegularExpressions.Regex;
using PathRef = global::System.IO.Path;
using TaskRef = global::System.Threading.Tasks.Task;
using FileRef = global::System.IO.File;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Storage;

public class LocalMediaStorage(string? root = null) : IMediaStorageRef
{
    private readonly string _root = root ?? PathRef.Combine(AppContextRef.BaseDirectory, "App_Data", "media");
    private static readonly RegexRef KeyPattern = new("^[a-f0-9]{32}\\.(png|jpg|webp|pdf)$", RegexOptionsRef.CultureInvariant, TimeSpanRef.FromMilliseconds(100));
    public bool IsConfigured => true;
    public string PublicUrl(string key) => "/api/media/" + key;
    public string PathFor(string key)
    {
        if (!KeyPattern.IsMatch(key)) throw new ArgumentExceptionRef("Invalid media key.");
        return PathRef.Combine(_root, key);
    }
    public async TaskRef PutAsync(string key, byte[] data, string contentType, CancellationTokenRef token)
    {
        var path = PathFor(key); DirectoryRef.CreateDirectory(_root);
        await using var file = new FileStreamRef(path, FileModeRef.CreateNew, FileAccessRef.Write, FileShareRef.None, 81920, true);
        await file.WriteAsync(data, token);
    }
    public TaskRef DeleteAsync(string key, CancellationTokenRef token) { token.ThrowIfCancellationRequested(); FileRef.Delete(PathFor(key)); return TaskRef.CompletedTask; }
}

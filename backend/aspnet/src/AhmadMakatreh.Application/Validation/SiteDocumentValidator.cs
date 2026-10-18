// codeguard:components:start
// codeguard:defines: SiteDocumentValidator
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using AhmadMakatreh.Application.Models;
using DictionaryOfStringAndStringArrayRef = global::System.Collections.Generic.Dictionary<string, string[]>;
using JsonUnmappedMemberHandlingRef = global::System.Text.Json.Serialization.JsonUnmappedMemberHandling;
using NullReferenceExceptionRef = global::System.NullReferenceException;
using JsonSerializerOptionsRef = global::System.Text.Json.JsonSerializerOptions;
using ProjectContributionRef = global::AhmadMakatreh.Application.Models.ProjectContribution;
using JsonNamingPolicyRef = global::System.Text.Json.JsonNamingPolicy;
using StringComparisonRef = global::System.StringComparison;
using HashSetOfStringRef = global::System.Collections.Generic.HashSet<string>;
using JsonValueKindRef = global::System.Text.Json.JsonValueKind;
using JsonExceptionRef = global::System.Text.Json.JsonException;
using LocalizedTextRef = global::AhmadMakatreh.Application.Models.LocalizedText;
using RegexOptionsRef = global::System.Text.RegularExpressions.RegexOptions;
using PriceCatalogRef = global::AhmadMakatreh.Application.Models.PriceCatalog;
using DateTimeKindRef = global::System.DateTimeKind;
using ProjectMediaRef = global::AhmadMakatreh.Application.Models.ProjectMedia;
using ProjectImageRef = global::AhmadMakatreh.Application.Models.ProjectImage;
using JsonElementRef = global::System.Text.Json.JsonElement;
using ProjectCardRef = global::AhmadMakatreh.Application.Models.ProjectCard;
using SiteArticleRef = global::AhmadMakatreh.Application.Models.SiteArticle;
using SitePagesRef = global::AhmadMakatreh.Application.Models.SitePages;
using TimeSpanRef = global::System.TimeSpan;
using UriKindRef = global::System.UriKind;
using RegexRef = global::System.Text.RegularExpressions.Regex;
using UriRef = global::System.Uri;
// codeguard:components:end

namespace AhmadMakatreh.Application.Validation;

public static class SiteDocumentValidator
{
    public static readonly JsonSerializerOptionsRef JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicyRef.CamelCase, MaxDepth = 24 };
    private static readonly JsonSerializerOptionsRef DatasetOptions = new(JsonOptions) { UnmappedMemberHandling = JsonUnmappedMemberHandlingRef.Disallow };
    private static readonly RegexRef Slug = new("^[a-z][a-z0-9-]{0,29}$", RegexOptionsRef.CultureInvariant, TimeSpanRef.FromMilliseconds(100));
    private static readonly string[] ReservedSlugs = ["admin", "api", "home", "about", "services", "capabilities", "work", "journal", "booking", "start-project", "startproject", "page", "contact", "assets", "images"];
    private static readonly string[] DataNames = ["projectCards", "projectContributions", "caseStudies", "projects", "articles"];

    public static string? Validate(string key, JsonElementRef data)
    {
        if (data.ValueKind != JsonValueKindRef.Object || data.GetRawText().Length > 1500000) return "Document must be an object of at most 1.5 MB.";
        try
        {
            return key switch
            {
                "pricing" => ValidatePricing(data.Deserialize<PriceCatalogRef>(JsonOptions)),
                "pages" => ValidatePages(data.Deserialize<SitePagesRef>(JsonOptions)),
                "content" => ValidateContent(data),
                _ => "Unknown document."
            };
        }
        catch (JsonExceptionRef) { return "Invalid document structure."; }
        catch (NullReferenceExceptionRef) { return "Required document fields are missing."; }
    }

    private static bool Text(LocalizedTextRef? value, int max = 1000) => value is not null && value.Ar is not null && value.En is not null && value.Ar.Length <= max && value.En.Length <= max;
    private static bool Title(LocalizedTextRef? value) => Text(value, 200) && !string.IsNullOrWhiteSpace(value!.Ar) && !string.IsNullOrWhiteSpace(value.En);
    private static bool Identifier(string? value) => value is not null && Slug.IsMatch(value);
    public static bool SafeUrl(string? value)
    {
        if (string.IsNullOrEmpty(value)) return true;
        if (value.Length > 2048 || value.Contains('\\') || value.Any(char.IsControl)) return false;
        if (value.StartsWith('/') && !value.StartsWith("//")) return true;
        return UriRef.TryCreate(value, UriKindRef.Absolute, out var uri) && uri.Scheme == "https" && string.IsNullOrEmpty(uri.UserInfo);
    }

    private static string? ValidatePricing(PriceCatalogRef? catalog)
    {
        if (catalog?.Packages is null || catalog.Offers is null || catalog.Packages.Length > 50 || catalog.Offers.Length > 50) return "At most 50 packages and offers are supported.";
        var keys = new HashSetOfStringRef();
        foreach (var package in catalog.Packages)
        {
            if (!Identifier(package.Key) || !keys.Add(package.Key) || !Title(package.Title) || !Text(package.Description, 2000)
                || package.Price is < 0 or > 1000000 || (package.Price.HasValue && decimal.Round(package.Price.Value, 2) != package.Price.Value)
                || package.Features is null || !package.Features.TryGetValue("ar", out var ar) || !package.Features.TryGetValue("en", out var en)
                || ar is null || en is null || ar.Length > 20 || en.Length > 20 || ar.Concat(en).Any(f => f is null || f.Length > 500))
                return "Invalid package key, text, price or features.";
        }
        var ids = new HashSetOfStringRef();
        foreach (var offer in catalog.Offers)
        {
            if (!Identifier(offer.Id) || !ids.Add(offer.Id) || !Title(offer.Title) || !Text(offer.Description, 2000)
                || offer.Items is null || offer.Items.Length > 50 || offer.StartsAtUtc?.Kind == DateTimeKindRef.Unspecified || offer.EndsAtUtc?.Kind == DateTimeKindRef.Unspecified
                || (offer.StartsAtUtc.HasValue && offer.EndsAtUtc.HasValue && offer.StartsAtUtc >= offer.EndsAtUtc)) return "Invalid offer or schedule.";
            var offerKeys = new HashSetOfStringRef();
            foreach (var item in offer.Items)
            {
                var package = catalog.Packages.FirstOrDefault(p => p.Key == item.PackageKey);
                if (package?.Price is null || !offerKeys.Add(item.PackageKey) || item.DiscountPercent is <= 0 or > 100
                    || item.OfferPrice is < 0 || item.OfferPrice >= package.Price
                    || (item.OfferPrice.HasValue && decimal.Round(item.OfferPrice.Value, 2) != item.OfferPrice.Value)) return "Invalid offer price or package.";
            }
        }
        return null;
    }

    private static string? ValidatePages(SitePagesRef? document)
    {
        if (document?.Pages is null || document.Pages.Length > 100) return "At most 100 pages are supported.";
        var slugs = new HashSetOfStringRef();
        foreach (var page in document.Pages)
        {
            if (!Identifier(page.Slug) || ReservedSlugs.Contains(page.Slug) || !slugs.Add(page.Slug) || !Title(page.Title) || !Text(page.Description, 2000)
                || page.Sections is null || page.Sections.Length > 40) return "Invalid or reserved page slug, text or sections.";
            var ids = new HashSetOfStringRef();
            foreach (var section in page.Sections)
            {
                if (!Identifier(section.Id) || !ids.Add(section.Id) || !new[] { "hero", "text", "image", "cards", "cta" }.Contains(section.Type)
                    || !Text(section.Title, 300) || !Text(section.Body, 20000) || !SafeUrl(section.ImageUrl) || !SafeUrl(section.LinkUrl)
                    || (section.ImageAlt is not null && !Text(section.ImageAlt, 300)) || (section.LinkLabel is not null && !Text(section.LinkLabel, 300))
                    || section.Items?.Length > 30 || (section.Items?.Any(i => !Text(i.Title, 300) || !Text(i.Body, 4000) || !SafeUrl(i.ImageUrl) || !SafeUrl(i.LinkUrl)) ?? false))
                    return "Invalid page section, URL or content.";
            }
        }
        return null;
    }

    private static string? ValidateContent(JsonElementRef data)
    {
        foreach (var prop in data.EnumerateObject())
        {
            if (prop.Name is "ar" or "en")
            {
                if (prop.Value.ValueKind != JsonValueKindRef.Object || prop.Value.EnumerateObject().Count() > 2000
                    || prop.Value.EnumerateObject().Any(p => p.Name.Length > 120 || p.Name is "__proto__" or "constructor" or "prototype"
                        || p.Value.ValueKind != JsonValueKindRef.String || p.Value.GetString()!.Length > 20000)) return "Invalid bilingual copy.";
            }
            else if (prop.Name == "assets")
            {
                if (prop.Value.ValueKind != JsonValueKindRef.Object || prop.Value.EnumerateObject().Count() > 30
                    || prop.Value.EnumerateObject().Any(p => p.Name is not ("heroImageUrl" or "brandLogoAr" or "brandLogoEn" or "cvUrl" or "linkedinUrl" or "instagramUrl" or "whatsappUrl")
                        || p.Value.ValueKind != JsonValueKindRef.String || !SafeUrl(p.Value.GetString()))) return "Invalid image or asset URL.";
            }
            else if (prop.Name == "overrides")
            {
                if (prop.Value.ValueKind != JsonValueKindRef.Object || prop.Value.EnumerateObject().Count() > 10000) return "Invalid content overrides.";
                foreach (var item in prop.Value.EnumerateObject())
                {
                    var parts = item.Name.Split('.');
                    if (parts.Length < 2 || parts.Length > 16 || !DataNames.Contains(parts[0]) || parts.Any(p => p.Length > 120 || p.Length == 0 || p is "__proto__" or "constructor" or "prototype" or "length" or "id" or "slug" or "key" or "mode" or "type" or "descriptionKey")
                        || item.Value.ValueKind is not (JsonValueKindRef.String or JsonValueKindRef.Number or JsonValueKindRef.True or JsonValueKindRef.False)
                        || (item.Value.ValueKind == JsonValueKindRef.String && item.Value.GetString()!.Length > 40000)) return "Invalid content override.";
                    if ((parts[^1].Contains("url", StringComparisonRef.OrdinalIgnoreCase) || parts[^1] is "src" or "srcEn")
                        && item.Value.ValueKind == JsonValueKindRef.String && !SafeUrl(item.Value.GetString())) return "Invalid content URL.";
                }
            }
            else if (prop.Name == "datasets")
            {
                if (prop.Value.ValueKind != JsonValueKindRef.Object) return "Invalid datasets.";
                foreach (var dataset in prop.Value.EnumerateObject())
                {
                    if (dataset.Value.ValueKind != JsonValueKindRef.Array) return "Dataset must be an array.";
                    var error = ValidateDataset(dataset.Name, dataset.Value);
                    if (error is not null) return error;
                }
            }
            else return "Unknown content field.";
        }
        return null;
    }

    private static bool ValidMedia(ProjectMediaRef? media) => media is not null && media.Mode is "single" or "slideshow" or "stack"
        && media.Items is not null && media.Items.Length <= 30 && media.Items.All(ValidImage) && (media.Brand is null || ValidImage(media.Brand));
    private static bool ValidImage(ProjectImageRef image) => SafeUrl(image.Src) && SafeUrl(image.SrcEn) && Text(image.Caption, 300);
    private static bool Lines(DictionaryOfStringAndStringArrayRef? lines) => lines is not null && lines.TryGetValue("ar", out var ar) && lines.TryGetValue("en", out var en)
        && ar is not null && en is not null && ar.Length <= 50 && en.Length <= 50 && ar.Concat(en).All(text => text is not null && text.Length <= 2000);
    private static string? ValidateDataset(string name, JsonElementRef data)
    {
        var ids = new HashSetOfStringRef();
        if (name == "projectCards")
        {
            var records = data.Deserialize<ProjectCardRef[]>(DatasetOptions)!;
            if (records.Length > 100 || records.Any(record => !Identifier(record.Slug) || !ids.Add(record.Slug) || string.IsNullOrWhiteSpace(record.Name)
                || record.Name.Length > 200 || !Text(record.Description, 4000) || !ValidMedia(record.Media))) return "Invalid projects or duplicate project paths.";
        }
        else if (name == "projectContributions")
        {
            var records = data.Deserialize<ProjectContributionRef[]>(DatasetOptions)!;
            if (records.Length > 100 || records.Any(record => !Identifier(record.Slug) || !ids.Add(record.Slug) || !Title(record.Title) || !Text(record.Summary, 4000)
                || !Text(record.Role, 4000) || !Lines(record.Contributions) || (record.Result is not null && !Text(record.Result, 4000)) || !SafeUrl(record.Url)
                || (record.LinkLabel is not null && !Text(record.LinkLabel, 300)) || (record.Media is not null && !ValidMedia(record.Media)))) return "Invalid project details.";
        }
        else if (name == "articles")
        {
            var records = data.Deserialize<SiteArticleRef[]>(DatasetOptions)!;
            if (records.Length > 200 || records.Any(record => !Identifier(record.Slug) || record.Language is not ("ar" or "en") || !ids.Add($"{record.Slug}:{record.Language}")
                || record.Title is null || record.Title.Length > 200 || (!record.Hidden && string.IsNullOrWhiteSpace(record.Title))
                || record.Summary is null || record.Summary.Length > 4000 || record.Content is null || record.Content.Length > 40000
                || record.Date is null || record.Date.Length > 100 || !record.ContentIsPlainText || record.Labels?.Length > 20 || !SafeUrl(record.ImageUrl)
                || (record.Labels?.Any(label => label is null || label.Length > 100) ?? false))) return "Invalid article content or duplicate article path/language.";
        }
        else return "Unknown dataset.";
        return null;
    }
}

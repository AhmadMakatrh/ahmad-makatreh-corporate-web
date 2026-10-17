// codeguard:components:start
// codeguard:defines: LocalizedText, ServicePackage, OfferItem, PriceOffer, PriceCatalog, PageCard, PageSection, SitePage (and more)
using DictionaryOfStringAndStringArrayRef = global::System.Collections.Generic.Dictionary<string, string[]>;
using ServicePackageRef = global::AhmadMakatreh.Application.Models.ServicePackage;
using LocalizedTextRef = global::AhmadMakatreh.Application.Models.LocalizedText;
using ProjectImageRef = global::AhmadMakatreh.Application.Models.ProjectImage;
using ProjectMediaRef = global::AhmadMakatreh.Application.Models.ProjectMedia;
using PageSectionRef = global::AhmadMakatreh.Application.Models.PageSection;
using PriceOfferRef = global::AhmadMakatreh.Application.Models.PriceOffer;
using OfferItemRef = global::AhmadMakatreh.Application.Models.OfferItem;
using PageCardRef = global::AhmadMakatreh.Application.Models.PageCard;
using SitePageRef = global::AhmadMakatreh.Application.Models.SitePage;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end
namespace AhmadMakatreh.Application.Models;

public record LocalizedText(string Ar, string En);
public record ServicePackage(string Key, LocalizedTextRef Title, LocalizedTextRef Description, DictionaryOfStringAndStringArrayRef Features, decimal? Price, bool Hidden = false);
public record OfferItem(string PackageKey, decimal DiscountPercent, decimal? OfferPrice = null);
public record PriceOffer(string Id, LocalizedTextRef Title, LocalizedTextRef Description, OfferItemRef[] Items, bool Enabled,
    DateTimeRef? StartsAtUtc = null, DateTimeRef? EndsAtUtc = null, bool Popup = false);
public record PriceCatalog(ServicePackageRef[] Packages, PriceOfferRef[] Offers);
public record PageCard(LocalizedTextRef Title, LocalizedTextRef Body, string? ImageUrl = null, string? LinkUrl = null);
public record PageSection(string Id, string Type, LocalizedTextRef Title, LocalizedTextRef Body, string? ImageUrl = null,
    LocalizedTextRef? ImageAlt = null, string? LinkUrl = null, LocalizedTextRef? LinkLabel = null, PageCardRef[]? Items = null);
public record SitePage(string Slug, LocalizedTextRef Title, LocalizedTextRef Description, PageSectionRef[] Sections, bool Visible = true, bool ShowInNav = false);
public record SitePages(SitePageRef[] Pages);

public record ProjectImage(string Src, LocalizedTextRef Caption, string? SrcEn = null);
public record ProjectMedia(string Mode, ProjectImageRef[] Items, ProjectImageRef? Brand = null);
public record ProjectCard(string Slug, string Name, LocalizedTextRef Description, ProjectMediaRef Media, bool Featured = false, bool InDevelopment = false, bool Hidden = false);
public record ProjectContribution(string Slug, LocalizedTextRef Title, LocalizedTextRef Summary, LocalizedTextRef Role,
    DictionaryOfStringAndStringArrayRef Contributions, LocalizedTextRef? Result = null, string? Url = null, LocalizedTextRef? LinkLabel = null, ProjectMediaRef? Media = null);
public record SiteArticle(string Slug, string Language, string Title, string Summary, string Content, string Date,
    bool ContentIsPlainText, bool Hidden = false, string[]? Labels = null, string? ImageUrl = null, bool UseOriginalContent = false);

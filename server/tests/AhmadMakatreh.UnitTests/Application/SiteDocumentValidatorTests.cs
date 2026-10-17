// codeguard:components:start
// codeguard:defines: SiteDocumentValidatorTests
using System.Text.Json;
using AhmadMakatreh.Application.Validation;
using FluentAssertions;
using Xunit;
using SiteDocumentValidatorRef = global::AhmadMakatreh.Application.Validation.SiteDocumentValidator;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using JsonElementRef = global::System.Text.Json.JsonElement;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using FactAttributeRef = global::Xunit.FactAttribute;
using ArrayRef = global::System.Array;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Application;

public class SiteDocumentValidatorTests
{
    [TheoryAttributeRef]
    [InlineDataAttributeRef("{\"overrides\":{\"projectCards.0.title\":null}}")]
    [InlineDataAttributeRef("{\"overrides\":{\"projectCards.length\":0}}")]
    [InlineDataAttributeRef("{\"overrides\":{\"projectCards.0.slug\":\"renamed\"}}")]
    [InlineDataAttributeRef("{\"overrides\":{\"projectCards.0.image.url\":\"javascript:alert(1)\"}}")]
    [InlineDataAttributeRef("{\"assets\":{\"heroImageUrl\":\"//foreign.example/image\"}}")]
    public void UnsafeContentEditsAreRejected(string json) =>
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.Deserialize<JsonElementRef>(json)).Should().NotBeNull();

    [FactAttributeRef]
    public void ScalarTextAndRelativeImageEditsAreAccepted() =>
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.Deserialize<JsonElementRef>("""
            {"ar":{"cmsHeroTitle":"عنوان"},"en":{"cmsHeroTitle":"Title"},"assets":{"heroImageUrl":"/images/castle.png"},"overrides":{"projectCards.0.title.en":"Edited"}}
            """)).Should().BeNull();

    [TheoryAttributeRef]
    [InlineDataAttributeRef("startproject")]
    [InlineDataAttributeRef("start-project")]
    [InlineDataAttributeRef("page")]
    public void ExistingRouteAliasesCannotBeUsedForCmsPages(string slug)
    {
        var document = JsonSerializerRef.SerializeToElement(new { pages = new[] { new { slug, title = new { ar = "عنوان", en = "Title" }, description = new { ar = "", en = "" }, sections = ArrayRef.Empty<object>() } } });
        SiteDocumentValidatorRef.Validate("pages", document).Should().NotBeNull();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("{\"datasets\":{\"projectCards\":[],\"articles\":[]}}", true)]
    [InlineDataAttributeRef("{\"datasets\":{\"unknown\":[]}}", false)]
    [InlineDataAttributeRef("{\"datasets\":{\"articles\":[{\"slug\":\"article\",\"language\":\"en\",\"title\":\"Title\",\"summary\":\"\",\"content\":\"<script>bad()</script>\",\"date\":\"\",\"contentIsPlainText\":true}]}}", true)]
    [InlineDataAttributeRef("{\"datasets\":{\"articles\":[{\"slug\":\"article\",\"language\":\"en\",\"title\":\"Title\",\"summary\":\"\",\"content\":\"<script>bad()</script>\",\"date\":\"\",\"contentIsPlainText\":false}]}}", false)]
    public void ManagedDatasetsAreValidated(string json, bool valid) =>
        (SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.Deserialize<JsonElementRef>(json)) is null).Should().Be(valid);

    [FactAttributeRef]
    public void DuplicateAndUnsafeProjectsAreRejected()
    {
        var project = new { slug = "project", name = "Project", description = new { ar = "", en = "" }, media = new { mode = "single", items = new[] { new { src = "javascript:alert(1)", caption = new { ar = "", en = "" } } } } };
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.SerializeToElement(new { datasets = new { projectCards = new[] { project } } })).Should().NotBeNull();
        var safe = new { slug = "project", name = "Project", description = new { ar = "", en = "" }, media = new { mode = "single", items = ArrayRef.Empty<object>() } };
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.SerializeToElement(new { datasets = new { projectCards = new[] { safe, safe } } })).Should().NotBeNull();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("\"verifiedStack\":\"invalid\",")]
    [InlineDataAttributeRef("\"unexpected\":true,")]
    public void UnsupportedDatasetPropertiesAreRejected(string extra)
    {
        var json = """
            {"datasets":{"projectContributions":[{EXTRA"slug":"project","title":{"ar":"عنوان","en":"Title"},"summary":{"ar":"","en":""},"role":{"ar":"","en":""},"contributions":{"ar":[],"en":[]}}]}}
            """.Replace("EXTRA", extra);
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.Deserialize<JsonElementRef>(json)).Should().NotBeNull();
    }

    [FactAttributeRef]
    public void UnsupportedNestedDatasetPropertiesAreRejected() =>
        SiteDocumentValidatorRef.Validate("content", JsonSerializerRef.Deserialize<JsonElementRef>("""
            {"datasets":{"projectCards":[{"slug":"project","name":"Project","description":{"ar":"","en":""},"media":{"mode":"single","items":[],"unexpected":true}}]}}
            """)).Should().NotBeNull();
}

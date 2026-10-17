// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ReferenceIdGeneratorTests
using System.Text.RegularExpressions;
using AhmadMakatreh.Domain.Common;
using FluentAssertions;
using Xunit;
using ReferenceIdGeneratorRef = global::AhmadMakatreh.Domain.Common.ReferenceIdGenerator;
using HashSetOfStringRef = global::System.Collections.Generic.HashSet<string>;
using RegexRef = global::System.Text.RegularExpressions.Regex;
using FactAttributeRef = global::Xunit.FactAttribute;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Domain;

public class ReferenceIdGeneratorTests
{
    [FactAttributeRef]
    public void Generate_ShouldReturnExpectedFormat()
    {
        // Act
        var referenceId = ReferenceIdGeneratorRef.Generate();

        // Assert: Format should be REQ-yyyyMMdd-XXXXXX (where X is from the unambiguous 32-char set [2-9A-HJ-NP-Z])
        referenceId.Should().NotBeNullOrWhiteSpace();
        RegexRef.IsMatch(referenceId, @"^REQ-\d{8}-[2-9A-HJ-NP-Z]{6}$").Should().BeTrue(
            $"because '{referenceId}' must match the specification REQ-yyyyMMdd-XXXXXX");
    }

    [FactAttributeRef]
    public void Generate_ShouldProduceUniqueValues()
    {
        // Arrange
        const int count = 1000;
        const int countRef = count;
        var set = new HashSetOfStringRef();

        // Act
        for (int i = 0; i < countRef; i++)
        {
            var id = ReferenceIdGeneratorRef.Generate();
            set.Add(id);
        }

        // Assert: All 1,000 generated values must be completely distinct
        set.Count.Should().Be(countRef);
    }
}

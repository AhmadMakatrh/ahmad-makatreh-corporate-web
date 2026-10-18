// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: SubmitBookingValidatorTests
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Validation;
using FluentAssertions;
using Xunit;
using SubmitBookingValidatorRef = global::AhmadMakatreh.Application.Validation.SubmitBookingValidator;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using InquiryCategoriesRef = global::AhmadMakatreh.Application.Models.InquiryCategories;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using FactAttributeRef = global::Xunit.FactAttribute;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Application;

public class SubmitBookingValidatorTests
{
    [FactAttributeRef]
    public void Validate_WithValidCommand_ShouldReturnSuccess()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: "Need a high-performance distributed web platform.",
            TurnstileToken: "valid_token",
            RemoteIp: "127.0.0.1"
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef(null)]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("   ")]
    public void Validate_WithMissingName_ShouldReturnError(string? name)
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: name!,
            Email: "john@example.com",
            ProjectDetails: "Valid project details",
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Name is required.");
    }

    [FactAttributeRef]
    public void Validate_WithNameExceeding100Chars_ShouldReturnError()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: new string('a', 101),
            Email: "john@example.com",
            ProjectDetails: "Valid details",
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Name cannot exceed 100 characters.");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef(null)]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("   ")]
    public void Validate_WithMissingEmail_ShouldReturnError(string? email)
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: email!,
            ProjectDetails: "Valid details",
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Email address is required.");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("invalid-email")]
    [InlineDataAttributeRef("john@")]
    [InlineDataAttributeRef("@example.com")]
    [InlineDataAttributeRef("john@example")]
    [InlineDataAttributeRef("john example.com")]
    public void Validate_WithInvalidEmailFormat_ShouldReturnError(string invalidEmail)
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: invalidEmail,
            ProjectDetails: "Valid details",
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Please provide a valid email address.");
    }

    [FactAttributeRef]
    public void Validate_WithEmailExceeding255Chars_ShouldReturnError()
    {
        // Arrange
        var longEmail = new string('a', 250) + "@example.com";
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: longEmail,
            ProjectDetails: "Valid details",
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Email address cannot exceed 255 characters.");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef(null)]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("   ")]
    public void Validate_WithMissingProjectDetails_ShouldReturnError(string? details)
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: details!,
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Project details are required.");
    }

    [FactAttributeRef]
    public void Validate_WithProjectDetailsExceeding4000Chars_ShouldReturnError()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: new string('x', 4001),
            TurnstileToken: null,
            RemoteIp: null
        );

        // Act
        var result = SubmitBookingValidatorRef.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain("Project details cannot exceed 4000 characters.");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("resume")]
    [InlineDataAttributeRef("landing")]
    [InlineDataAttributeRef("business")]
    [InlineDataAttributeRef("system")]
    [InlineDataAttributeRef("mobile")]
    [InlineDataAttributeRef("custom")]
    public void Validate_WithKnownService_ShouldReturnSuccess(string serviceKey)
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Valid details", null, null, serviceKey);

        var result = SubmitBookingValidatorRef.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("other")]
    [InlineDataAttributeRef("resume\r\nBcc: attacker@example.com")]
    public void Validate_WithUnknownService_ShouldReturnError(string serviceKey)
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Valid details", null, null, serviceKey);

        var result = SubmitBookingValidatorRef.Validate(command);

        result.Errors.Should().Contain("Please select a valid service.");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("software-project")]
    [InlineDataAttributeRef("employment-opportunity")]
    [InlineDataAttributeRef("professional-collaboration")]
    [InlineDataAttributeRef("technical-support")]
    [InlineDataAttributeRef("general-inquiry")]
    [InlineDataAttributeRef("other")]
    public void Validate_WithKnownInquiryCategory_ShouldReturnSuccess(string category)
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Valid details", null, null, InquiryCategory: category);

        SubmitBookingValidatorRef.Validate(command).IsValid.Should().BeTrue();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("software-project", "مشروع برمجي")]
    [InlineDataAttributeRef("professional-collaboration", "طلب تعاون")]
    [InlineDataAttributeRef("technical-support", "دعم فني")]
    [InlineDataAttributeRef("other", "أخرى")]
    public void InquiryCategory_UsesExpectedEmailTag(string category, string tag)
    {
        InquiryCategoriesRef.GetDetails(category)?.Tag.Should().Be(tag);
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("unknown-category")]
    [InlineDataAttributeRef("software-project\r\nBcc: attacker@example.com")]
    public void Validate_WithUnknownInquiryCategory_ShouldReturnError(string category)
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Valid details", null, null, InquiryCategory: category);

        SubmitBookingValidatorRef.Validate(command).Errors.Should().Contain("Please select a valid inquiry category.");
    }
}

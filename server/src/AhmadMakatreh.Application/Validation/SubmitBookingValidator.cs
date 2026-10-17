// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: SubmitBookingValidator
using System.Text.RegularExpressions;
using AhmadMakatreh.Application.Models;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using InquiryCategoriesRef = global::AhmadMakatreh.Application.Models.InquiryCategories;
using ServicePackagesRef = global::AhmadMakatreh.Application.Models.ServicePackages;
using RegexOptionsRef = global::System.Text.RegularExpressions.RegexOptions;
using ListOfStringRef = global::System.Collections.Generic.List<string>;
using TimeSpanRef = global::System.TimeSpan;
using RegexRef = global::System.Text.RegularExpressions.Regex;
// codeguard:components:end

namespace AhmadMakatreh.Application.Validation;

/// <summary>
/// Validates SubmitBookingCommand constraints before proceeding to persistence or bot challenges.
/// </summary>
public static class SubmitBookingValidator
{
    private static readonly RegexRef EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptionsRef.Compiled | RegexOptionsRef.IgnoreCase,
        TimeSpanRef.FromMilliseconds(250));

    public static (bool IsValid, ListOfStringRef Errors) Validate(SubmitBookingCommandRef command, bool allowPublishedService = false)
    {
        var errors = new ListOfStringRef();

        if (string.IsNullOrWhiteSpace(command.Name))
        {
            errors.Add("Name is required.");
        }
        else if (command.Name.Trim().Length > 100)
        {
            errors.Add("Name cannot exceed 100 characters.");
        }

        if (string.IsNullOrWhiteSpace(command.Email))
        {
            errors.Add("Email address is required.");
        }
        else if (command.Email.Trim().Length > 255)
        {
            errors.Add("Email address cannot exceed 255 characters.");
        }
        else if (!EmailRegex.IsMatch(command.Email.Trim()))
        {
            errors.Add("Please provide a valid email address.");
        }

        if (string.IsNullOrWhiteSpace(command.ProjectDetails))
        {
            errors.Add("Project details are required.");
        }
        else if (command.ProjectDetails.Trim().Length > 4000)
        {
            errors.Add("Project details cannot exceed 4000 characters.");
        }

        if (command.ServiceKey is not null && ServicePackagesRef.GetName(command.ServiceKey) is null && !allowPublishedService)
        {
            errors.Add("Please select a valid service.");
        }

        if (command.InquiryCategory is not null && InquiryCategoriesRef.GetDetails(command.InquiryCategory) is null)
        {
            errors.Add("Please select a valid inquiry category.");
        }

        return (errors.Count == 0, errors);
    }
}

// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: InquiryCategories
// codeguard:components:end

namespace AhmadMakatreh.Application.Models;

public static class InquiryCategories
{
    public static (string Tag, string Label)? GetDetails(string? key) => key switch
    {
        "software-project" => ("مشروع برمجي", "Software project"),
        "employment-opportunity" => ("فرصة عمل", "Employment opportunity"),
        "professional-collaboration" => ("طلب تعاون", "Collaboration request"),
        "technical-support" => ("دعم فني", "Technical support"),
        "general-inquiry" => ("استفسار عام", "General inquiry"),
        "other" => ("أخرى", "Other"),
        _ => null
    };
}

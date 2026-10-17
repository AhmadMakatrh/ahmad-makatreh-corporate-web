// codeguard:components:start
// codeguard:defines: IAdminInquiryRepository
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Domain.Enums;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.Inquiry>>;
using TaskOfInquiryPageRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.InquiryPage>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using InquiryFilterRef = global::AhmadMakatreh.Application.Models.InquiryFilter;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using TaskOfInt32Ref = global::System.Threading.Tasks.Task<int>;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

public interface IAdminInquiryRepository
{
    TaskOfInquiryPageRef ListAsync(InquiryFilterRef filter, CancellationTokenRef cancellationToken);
    TaskOfInquiryRef GetAsync(GuidRef id, CancellationTokenRef cancellationToken);
    TaskOfBooleanRef UpdateStatusAsync(GuidRef id, InquiryStatusRef status, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef cancellationToken);
    TaskOfBooleanRef UpdateNotesAsync(GuidRef id, string notes, string actor, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef token);
    TaskOfIReadOnlyListRef ExportAsync(GuidRef[] ids, CancellationTokenRef token);
    TaskOfInt32Ref ImportMissingAsync(InquiryRef[] rows, CancellationTokenRef token);
}

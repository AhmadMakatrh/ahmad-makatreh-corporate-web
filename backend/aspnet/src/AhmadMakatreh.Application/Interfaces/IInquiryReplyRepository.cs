// codeguard:components:start
// codeguard:defines: IInquiryReplyRepository, IInquiryReplySender
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.InquiryReply>>;
using TaskOfInquiryReplyRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.InquiryReply?>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using TaskOfStringRef = global::System.Threading.Tasks.Task<string>;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

public interface IInquiryReplyRepository
{
    TaskOfBooleanRef AddAsync(InquiryReplyRef reply, CancellationTokenRef token);
    TaskOfInquiryReplyRef GetAsync(GuidRef id, CancellationTokenRef token);
    TaskOfIReadOnlyListRef ListAsync(GuidRef inquiryId, DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token);
    TaskRef CompleteAsync(GuidRef id, string status, CancellationTokenRef token);
}

public interface IInquiryReplySender
{
    bool IsConfigured { get; }
    TaskOfStringRef SendAsync(InquiryRef inquiry, InquiryReplyRef reply, CancellationTokenRef token);
}

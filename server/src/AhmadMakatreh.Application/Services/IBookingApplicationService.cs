// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: IBookingApplicationService
using AhmadMakatreh.Application.Models;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using TaskOfBookingResultRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.BookingResult>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
// codeguard:components:end

namespace AhmadMakatreh.Application.Services;

public interface IBookingApplicationService
{
    TaskOfBookingResultRef ProcessBookingAsync(SubmitBookingCommandRef command, CancellationTokenRef cancellationToken = default);
}

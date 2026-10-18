// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: submitBooking
import { request as apiRequest } from './httpClient';

/**
 * Submits a project booking or session inquiry to the ASP.NET Core backend.
 * Returns a typed acknowledgment including reference ID.
 */
export async function submitBooking(bookingData) {
  return await apiRequest('/api/booking', {
    method: 'POST',
    body: JSON.stringify({
      name: bookingData.name,
      email: bookingData.email,
      projectDetails: bookingData.projectDetails,
      inquiryCategory: bookingData.inquiryCategory || null,
      serviceKey: bookingData.serviceKey || null,
      turnstileToken: bookingData.turnstileToken || null,
    }),
  });
}
// codeguard:components:end

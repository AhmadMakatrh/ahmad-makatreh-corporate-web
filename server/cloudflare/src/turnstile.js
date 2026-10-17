// codeguard:components:start
// codeguard:defines: verifyTurnstile
/** @returns {Promise<{valid:boolean,error:string|null}>} */
export async function verifyTurnstile({ token, clientIp, secret, allowedHostnames }, fetcher = fetch) {
  if (!secret || !Array.isArray(allowedHostnames) || !allowedHostnames.length) return { valid: false, error: 'Security verification service is required in this environment.' };
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) return { valid: false, error: 'Verification token is required.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', redirect: 'manual', signal: controller.signal,
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp }),
    });
    if (!response.ok) return { valid: false, error: 'Captcha verification service error.' };
    const result = await response.json();
    if (result?.success === true && allowedHostnames.includes(result.hostname)) return { valid: true, error: null };
    return { valid: false, error: 'Bot verification challenge failed. Please try again.' };
  } catch {
    return { valid: false, error: 'Unable to verify security challenge at this time.' };
  } finally { clearTimeout(timer); }
}
// codeguard:components:end

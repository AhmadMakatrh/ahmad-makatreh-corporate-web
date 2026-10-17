// codeguard:components:start
// codeguard:defines: adminAuthPage
const script = `
// codeguard:components:start
const showRef = show;
const showRecoveryCodeRef = showRecoveryCode;
const noticeRef = notice;
const sendRef = send;
const stageRef = stage;
const message = document.getElementById('message');
const messageRef = message;
const panels = ['login', 'email-code', 'mfa', 'recover', 'recover-code', 'password', 'callback'].map(id => document.getElementById(id));
const panelsRef = panels;
const title = document.getElementById('page-title');
const titleRef = title;
const intro = document.getElementById('page-intro');
const introRef = intro;
const factor = document.getElementById('factor');
const factorRef = factor;
let activeFactor = '';
function show(id) {
  for (const panel of panelsRef) panel.hidden = panel.id !== id;
  titleRef.textContent = id === 'recover' ? 'استعادة كلمة المرور'
    : id === 'recover-code' || id === 'email-code' ? 'التحقق من البريد' : 'إدارة الموقع';
  introRef.textContent = id === 'recover' ? 'أدخل بريد حسابك لإرسال رمز الاستعادة.'
    : id === 'recover-code' ? 'أدخل بريد حسابك ورمز الاستعادة الذي وصلك.'
      : id === 'mfa' ? 'أدخل الرمز من تطبيق التحقق.'
        : 'الدخول مخصص لمالك الموقع، وبعد كلمة المرور سيصل رمز إلى بريدك.';
  messageRef.textContent = '';
}
function showRecoveryCode(email, sent) {
  const field = document.getElementById('recovery-code-email');
  field.value = email;
  field.readOnly = sent;
  field.parentElement.hidden = sent;
  showRef('recover-code');
  if (sent) {
    introRef.textContent = 'أدخل الرمز الذي تم إرساله إلى البريد التالي: ';
    const address = document.createElement('strong');
    address.textContent = email;
    address.className = 'recovery-address';
    introRef.append(address);
  }
}
function notice(value) { messageRef.textContent = value; }
async function send(path, body) {
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', redirect: 'error',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || 'تعذر إتمام الطلب. حاول مجددًا.');
    error.stage = data.stage; throw error; }
  return data;
}
function stage(data) {
  if (data.stage === 'ready') { location.replace('/'); return; }
  if (data.stage === 'password') { showRef('password'); return; }
  if (data.stage === 'email-code') {
    showRef('email-code');
    introRef.textContent = 'أدخل الرمز الذي تم إرساله إلى البريد التالي: ';
    const address = document.createElement('strong');
    address.textContent = data.email || document.getElementById('email').value;
    address.className = 'recovery-address';
    introRef.append(address);
    return;
  }
  if (data.stage === 'enroll') { showRef('mfa'); document.getElementById('enroll').hidden = false; }
  else if (data.stage === 'challenge') { showRef('mfa'); document.getElementById('enroll').hidden = true; }
  else { showRef('login'); return; }
  factorRef.replaceChildren();
  for (const item of data.factors || []) { const option = document.createElement('option'); option.value = item.id; option.textContent = 'تطبيق التحقق'; factorRef.append(option); }
  activeFactor = '';
}
// codeguard:components:end
document.getElementById('login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { stageRef(await sendRef('/auth/login', { email: document.getElementById('email').value,
    password: document.getElementById('login-password').value })); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('email-code').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { stageRef(await sendRef('/auth/email-verify', { code: document.getElementById('login-code').value.trim() })); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('resend-code').addEventListener('click', async event => {
  const button = event.currentTarget; button.disabled = true;
  try { const result = await sendRef('/auth/email-resend', {}); noticeRef(result.message); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('enroll').addEventListener('click', async event => {
  const button = event.currentTarget; button.disabled = true;
  try { const data = await sendRef('/auth/enroll', {}); activeFactor = data.factorId;
    document.getElementById('secret').textContent = data.secret || '';
    document.getElementById('secret-label').hidden = false; }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('mfa').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const factorId = activeFactor || factorRef.value;
    const challenge = await sendRef('/auth/challenge', { factorId });
    stageRef(await sendRef('/auth/verify', { factorId, challengeId: challenge.challengeId,
      code: document.getElementById('code').value.trim() })); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('recover').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const email = document.getElementById('recover-email').value.trim();
    await sendRef('/auth/recover', { email });
    showRecoveryCodeRef(email, true); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('recover-code').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const data = await sendRef('/auth/recovery-code', { email: document.getElementById('recovery-code-email').value,
    token: document.getElementById('recovery-token').value.trim() });
    document.getElementById('recovery-token').value = '';
    history.replaceState(null, '', '/login?reset=1'); stageRef(data); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('password').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { await sendRef('/auth/password', { password: document.getElementById('new-password').value });
    history.replaceState(null, '', '/login'); showRef('login');
    noticeRef('تم تغيير كلمة المرور. سجّل الدخول ثم أدخل رمز البريد.'); }
  catch (error) { if (error.stage === 'login') { history.replaceState(null, '', '/login'); showRef('login'); }
    noticeRef(error.message); }
  finally { button.disabled = false; }
});
document.getElementById('callback').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const query = new URLSearchParams(location.search);
    const data = await sendRef('/auth/callback', { token_hash: query.get('token_hash'), type: query.get('type') });
    history.replaceState(null, '', '/login?reset=1'); stageRef(data); }
  catch (error) { noticeRef(error.message); } finally { button.disabled = false; }
});
document.getElementById('forgot').addEventListener('click', () => showRef('recover'));
document.getElementById('have-code').addEventListener('click', () => {
  showRecoveryCodeRef(document.getElementById('recover-email').value || document.getElementById('email').value, false);
});
document.getElementById('back').addEventListener('click', () => showRef('login'));
if (location.pathname === '/auth/callback') showRef('callback');
else if (location.pathname === '/recover') showRef('recover');
else if (location.pathname === '/auth/backup') { showRef('mfa'); document.getElementById('enroll').hidden = false; }
else fetch('/auth/status', { credentials: 'same-origin', redirect: 'error' })
  .then(async response => response.ok ? stageRef(await response.json()) : showRef('login'))
  .catch(() => showRef('login'));
`;
const scriptRef = script;

export function adminAuthPage() {
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" /><title>دخول الإدارة — أحمد المكاترة</title>
<style nonce="${nonce}">
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:22px;background:#f7f6ef;color:#0b302a;font-family:Cairo,Tahoma,sans-serif}
main{width:min(100%,430px);padding:34px;background:#fffefa;border:1px solid #d7d9cc;border-radius:14px;box-shadow:0 18px 55px #163b2b14}h1{font-size:25px;margin:0 0 8px}p{line-height:1.8;color:#52645b}form{display:grid;gap:17px}form[hidden],label[hidden]{display:none}label{display:grid;gap:7px;font-size:14px;font-weight:700}input,select{width:100%;height:46px;padding:8px 12px;border:1px solid #cbd3c8;border-radius:7px;background:#f7f6ef;color:#0b302a;font:inherit}button{min-height:46px;padding:9px 17px;border:1px solid #174b3e;border-radius:7px;background:#174b3e;color:#fffefa;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.55;cursor:wait}button.secondary{background:transparent;color:#174b3e}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #be7149;outline-offset:2px}.links{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:20px}.links button{border:0;background:none;color:#174b3e;text-decoration:underline;padding:0;font-size:13px}#message{min-height:24px;margin:18px 0 0;color:#9b5138}#secret{overflow-wrap:anywhere;font-family:monospace}.recovery-address{display:block;direction:ltr;text-align:right;overflow-wrap:anywhere}
</style></head><body><main><h1 id="page-title">إدارة الموقع</h1><p id="page-intro">الدخول مخصص لمالك الموقع، وبعد كلمة المرور سيصل رمز إلى بريدك.</p>
<form id="login"><label>البريد الإلكتروني<input id="email" type="email" autocomplete="username" required /></label><label>كلمة المرور<input id="login-password" type="password" autocomplete="current-password" required /></label><button type="submit">متابعة</button></form>
<form id="email-code" hidden><label>رمز الدخول من البريد<input id="login-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required /></label><button type="submit">التحقق والدخول</button><button id="resend-code" type="button" class="secondary">إعادة إرسال الرمز</button></form>
<form id="mfa" hidden><label>تطبيق التحقق<select id="factor"></select></label><button id="enroll" type="button" class="secondary" hidden>إعداد تطبيق التحقق</button><label id="secret-label" hidden>مفتاح الإعداد اليدوي<span id="secret" dir="ltr"></span></label><label>الرمز المكون من 6 أرقام<input id="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required /></label><button type="submit">التحقق والمتابعة</button></form>
<form id="recover" hidden><label>بريد الحساب<input id="recover-email" type="email" autocomplete="email" required /></label><button type="submit">إرسال رمز الاستعادة</button></form>
<form id="recover-code" hidden><label>بريد الحساب<input id="recovery-code-email" type="email" autocomplete="email" required /></label><label>رمز الاستعادة من البريد<input id="recovery-token" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required /></label><button type="submit">التحقق من الرمز</button></form>
<form id="password" hidden><label>كلمة المرور الجديدة<input id="new-password" type="password" autocomplete="new-password" minlength="12" required /></label><button type="submit">حفظ كلمة المرور</button></form>
<form id="callback" hidden><p>اضغط لتأكيد رابط الاستعادة. لن تُغيّر كلمة المرور قبل التأكيد.</p><button type="submit">تأكيد رابط الاستعادة</button></form>
<p id="message" role="status" aria-live="polite"></p><div class="links"><button id="forgot" type="button">نسيت كلمة المرور؟</button><button id="have-code" type="button">لدي رمز استعادة</button><button id="back" type="button">العودة للدخول</button></div></main>
<script nonce="${nonce}">${scriptRef}</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
  } });
}
// codeguard:components:end

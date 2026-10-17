// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: TechnicalText
export function TechnicalText({ children }) {
  if (typeof children !== 'string') return children;
  return children.split(/(C\+\+|[AB]\+|\(?\b(?:X-Bank-Webhook-(?:Timestamp|Signature|Event-Id)|BankIncomingWebhookService\.php|HMAC-SHA256|HMAC|hash_equals|PostgreSQL|Next\.js 14|Flutter|Laravel API|Docker Compose|Docker|Webhook|Audit Log|System Architecture|Double-Entry|API Authorization|Database Isolation|CSV|Unreal Engine 5|Third-Person Shooter|Locomotion & Combat|Core Gameplay Foundation|Prototype|FFmpeg|MDN HTTP Observatory|ImmuniWeb|HTTP|API)\b\)?)/g).map((part, index) => (
    index % 2 ? <code key={index} dir="ltr" className="portfolio-technical-token">{part}</code> : part
  ));
}
// codeguard:components:end

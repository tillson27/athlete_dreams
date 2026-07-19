import { emailTokens } from '../emailTokens';

type EmailShellInput = {
  preview: string;
  title: string;
  bodyHtml: string;
};

export function renderEmailShell({ preview, title, bodyHtml }: EmailShellInput): string {
  const previewText = escapeHtml(preview);
  const titleText = escapeHtml(title);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titleText}</title>
  </head>
  <body style="margin:0;padding:0;background:${emailTokens.surface};font-family:Arial,Helvetica,sans-serif;color:${emailTokens.onSurface};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:${emailTokens.surface};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:${emailTokens.maxWidth};border-collapse:collapse;background:#ffffff;border:1px solid ${emailTokens.outline};border-radius:${emailTokens.radius};overflow:hidden;">
            <tr>
              <td style="background:${emailTokens.inverseSurface};padding:28px 28px 24px;color:${emailTokens.onInverse};">
                <div style="font-size:13px;line-height:18px;font-weight:700;letter-spacing:0;text-transform:uppercase;color:${emailTokens.primaryContainer};">ARC Network</div>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:34px;font-weight:800;letter-spacing:0;color:${emailTokens.onInverse};">${titleText}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:${emailTokens.onSurface};font-size:16px;line-height:24px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${emailTokens.onSurfaceVariant};">${escapeHtml(text)}</p>`;
}

export function actionButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 20px;border-collapse:collapse;">
  <tr>
    <td style="border-radius:999px;background:${emailTokens.primary};">
      <a href="${escapeAttribute(href)}" style="display:inline-block;padding:14px 22px;border-radius:999px;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function linkFallback(href: string): string {
  return `<p style="margin:18px 0 0;font-size:13px;line-height:20px;color:${emailTokens.onSurfaceVariant};">If the button does not work, paste this link into your browser:<br><a href="${escapeAttribute(href)}" style="color:${emailTokens.primary};word-break:break-all;">${escapeHtml(href)}</a></p>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

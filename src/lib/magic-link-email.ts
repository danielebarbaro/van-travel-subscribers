// Branded HTML for the BarbiSurfer magic link (account access) email.
// Email-safe: table layout, inline styles, hex colors, bulletproof button.
export function magicLinkEmail(url: string): string {
  const safeUrl = url.replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Il tuo link di accesso a BarbiSurfer</title>
</head>
<body style="margin:0;padding:40px 20px;background:#f6efe7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2a2520;line-height:1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ecd9c6;">
    <tr>
      <td style="background:#e0641e;padding:26px 36px;">
        <div style="font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;color:#ffe9d8;font-weight:700;">BarbiSurfer</div>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 36px 8px;">
        <h1 style="margin:0 0 12px;font-size:1.6rem;color:#2a2520;">Entra nel tuo pannello</h1>
        <p style="margin:0 0 28px;font-size:0.98rem;color:#6b5d50;">
          Clicca il bottone qui sotto per accedere alle tue preferenze. Niente password,
          il link vale pochi minuti.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
          <tr>
            <td style="border-radius:11px;background:#e0641e;">
              <a href="${safeUrl}" target="_blank"
                 style="display:inline-block;padding:13px 28px;font-size:0.98rem;font-weight:700;color:#ffffff;text-decoration:none;border-radius:11px;">
                Entra in BarbiSurfer
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 6px;font-size:0.8rem;color:#8a7d70;">
          Se il bottone non funziona, copia e incolla questo indirizzo nel browser:
        </p>
        <p style="margin:0 0 24px;font-size:0.8rem;word-break:break-all;">
          <a href="${safeUrl}" target="_blank" style="color:#c2540f;">${safeUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 36px;background:#f6efe7;border-top:1px solid #ecd9c6;">
        <p style="margin:0;font-size:0.74rem;color:#9b8d80;">
          Non hai richiesto questo accesso? Ignora pure questa email, non succede nulla.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

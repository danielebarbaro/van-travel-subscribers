import { NextRequest, NextResponse } from 'next/server';
import { emailDatabase } from '@/lib/database';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <div style="max-width:480px;margin:64px auto;padding:32px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    ${body}
  </div>
</body>
</html>`;
}

function invalidPage(): string {
  return page(
    'Link non valido o scaduto',
    `<h1 style="font-size:20px;margin:0 0 12px;">Link non valido o scaduto</h1>
     <p style="margin:0;line-height:1.5;color:#52525b;">Il link di disiscrizione non è valido oppure è scaduto.</p>`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(invalidPage(), { status: 404, headers: HTML_HEADERS });
  }

  try {
    const entry = await emailDatabase.getByToken(token);

    if (!entry) {
      return new NextResponse(invalidPage(), { status: 404, headers: HTML_HEADERS });
    }

    const safeEmail = escapeHtml(entry.email);
    const safeToken = escapeHtml(token);

    const body = `
      <h1 style="font-size:20px;margin:0 0 12px;">Conferma disiscrizione</h1>
      <p style="margin:0 0 20px;line-height:1.5;color:#52525b;">
        Stai per disiscrivere l'indirizzo <strong>${safeEmail}</strong> dalla nostra lista.
        Non riceverai più le nostre email.
      </p>
      <form method="POST" action="/api/unsubscribe">
        <input type="hidden" name="token" value="${safeToken}" />
        <button type="submit" style="display:inline-block;width:100%;padding:12px 16px;border:none;border-radius:8px;background:#dc2626;color:#ffffff;font-size:15px;font-weight:600;cursor:pointer;">
          Conferma disiscrizione
        </button>
      </form>`;

    return new NextResponse(page('Conferma disiscrizione', body), {
      status: 200,
      headers: HTML_HEADERS,
    });
  } catch (error: unknown) {
    console.error('Errore durante il recupero del token di disiscrizione:', error);
    return new NextResponse(
      page(
        'Errore',
        `<h1 style="font-size:20px;margin:0 0 12px;">Errore</h1>
         <p style="margin:0;line-height:1.5;color:#52525b;">Si è verificato un errore. Riprova più tardi.</p>`
      ),
      { status: 500, headers: HTML_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(clientIP);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      page(
        'Troppe richieste',
        `<h1 style="font-size:20px;margin:0 0 12px;">Troppe richieste</h1>
         <p style="margin:0;line-height:1.5;color:#52525b;">Hai effettuato troppe richieste. Riprova più tardi.</p>`
      ),
      {
        status: 429,
        headers: { ...HTML_HEADERS, ...getRateLimitHeaders(rateLimitResult) },
      }
    );
  }

  try {
    let token: string | null = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      token = typeof body?.token === 'string' ? body.token : null;
    } else {
      const formData = await request.formData();
      const value = formData.get('token');
      token = typeof value === 'string' ? value : null;
    }

    const headers = { ...HTML_HEADERS, ...getRateLimitHeaders(rateLimitResult) };

    if (!token) {
      return new NextResponse(
        page(
          'Link non valido o già disiscritto',
          `<h1 style="font-size:20px;margin:0 0 12px;">Link non valido o già disiscritto</h1>
           <p style="margin:0;line-height:1.5;color:#52525b;">Il link non è valido oppure l'indirizzo è già stato disiscritto.</p>`
        ),
        { status: 400, headers }
      );
    }

    const success = await emailDatabase.unsubscribeByToken(token);

    if (success) {
      return new NextResponse(
        page(
          'Disiscrizione completata',
          `<h1 style="font-size:20px;margin:0 0 12px;">Disiscrizione completata</h1>
           <p style="margin:0;line-height:1.5;color:#52525b;">Sei stato disiscritto con successo. Non riceverai più le nostre email.</p>`
        ),
        { status: 200, headers }
      );
    }

    return new NextResponse(
      page(
        'Link non valido o già disiscritto',
        `<h1 style="font-size:20px;margin:0 0 12px;">Link non valido o già disiscritto</h1>
         <p style="margin:0;line-height:1.5;color:#52525b;">Il link non è valido oppure l'indirizzo è già stato disiscritto.</p>`
      ),
      { status: 200, headers }
    );
  } catch (error: unknown) {
    console.error('Errore durante la disiscrizione:', error);
    return new NextResponse(
      page(
        'Errore',
        `<h1 style="font-size:20px;margin:0 0 12px;">Errore</h1>
         <p style="margin:0;line-height:1.5;color:#52525b;">Si è verificato un errore. Riprova più tardi.</p>`
      ),
      { status: 500, headers: { ...HTML_HEADERS, ...getRateLimitHeaders(rateLimitResult) } }
    );
  }
}

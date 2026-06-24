import { emailDatabase } from '@/lib/database';
import { NextRequest } from 'next/server';

function invalidLinkResponse(): Response {
  return new Response(
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Link non valido</title></head>
<body><h1>Link non valido</h1><p>Il link di disiscrizione non è valido o è già stato usato.</p></body></html>`,
    { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token || token.trim() === '') {
    return invalidLinkResponse();
  }

  await emailDatabase.unsubscribeByToken(token);

  // Return the same confirmation regardless of whether the token matched,
  // to prevent token enumeration by timing or response differences.
  return new Response(
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Disiscritto</title></head>
<body><h1>Disiscritto</h1><p>Sei stato disiscritto da tutte le email.</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token || token.trim() === '') {
    return Response.json({ ok: false }, { status: 400 });
  }

  await emailDatabase.unsubscribeByToken(token);

  return Response.json({ ok: true });
}

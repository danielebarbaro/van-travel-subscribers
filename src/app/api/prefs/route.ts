// front-landing/src/app/api/prefs/route.ts
import { auth } from '@/auth';
import { emailDatabase, type SubscriberPreferences } from '@/lib/database';
import { isKnownCountry } from '@/lib/countries';

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return Response.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const prefs = await emailDatabase.getPreferences(email);
  if (!prefs) {
    return Response.json({ error: 'Iscritto non trovato' }, { status: 404 });
  }

  return Response.json(prefs);
}

export async function PUT(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return Response.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Body non valido' }, { status: 400 });
  }

  const wantsCustom = Boolean(body.sub_custom_trip);
  const prefs: SubscriberPreferences = {
    sub_daily_trips: body.sub_daily_trips ? 1 : 0,
    sub_daily_itineraries: body.sub_daily_itineraries ? 1 : 0,
    sub_custom_trip: wantsCustom ? 1 : 0,
    custom_country: null,
    custom_direction: null,
    custom_max_km: null,
    custom_date_from: null,
    custom_date_to: null,
  };

  if (wantsCustom) {
    const country = String(body.custom_country ?? '').toLowerCase().trim();
    const direction = String(body.custom_direction ?? '');
    const maxKm = Number(body.custom_max_km);
    const from = body.custom_date_from;
    const to = body.custom_date_to;

    if (!isKnownCountry(country)) {
      return Response.json({ error: 'Paese non valido' }, { status: 400 });
    }
    if (direction !== 'departure' && direction !== 'arrival') {
      return Response.json({ error: 'Direzione non valida' }, { status: 400 });
    }
    if (!Number.isInteger(maxKm) || maxKm <= 100 || maxKm >= 3000) {
      return Response.json({ error: 'Distanza deve essere un intero tra 101 e 2999' }, { status: 400 });
    }
    if (!isValidDate(from) || !isValidDate(to)) {
      return Response.json({ error: 'Date non valide' }, { status: 400 });
    }
    if (from > to) {
      return Response.json({ error: 'La data di inizio deve precedere quella di fine' }, { status: 400 });
    }

    prefs.custom_country = country;
    prefs.custom_direction = direction;
    prefs.custom_max_km = maxKm;
    prefs.custom_date_from = from;
    prefs.custom_date_to = to;
  }

  const updated = await emailDatabase.updatePreferences(email, prefs);
  if (!updated) {
    return Response.json({ error: 'Aggiornamento fallito' }, { status: 404 });
  }

  return Response.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return Response.json({ error: 'Non autenticato' }, { status: 401 });
  }

  await emailDatabase.softDeleteByEmail(email);
  return Response.json({ ok: true });
}

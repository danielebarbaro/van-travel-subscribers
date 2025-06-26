import { NextRequest, NextResponse } from 'next/server';
import { emailDatabase } from '@/lib/database';
import { validateAdminToken, createAuthErrorResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email richiesta' },
        { status: 400 }
      );
    }

    // Validazione email semplice
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      );
    }

    await emailDatabase.addEmail(email.toLowerCase().trim());

    return NextResponse.json(
      { message: 'Email salvata con successo!' },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    if (errorMessage === 'Email già registrata') {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 409 }
      );
    }

    console.error('Errore nel salvare l\'email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const statsOnly = searchParams.get('stats') === 'true';

    // Operazioni che richiedono autenticazione
    if (includeDeleted || statsOnly) {
      const authResult = validateAdminToken(request);
      if (!authResult.isAuthenticated) {
        return createAuthErrorResponse(authResult.error!);
      }
    }

    if (statsOnly) {
      // Restituisci solo le statistiche (PROTETTO)
      const stats = await emailDatabase.getStats();
      console.log('🛡️  ADMIN ACTION: Stats requested');
      return NextResponse.json(stats);
    }

    if (includeDeleted) {
      // Restituisci tutte le email incluse quelle cancellate (PROTETTO)
      const emails = await emailDatabase.getEmailsIncludingDeleted();
      const stats = await emailDatabase.getStats();
      console.log('🛡️  ADMIN ACTION: All emails (including deleted) requested');
      return NextResponse.json({
        emails,
        stats
      });
    } else {
      // Comportamento originale - solo conteggio email attive (PUBBLICO)
      const count = await emailDatabase.getCount();
      return NextResponse.json({ count });
    }
  } catch (error: unknown) {
    console.error('Errore nel recuperare i dati:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
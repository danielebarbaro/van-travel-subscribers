import { NextRequest, NextResponse } from 'next/server';
import { emailDatabase } from '@/lib/database';
import { validateAdminToken, createAuthErrorResponse } from '@/lib/auth';

// GET /api/emails/[id] - Recupera una singola email (pubblico)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID non valido' },
        { status: 400 }
      );
    }

    const email = await emailDatabase.getEmailById(id);
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json(email);
  } catch (error: unknown) {
    console.error('Errore nel recuperare l\'email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// DELETE /api/emails/[id] - Soft delete di una email (PROTETTO)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica autenticazione
  const authResult = validateAdminToken(request);
  if (!authResult.isAuthenticated) {
    return createAuthErrorResponse(authResult.error!);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID non valido' },
        { status: 400 }
      );
    }

    const success = await emailDatabase.deleteEmail(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Email non trovata o già cancellata' },
        { status: 404 }
      );
    }

    console.log(`🛡️  ADMIN ACTION: Email ID ${id} soft deleted`);
    
    return NextResponse.json(
      { message: 'Email cancellata con successo' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Errore nel cancellare l\'email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PATCH /api/emails/[id] - Ripristina una email cancellata (PROTETTO)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verifica autenticazione
  const authResult = validateAdminToken(request);
  if (!authResult.isAuthenticated) {
    return createAuthErrorResponse(authResult.error!);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID non valido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'restore') {
      const success = await emailDatabase.restoreEmail(id);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Email non trovata' },
          { status: 404 }
        );
      }

      console.log(`🛡️  ADMIN ACTION: Email ID ${id} restored`);

      return NextResponse.json(
        { message: 'Email ripristinata con successo' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Azione non valida. Usa action: "restore"' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Errore nel ripristinare l\'email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 
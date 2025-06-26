import { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'camper-admin-2025-secret-token';

const ADMIN_TOKEN_HASH = crypto.createHash('sha256').update(ADMIN_TOKEN).digest('hex');

export interface AuthResult {
  isAuthenticated: boolean;
  error?: string;
}

export function validateAdminToken(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return {
      isAuthenticated: false,
      error: 'Token di autorizzazione mancante. Usa: Authorization: Bearer YOUR_TOKEN'
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      isAuthenticated: false,
      error: 'Formato autorizzazione non valido. Usa: Authorization: Bearer YOUR_TOKEN'
    };
  }

  const token = authHeader.slice(7);

  if (!token) {
    return {
      isAuthenticated: false,
      error: 'Token vuoto'
    };
  }

  // Hash del token fornito per confronto sicuro
  const providedTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  if (providedTokenHash !== ADMIN_TOKEN_HASH) {
    return {
      isAuthenticated: false,
      error: 'Token non valido'
    };
  }

  return {
    isAuthenticated: true
  };
}

// Funzione helper per generare un nuovo token sicuro
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware helper per le risposte di errore di autenticazione
export function createAuthErrorResponse(error: string, status: number = 401) {
  return Response.json(
    {
      error: 'Accesso non autorizzato',
      message: error,
      hint: 'Contatta l\'amministratore per ottenere il token di accesso'
    },
    { status }
  );
}

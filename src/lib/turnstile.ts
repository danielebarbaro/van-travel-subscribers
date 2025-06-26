interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY non configurato');
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data: TurnstileResponse = await response.json();
    
    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Errore nella verifica Turnstile:', error);
    return false;
  }
} 
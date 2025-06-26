'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime?: string;
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    fetchSubscriberCount();
  }, []);

  useEffect(() => {
    if (cooldownTime && cooldownTime > Date.now()) {
      const timer = setInterval(() => {
        if (Date.now() >= cooldownTime) {
          setCooldownTime(null);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const fetchSubscriberCount = async () => {
    try {
      const response = await fetch('/api/emails');
      const data = await response.json();
      setSubscriberCount(data.count || 0);
    } catch {
      console.error('Errore nel recuperare il conteggio');
    }
  };

  const resetCaptcha = () => {
    setTurnstileToken(null);
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownTime && Date.now() < cooldownTime) {
      const secondsLeft = Math.ceil((cooldownTime - Date.now()) / 1000);
      setMessage(`⏱️ Attendi ${secondsLeft} secondi prima di riprovare`);
      setIsSuccess(false);
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (siteKey && !turnstileToken) {
      setMessage('🤖 Completa la verifica di sicurezza');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          turnstileToken: turnstileToken 
        }),
      });

      const data = await response.json();
      
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const resetTime = response.headers.get('X-RateLimit-Reset');
      
      if (remaining !== null) {
        setRateLimitInfo({
          remaining: parseInt(remaining),
          resetTime: resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString('it-IT') : undefined
        });
      }

      if (response.status === 429) {
        const minutesUntilReset = data.minutesUntilReset || 15;
        setMessage(`🚫 Troppe richieste. Riprova tra ${minutesUntilReset} minuti.`);
        setIsSuccess(false);
        setCooldownTime(Date.now() + (minutesUntilReset * 60 * 1000));
        resetCaptcha();
      } else if (response.ok) {
        setMessage('🎉 Perfetto! Ti avviseremo appena disponibili!');
        setIsSuccess(true);
        setEmail('');
        fetchSubscriberCount();
        setCooldownTime(Date.now() + 30000);
        resetCaptcha();
      } else {
        setMessage(data.error || 'Si è verificato un errore');
        setIsSuccess(false);
        setCooldownTime(Date.now() + 10000);
        resetCaptcha();
      }
    } catch {
      setMessage('Errore di connessione. Riprova più tardi.');
      setIsSuccess(false);
      setCooldownTime(Date.now() + 15000);
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const getCooldownSeconds = () => {
    if (!cooldownTime) return 0;
    return Math.max(0, Math.ceil((cooldownTime - Date.now()) / 1000));
  };

  const isDisabled = isLoading || (cooldownTime && Date.now() < cooldownTime);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Content */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-24">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-30 h-30  flex items-center justify-center overflow-hidden">
              <Image
                src="/images/barbisurfer.webp"
                alt="Barbi srurfer logo"
                width={60}
                height={60}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight font-sedgwick">
            BarbiSurfer <br /> <span  className="text-3xl lg:text-4xl">Viaggi in Camper gentilmente hackerati</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed font-roboto">
            Scopri l&apos;Italia e l&apos;Europa con i nostri viaggi in camper di una settimana a soli 99€.
          </p>

          {/* Email Form */}
          <div className="mb-8">
            <div className="flex gap-0 border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="flex-1 px-4 py-3 border-0 focus:outline-none text-base bg-white font-roboto disabled:bg-gray-50 disabled:text-gray-500"
                disabled={Boolean(isDisabled)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e as React.KeyboardEvent<HTMLInputElement>);
                  }
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={Boolean(isDisabled)}
                className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-roboto"
              >
                {isLoading ? 'Invio...' : 
                 cooldownTime && Date.now() < cooldownTime ? `${getCooldownSeconds()}s` :
                 'Iscriviti ora'}
              </button>
            </div>

            {/* Turnstile CAPTCHA */}
            {siteKey && (
              <div className="mt-4 flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={setTurnstileToken}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{
                    theme: 'light',
                    size: 'normal',
                  }}
                />
              </div>
            )}

            {/* Message */}
            {message && (
              <p className={`mt-3 text-sm font-roboto ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
             {process.env.NODE_ENV === 'development' && rateLimitInfo ? (
               <p className="mt-2 text-xs text-gray-500 font-roboto">
                 Debug: {rateLimitInfo.remaining} richieste rimanenti
                 {rateLimitInfo.resetTime ? ` (reset: ${rateLimitInfo.resetTime})` : ''}
               </p>
             ) : null}
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3">
            <p className="text-gray-600 text-sm font-roboto">
              <span className="font-semibold text-black">{subscriberCount}+</span> viaggiatori hanno già aderito
            </p>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 text-xs text-gray-500 font-roboto">
            <p>© 2025 - BarbiSurfer - Tutti i diritti riservati.</p>
            <div className="mt-1">
              <span>Sviluppato da </span>
              <a href="https://plincode.tech" target="_blank" className="underline">PlinCode</a>
              <span> con </span>
              <a href="https://nextjs.org/" target="_blank" className="underline">Next.js</a>
              <span>. </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero Image */}
      <div className="hidden lg:block w-1/2 relative">
        <Image
          src="/images/vanlife.webp"
          alt="Mountain sunset with camper van adventure"
          fill
          className="object-cover"
          priority
          sizes="50vw"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-amber-500/30 to-red-500/40"></div>
      </div>
    </div>
  );
}

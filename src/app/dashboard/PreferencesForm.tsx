// front-landing/src/app/dashboard/PreferencesForm.tsx
'use client';

import { useState } from 'react';
import type { SubscriberPreferences } from '@/lib/database';

const CHANNELS = [
  {
    key: 'sub_daily_trips' as const,
    title: 'Daily trips',
    desc: 'Le tratte singole disponibili, ogni giorno.',
  },
  {
    key: 'sub_daily_itineraries' as const,
    title: 'Daily itineraries',
    desc: 'Gli itinerari multi tappa, ogni giorno.',
  },
  {
    key: 'sub_custom_trip' as const,
    title: 'Trip su misura',
    desc: 'Solo i viaggi che scegli tu: paese, distanza, periodo.',
  },
];

export function PreferencesForm({
  initial,
  countries,
}: {
  initial: SubscriberPreferences;
  countries: string[];
}) {
  // Default the numeric field so its state always matches what is shown,
  // otherwise the first save sends null and the server rejects it.
  const [prefs, setPrefs] = useState<SubscriberPreferences>({
    ...initial,
    custom_max_km: initial.custom_max_km ?? 1500,
  });
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SubscriberPreferences>(
    key: K,
    value: SubscriberPreferences[K]
  ) => setPrefs((p) => ({ ...p, [key]: value }));

  const custom = Boolean(prefs.sub_custom_trip);

  function validate(): string | null {
    if (!custom) return null;
    if (!prefs.custom_country) return 'Scegli un paese.';
    if (prefs.custom_direction !== 'departure' && prefs.custom_direction !== 'arrival')
      return 'Scegli partenza o arrivo.';
    const km = prefs.custom_max_km;
    if (km === null || !Number.isInteger(km) || km <= 100 || km >= 3000)
      return 'I km massimi devono essere tra 101 e 2999.';
    if (!prefs.custom_date_from || !prefs.custom_date_to) return 'Scegli il periodo (dal / al).';
    if (prefs.custom_date_from > prefs.custom_date_to)
      return 'La data di inizio deve precedere quella di fine.';
    return null;
  }

  async function save() {
    setStatus(null);
    const err = validate();
    setFieldError(err);
    if (err) return;

    setSaving(true);
    try {
      const res = await fetch('/api/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      setStatus(
        res.ok
          ? { kind: 'ok', text: 'Preferenze salvate.' }
          : { kind: 'err', text: data.error ?? `Errore ${res.status}` }
      );
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribeAll() {
    setStatus(null);
    setFieldError(null);
    const zeroed: SubscriberPreferences = {
      ...prefs,
      sub_daily_trips: 0,
      sub_daily_itineraries: 0,
      sub_custom_trip: 0,
    };
    setSaving(true);
    try {
      const res = await fetch('/api/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zeroed),
      });
      if (res.ok) setPrefs(zeroed);
      setStatus(
        res.ok
          ? { kind: 'ok', text: 'Disiscritto da tutti i canali.' }
          : { kind: 'err', text: 'Errore durante la disiscrizione.' }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bs-card overflow-hidden">
        {CHANNELS.map(({ key, title, desc }, i) => (
          <label
            key={key}
            className="flex items-center gap-4 px-5 py-4 cursor-pointer"
            style={i > 0 ? { borderTop: '1px solid var(--bs-border)' } : undefined}
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium" style={{ color: 'var(--bs-text)' }}>
                {title}
              </span>
              <span className="block text-sm bs-muted">{desc}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="bs-switch"
              checked={!!prefs[key]}
              onChange={(e) => set(key, e.target.checked ? 1 : 0)}
            />
          </label>
        ))}
      </div>

      {custom && (
        <div className="bs-card p-5 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="country" className="bs-label">Paese</label>
            <select
              id="country"
              className="bs-input"
              value={prefs.custom_country ?? ''}
              onChange={(e) => set('custom_country', e.target.value)}
            >
              <option value="" disabled>
                Scegli un paese
              </option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="bs-label block">Direzione</span>
            <div className="bs-seg" role="group" aria-label="Direzione">
              <button
                type="button"
                className="bs-seg-btn"
                aria-pressed={prefs.custom_direction === 'departure'}
                onClick={() => set('custom_direction', 'departure')}
              >
                Partenza
              </button>
              <button
                type="button"
                className="bs-seg-btn"
                aria-pressed={prefs.custom_direction === 'arrival'}
                onClick={() => set('custom_direction', 'arrival')}
              >
                Arrivo
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="maxkm" className="bs-label">Quanto vuoi guidare</label>
            <div className="relative">
              <input
                id="maxkm"
                type="number"
                min={101}
                max={2999}
                className="bs-input pr-12"
                value={prefs.custom_max_km ?? ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  set('custom_max_km', Number.isNaN(n) ? null : n);
                }}
              />
              <span className="bs-muted absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                km
              </span>
            </div>
            <span className="bs-muted text-xs">Tra 101 e 2999 km.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="from" className="bs-label">Dal</label>
              <input
                id="from"
                type="date"
                className="bs-input"
                value={prefs.custom_date_from ?? ''}
                onChange={(e) => set('custom_date_from', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="to" className="bs-label">Al</label>
              <input
                id="to"
                type="date"
                className="bs-input"
                value={prefs.custom_date_to ?? ''}
                onChange={(e) => set('custom_date_to', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {fieldError && <div className="bs-alert-error">{fieldError}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="bs-btn bs-btn-primary">
          {saving ? 'Salvataggio...' : 'Salva preferenze'}
        </button>
        <button onClick={unsubscribeAll} disabled={saving} className="bs-btn bs-btn-ghost">
          Disiscriviti da tutto
        </button>
        {status && (
          <span className={status.kind === 'ok' ? 'bs-note-success' : 'bs-note-error'}>
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}

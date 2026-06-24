// front-landing/src/app/dashboard/PreferencesForm.tsx
'use client';

import { useState } from 'react';
import type { SubscriberPreferences } from '@/lib/database';

export function PreferencesForm({
  initial,
  countries,
}: {
  initial: SubscriberPreferences;
  countries: string[];
}) {
  const [prefs, setPrefs] = useState<SubscriberPreferences>(initial);
  const [status, setStatus] = useState<string | null>(null);

  const set = <K extends keyof SubscriberPreferences>(key: K, value: SubscriberPreferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  async function save() {
    setStatus(null);
    const res = await fetch('/api/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    const data = await res.json().catch(() => ({}));
    setStatus(res.ok ? 'Salvato.' : `Errore: ${data.error ?? res.status}`);
  }

  async function unsubscribeAll() {
    const res = await fetch('/api/prefs', { method: 'DELETE' });
    setStatus(res.ok ? 'Disiscritto da tutto.' : 'Errore durante la disiscrizione.');
  }

  const custom = Boolean(prefs.sub_custom_trip);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!prefs.sub_daily_trips}
          onChange={(e) => set('sub_daily_trips', e.target.checked ? 1 : 0)} />
        Daily trips
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!prefs.sub_daily_itineraries}
          onChange={(e) => set('sub_daily_itineraries', e.target.checked ? 1 : 0)} />
        Daily itineraries
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={custom}
          onChange={(e) => set('sub_custom_trip', e.target.checked ? 1 : 0)} />
        Trip su misura
      </label>

      {custom && (
        <fieldset className="border rounded p-4 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm">Paese</span>
            <select value={prefs.custom_country ?? ''}
              onChange={(e) => set('custom_country', e.target.value)}
              className="border rounded px-2 py-1">
              <option value="" disabled>Scegli...</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" name="direction" checked={prefs.custom_direction === 'departure'}
                onChange={() => set('custom_direction', 'departure')} />
              Partenza
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="direction" checked={prefs.custom_direction === 'arrival'}
                onChange={() => set('custom_direction', 'arrival')} />
              Arrivo
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm">Max km (101–2999)</span>
            <input type="number" min={101} max={2999} value={prefs.custom_max_km ?? 1500}
              onChange={(e) => set('custom_max_km', Number(e.target.value))}
              className="border rounded px-2 py-1" />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm">Dal</span>
              <input type="date" value={prefs.custom_date_from ?? ''}
                onChange={(e) => set('custom_date_from', e.target.value)}
                className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm">Al</span>
              <input type="date" value={prefs.custom_date_to ?? ''}
                onChange={(e) => set('custom_date_to', e.target.value)}
                className="border rounded px-2 py-1" />
            </div>
          </div>
        </fieldset>
      )}

      <div className="flex gap-3">
        <button onClick={save} className="bg-black text-white rounded px-4 py-2">Salva</button>
        <button onClick={unsubscribeAll} className="border rounded px-4 py-2">Disiscriviti da tutto</button>
      </div>

      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}

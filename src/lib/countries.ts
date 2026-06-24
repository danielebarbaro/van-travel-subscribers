// Lowercase country keys matching the backend station country values.
export const countries = [
  'italy',
  'france',
  'spain',
  'germany',
  'austria',
  'switzerland',
  'netherlands',
  'belgium',
  'portugal',
  'croatia',
  'slovenia',
] as const;

export type Country = (typeof countries)[number];

export function isKnownCountry(value: string): value is Country {
  return (countries as readonly string[]).includes(value);
}

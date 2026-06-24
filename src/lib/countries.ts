// Lowercase country keys matching the backend station country values
// (Station->country = city.countryName, lowercased). Derived from the live
// Roadsurfer Rally stations API (departure + arrival), not hand-picked.
export const countries = [
  'austria',
  'belgium',
  'canada',
  'france',
  'germany',
  'ireland',
  'italy',
  'netherlands',
  'norway',
  'portugal',
  'spain',
  'sweden',
  'switzerland',
  'united kingdom',
  'united states of america',
] as const;

export type Country = (typeof countries)[number];

export function isKnownCountry(value: string): value is Country {
  return (countries as readonly string[]).includes(value);
}

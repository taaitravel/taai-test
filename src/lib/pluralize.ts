/**
 * Count + word. Irregular plurals are passed in; everything else takes a trailing s.
 * "0 itinerarys" came from appending s to a word that is already irregular.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const n = Number.isFinite(count) ? count : 0;
  const word = Math.abs(n) === 1 ? singular : (plural ?? `${singular}s`);
  return `${n} ${word}`;
}

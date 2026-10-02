export function plural(n: number, singular: string, pluralStr?: string): string {
  if (n === 1) return `${n} ${singular}`;
  return `${n} ${pluralStr || singular + 's'}`;
}

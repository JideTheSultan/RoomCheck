export function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
}

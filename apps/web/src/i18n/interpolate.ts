/**
 * Dictionaries are plain data (no function values) on purpose — they
 * cross the Server → Client component boundary as props (see
 * LocaleProvider), and React only allows serializable values there. A
 * handful of strings need a runtime value spliced in (a name, a score
 * gap, a year); those are authored as `{placeholder}` templates and
 * resolved here instead of being dictionary-level functions.
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

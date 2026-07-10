/** Tiny template interpolation: format("{n} left", { n: 3 }) → "3 left". */
export function format(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}

export function maskCardReference(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return value.replace(/\d(?=\d{4})/g, '*');
  } catch (e) {
    return value;
  }
}

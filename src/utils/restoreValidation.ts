export const UNSUPPORTED_RESTORE_FILE = 'Unsupported file. Choose a CutiSG CSV export (.csv).';

export function restoreFileError(file: { name: string; size: number }): string | null {
  if (!/\.csv$/i.test(file.name)) return UNSUPPORTED_RESTORE_FILE;
  if (file.size === 0) return 'This file is empty. Choose a CSV export with leave records.';
  return null;
}

export function restoreContentError(content: string): string | null {
  if (!content.trim()) return 'This file is empty. Choose a CSV export with leave records.';
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^="?|"$/g, '').replace(/^"|"$/g, ''));
  const required = [/^type$/, /^(title|reason)$/, /^start(?: date)?$/, /^end(?: date)?$/, /^days?$/, /^status$/];
  if (content.includes('\0') || !required.every(pattern => headers.some(h => pattern.test(h)))) {
    return 'Unsupported file contents. Choose a CSV exported from CutiSG.';
  }
  if (lines.length < 2) return 'No leave records found. Choose a CSV export with leave records.';
  return null;
}

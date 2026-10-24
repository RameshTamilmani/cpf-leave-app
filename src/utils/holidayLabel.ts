// Normalize the display label, including names loaded from saved official feeds.
export const holidayLabel = (name: string): string => name.replace(/\bobserved\b/gi, 'Substitute');

import { HOLIDAY_DATASET, HOLIDAY_SOURCE, parseOfficialHolidays } from '../src/utils/officialHolidays';

interface Response {
  status(code: number): Response;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

// Same-origin proxy avoids CORS failures; no employee or leave data is sent.
export default async function handler(request: { method?: string }, response: Response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET'); response.status(405).json({ error: 'Method not allowed' }); return;
  }
  try {
    const upstream = await fetch(`https://data.gov.sg/api/action/datastore_search?resource_id=${HOLIDAY_DATASET}&limit=1000`, {
      signal: AbortSignal.timeout(10000),
      headers: process.env.DATA_GOV_SG_API_KEY ? { 'x-api-key': process.env.DATA_GOV_SG_API_KEY } : {},
    });
    if (!upstream.ok) throw new Error('Official source unavailable');
    const data = await upstream.json();
    if (!data.success || data.result.total > data.result.records.length) throw new Error('Incomplete official dataset');
    const holidays = parseOfficialHolidays(data.result.records);
    const rows = holidays.map(h => ({ date: h.date, day: h.dayOfWeek, holiday: h.name }));
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
    response.status(200).json({ rows, source: HOLIDAY_SOURCE });
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    response.status(503).json({ error: 'Official holiday data is temporarily unavailable.' });
  }
}

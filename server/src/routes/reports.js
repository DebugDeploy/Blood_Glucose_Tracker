import { Router } from 'express';
import { getReportReadings } from '../db/store.js';
import { localDateString } from '../validation.js';

const router = Router();
router.get('/', async (req, res, next) => {
  const date = req.query.date;
  const [year, month, day] = (date || '').split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  if (!validDate) return res.status(400).json({ error: 'Please choose a valid report date.' });
  if (date > localDateString()) return res.status(400).json({ error: 'Date cannot be in the future.' });
  const monthStart = `${date.slice(0,7)}-01`;
  const previousMonthEnd = new Date(Date.UTC(Number(date.slice(0,4)), Number(date.slice(5,7)) - 1, 0)).toISOString().slice(0,10);
  const previousMonthStart = `${previousMonthEnd.slice(0,7)}-01`;
  try {
    const readings = await getReportReadings(req.user.id, previousMonthStart, date);
    const inRange = (start,end) => readings.filter((r) => String(r.date).slice(0,10) >= start && String(r.date).slice(0,10) <= end);
    const summary = (items, start, end) => {
      const values = items.map((r) => Number(r.value));
      return { startDate:start, endDate:end, count:values.length, highest:values.length ? Math.max(...values) : null, lowest:values.length ? Math.min(...values) : null, average:values.length ? Math.round((values.reduce((a,b)=>a+b,0)/values.length)*10)/10 : null };
    };
    const dailyReadings = inRange(date,date).map((r)=>({...r,date:String(r.date).slice(0,10)}));
    res.json({ daily: { ...summary(dailyReadings,date,date), readings: dailyReadings }, monthToDate: summary(inRange(monthStart,date),monthStart,date), previousMonth: summary(inRange(previousMonthStart,previousMonthEnd),previousMonthStart,previousMonthEnd) });
  } catch (error) { next(error); }
});
export default router;

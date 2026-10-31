import { Router } from 'express';
import { deleteReading, listReadings, saveReading } from '../db/store.js';
import { SLOTS, validateReading } from '../validation.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '100', 10) || 100));
    res.json({ readings: await listReadings(req.user.id, limit, (page-1)*limit), page, limit });
  } catch (error) { next(error); }
});

router.post('/', async (req,res,next) => {
  const validation = validateReading(req.body);
  if (validation) return res.status(400).json({ error:validation });
  try { res.status(201).json({ reading: await saveReading(req.user.id, { ...req.body, value:Number(req.body.value) }) }); }
  catch(error) { res.status(error.status || 500).json({ error:error.status ? error.message : 'Could not save this reading.' }); }
});

router.put('/:id', async (req,res,next) => {
  const validation = validateReading(req.body);
  if (validation) return res.status(400).json({ error:validation });
  try { res.json({ reading: await saveReading(req.user.id, { ...req.body, id:req.params.id, value:Number(req.body.value) }) }); }
  catch(error) { res.status(error.status || 500).json({ error:error.status ? error.message : 'Could not update this reading.' }); }
});

router.delete('/:id', async (req,res,next) => {
  try {
    if (!await deleteReading(req.user.id,req.params.id)) return res.status(404).json({ error:'Reading not found.' });
    res.status(204).end();
  } catch(error) { next(error); }
});

export { SLOTS };
export default router;

import { Router } from 'express';
import { deleteReading, listReadings, saveReading } from '../db/store.js';
import { SLOTS, validateReading } from '../validation.js';

const router = Router();

/**
 * GET /api/readings
 * Get list of user's readings with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    // Parse page number (default: 1, minimum: 1)
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);

    // Parse limit (default: 100, minimum: 1, maximum: 100)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '100', 10) || 100));

    // Get readings from database
    res.json({
      readings: await listReadings(req.user.id, limit, (page - 1) * limit),
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/readings
 * Create a new reading
 */
router.post('/', async (req, res, next) => {
  // Validate the reading data
  const validation = validateReading(req.body);
  if (validation) {
    return res.status(400).json({ error: validation });
  }

  try {
    // Save reading to database
    res.status(201).json({
      reading: await saveReading(req.user.id, {
        ...req.body,
        value: Number(req.body.value)
      })
    });
  } catch (error) {
    // Handle validation errors from database
    res.status(error.status || 500).json({
      error: error.status ? error.message : 'Could not save this reading.'
    });
  }
});

/**
 * PUT /api/readings/:id
 * Update an existing reading
 */
router.put('/:id', async (req, res, next) => {
  // Validate the reading data
  const validation = validateReading(req.body);
  if (validation) {
    return res.status(400).json({ error: validation });
  }

  try {
    // Update reading in database
    res.json({
      reading: await saveReading(req.user.id, {
        ...req.body,
        id: req.params.id,
        value: Number(req.body.value)
      })
    });
  } catch (error) {
    // Handle validation errors from database
    res.status(error.status || 500).json({
      error: error.status ? error.message : 'Could not update this reading.'
    });
  }
});

/**
 * DELETE /api/readings/:id
 * Delete a reading
 */
router.delete('/:id', async (req, res, next) => {
  try {
    // Delete reading from database
    const deleted = await deleteReading(req.user.id, req.params.id);

    // Check if reading was found and deleted
    if (!deleted) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    // Return 204 No Content (successful deletion)
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Export SLOTS for use in other files
export { SLOTS };
export default router;

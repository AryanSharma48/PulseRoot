import { Router, Request, Response } from 'express';
import { processEmergency } from '../services/decisionEngine.js';
import { ambulances } from '../data/ambulances.js';
import { hospitals } from '../data/hospitals.js';
import { EmergencyRequest } from '../types/index.js';

const router = Router();

router.post('/emergency', async (req: Request, res: Response) => {
  const { location, type } = req.body as EmergencyRequest;
  if (!location?.lat || !location?.lng) {
    res.status(400).json({ error: 'Location (lat, lng) required' });
    return;
  }
  try {
    const result = await processEmergency(location, type);
    const amb = ambulances.find(a => a.id === result.optimal.ambulance.id);
    if (amb) amb.status = 'dispatched';
    res.json(result);
  } catch (err) {
    console.error('Emergency processing error:', err);
    res.status(500).json({ error: 'Failed to process emergency' });
  }
});

router.get('/ambulances', (_req: Request, res: Response) => {
  res.json(ambulances);
});

router.get('/hospitals', (_req: Request, res: Response) => {
  res.json(hospitals);
});

router.post('/reset', (_req: Request, res: Response) => {
  ambulances.forEach(a => { a.status = 'available'; });
  res.json({ message: 'System reset' });
});

export default router;

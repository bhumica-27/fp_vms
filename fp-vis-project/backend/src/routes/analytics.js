import express from 'express';
import { dbHelpers } from '../database/inMemoryDB.js';
import { authMiddleware } from '../middleware/auth.js';
import { applyDifferentialPrivacy } from '../services/differentialPrivacy.js';

export const analyticsRouter = express.Router();
analyticsRouter.use(authMiddleware);

// Get visit analytics
analyticsRouter.get('/visits', async (req, res) => {
  try {
    const visits = dbHelpers.getAllVisits();
    
    // Group by date
    const byDate = visits.reduce((acc, visit) => {
      const date = new Date(visit.checkInTime).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    // Group by purpose
    const byPurpose = visits.reduce((acc, visit) => {
      acc[visit.purpose] = (acc[visit.purpose] || 0) + 1;
      return acc;
    }, {});
    
    // Apply differential privacy
    const privateCounts = applyDifferentialPrivacy(byDate);
    
    res.json({
      byDate: privateCounts,
      byPurpose,
      total: visits.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Peak hours analysis
analyticsRouter.get('/peak-hours', async (req, res) => {
  try {
    const visits = dbHelpers.getAllVisits();
    
    const byHour = visits.reduce((acc, visit) => {
      const hour = new Date(visit.checkInTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    res.json(byHour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Department-wise statistics
analyticsRouter.get('/departments', async (req, res) => {
  try {
    const visits = dbHelpers.getAllVisits();
    
    const byDepartment = visits.reduce((acc, visit) => {
      const dept = visit.departmentId || 'unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    res.json(byDepartment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

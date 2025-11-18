import express from 'express';
import { dbHelpers } from '../database/inMemoryDB.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const adminRouter = express.Router();

// All routes require authentication
adminRouter.use(authMiddleware);

// Dashboard statistics
adminRouter.get('/dashboard', async (req, res) => {
  try {
    const stats = dbHelpers.getStatistics();
    const recentAnomalies = dbHelpers.getRecentAnomalies(10);
    const activeVisits = dbHelpers.getActiveVisits();
    
    res.json({
      stats,
      recentAnomalies,
      activeVisits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all visitors
adminRouter.get('/visitors', async (req, res) => {
  try {
    const visitors = dbHelpers.getAllVisitors();
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all visits
adminRouter.get('/visits', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let visits = dbHelpers.getAllVisits();
    
    if (startDate) {
      visits = visits.filter(v => new Date(v.checkInTime) >= new Date(startDate));
    }
    if (endDate) {
      visits = visits.filter(v => new Date(v.checkInTime) <= new Date(endDate));
    }
    if (status) {
      visits = visits.filter(v => v.status === status);
    }
    
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manage watchlist
adminRouter.post('/watchlist', adminOnly, async (req, res) => {
  try {
    const { name, phone, idNumber, reason } = req.body;
    const id = dbHelpers.addToWatchlist({ name, phone, idNumber, reason });
    res.json({ message: 'Added to watchlist', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get anomalies
adminRouter.get('/anomalies', async (req, res) => {
  try {
    const anomalies = dbHelpers.getRecentAnomalies(50);
    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
adminRouter.get('/audit-logs', adminOnly, async (req, res) => {
  try {
    const logs = dbHelpers.getAuditLogs(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

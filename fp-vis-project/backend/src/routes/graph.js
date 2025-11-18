import express from 'express';
import { dbHelpers } from '../database/inMemoryDB.js';
import { authMiddleware } from '../middleware/auth.js';

export const graphRouter = express.Router();
graphRouter.use(authMiddleware);

// Get full graph data
graphRouter.get('/data', async (req, res) => {
  try {
    const graphData = dbHelpers.getGraphData();
    res.json(graphData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find connections for a visitor
graphRouter.get('/connections/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { depth = 2 } = req.query;
    
    const connections = dbHelpers.findConnections(nodeId, parseInt(depth));
    
    res.json({
      nodeId,
      connections,
      count: connections.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get temporal patterns
graphRouter.get('/temporal/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const visits = dbHelpers.getAllVisits().filter(v => v.visitorId === visitorId);
    
    const timeline = visits.map(v => ({
      timestamp: v.checkInTime,
      purpose: v.purpose,
      department: v.departmentId,
      duration: v.checkOutTime 
        ? new Date(v.checkOutTime) - new Date(v.checkInTime)
        : null
    }));
    
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

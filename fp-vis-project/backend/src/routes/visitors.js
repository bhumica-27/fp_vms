import express from 'express';
import QRCode from 'qrcode';
import { dbHelpers } from '../database/inMemoryDB.js';
import { authMiddleware } from '../middleware/auth.js';
import { calculateAnomalyScore } from '../services/anomalyDetection.js';

export const visitorRouter = express.Router();

visitorRouter.post('/register', async (req, res) => {
  try {
    const { name, phone, email, idType, idNumber, purpose, visitingDepartment } = req.body;
    
    console.log(`📋 New visitor registration: ${name} (${phone})`);
    
    // Check watchlist
    const isWatchlisted = dbHelpers.checkWatchlist(phone, idNumber);
    if (isWatchlisted) {
      console.log(`🚨 WATCHLIST MATCH: ${phone}`);
      dbHelpers.recordAnomaly({
        type: 'watchlist_match',
        visitorPhone: phone,
        visitorId: null,
        score: 1.0,
        severity: 'high'
      });
      return res.status(403).json({ error: 'Access denied - security check failed' });
    }
    
    // Check if visitor exists
    let visitor = dbHelpers.getVisitorByPhone(phone);
    if (!visitor) {
      visitor = dbHelpers.createVisitor({
        name,
        phone,
        email,
        idType,
        idNumber,
        purpose,
        visitingDepartment
      });
      console.log(`✅ New visitor created: ${visitor.id}`);
    } else {
      console.log(`👤 Returning visitor: ${visitor.id}`);
    }
    
    // Create visit record
    const visit = dbHelpers.createVisit({
      visitorId: visitor.id,
      purpose,
      departmentId: visitingDepartment
    });
    
    // Generate pass
    const pass = dbHelpers.createPass({
      visitorId: visitor.id,
      visitId: visit.id,
      purpose
    });
    
    // Generate QR code
    const qrData = JSON.stringify({
      passId: pass.id,
      visitorId: visitor.id,
      visitId: visit.id,
      timestamp: pass.createdAt
    });
    
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    // Check for anomalies - IMPROVED LOGIC
    const anomalyScore = await calculateAnomalyScore(visitor.id, purpose);
    console.log(`📊 Anomaly score calculated: ${anomalyScore}`);
    
    // Record anomaly if score is above threshold (LOWERED from 0.7 to 0.4)
    if (anomalyScore >= 0.4) {
      const severity = anomalyScore >= 0.7 ? 'high' : 'medium';
      console.log(`⚠️ ANOMALY DETECTED - Score: ${anomalyScore}, Severity: ${severity}`);
      
      dbHelpers.recordAnomaly({
        type: 'behavioral_anomaly',
        visitorId: visitor.id,
        score: anomalyScore,
        severity: severity,
        purpose: purpose,
        phone: phone
      });
      
      console.log(`✅ Anomaly recorded in database`);
    } else {
      console.log(`✅ Normal behavior - no anomaly (score: ${anomalyScore})`);
    }
    
    res.json({
      message: 'Visitor registered successfully',
      visitor,
      visit,
      pass: {
        id: pass.id,
        expiresAt: pass.expiresAt,
        qrCode: qrCodeUrl
      },
      anomalyScore: anomalyScore // Include in response for debugging
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

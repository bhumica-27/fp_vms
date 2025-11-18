import cron from 'node-cron';
import { database } from '../database/inMemoryDB.js';

export function initializeCronJobs() {
  // Clean up expired passes every hour
  cron.schedule('0 * * * *', () => {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, pass] of database.passes.entries()) {
      if (new Date(pass.expiresAt) < now && !pass.used) {
        database.passes.delete(id);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned ${cleanedCount} expired passes`);
  });
  
  // Auto-checkout stale visits (>8 hours) every 6 hours
  cron.schedule('0 */6 * * *', () => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    let checkedOutCount = 0;
    
    for (const [id, visit] of database.visits.entries()) {
      if (visit.status === 'active' && new Date(visit.checkInTime) < eightHoursAgo) {
        visit.status = 'auto-checkout';
        visit.checkOutTime = new Date().toISOString();
        database.visits.set(id, visit);
        checkedOutCount++;
      }
    }
    
    console.log(`🚪 Auto-checkout ${checkedOutCount} stale visits`);
  });
  
  console.log('✅ Cron jobs initialized');
}

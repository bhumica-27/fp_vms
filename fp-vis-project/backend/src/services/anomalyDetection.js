import { dbHelpers } from '../database/inMemoryDB.js';

export async function calculateAnomalyScore(visitorId, currentPurpose) {
  try {
    let score = 0;
    const reasons = [];
    
    const visitor = dbHelpers.getVisitorById(visitorId);
    if (!visitor) {
      console.log('⚠️ Visitor not found for anomaly check');
      return 0;
    }
    
    console.log(`🔍 Analyzing visitor: ${visitorId.substring(0, 8)}...`);
    
    // CHECK TIME FIRST
    const now = new Date();
    const currentHour = now.getHours();
    //const currentHour = 20; // TEMPORARY - Simulate 8 PM

    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
    
    console.log(`⏰ Current time: ${currentTimeStr}`);
    
    if (currentHour < 8 || currentHour >= 18) {
      score += 0.5;
      reasons.push(`After-hours visit at ${currentTimeStr}`);
      console.log(`⚠️ TIME ANOMALY: Visit at ${currentTimeStr} (outside 8 AM - 6 PM)`);
    } else {
      console.log(`✅ Normal hours: ${currentTimeStr}`);
    }
    
    const visits = dbHelpers.getAllVisits().filter(v => v.visitorId === visitorId);
    
    console.log(`📊 Total visits by this visitor: ${visits.length}`);
    
    // New visitor
    if (visits.length === 0) {
      console.log(`👤 New visitor - base score: ${score}`);
      return score > 0 ? score : 0.1;
    }
    
    // Check for rapid successive visits (within 24 hours)
    const recentVisits = visits.filter(v => {
      const hoursSince = (Date.now() - new Date(v.checkInTime)) / (1000 * 60 * 60);
      return hoursSince < 24;
    });
    
    console.log(`📈 Visits in last 24h: ${recentVisits.length}`);
    
    if (recentVisits.length > 2) {
      const frequencyPenalty = 0.4;
      score += frequencyPenalty;
      reasons.push(`${recentVisits.length} visits in 24 hours`);
      console.log(`⚠️ FREQUENCY ANOMALY: ${recentVisits.length} visits in 24h (+${frequencyPenalty})`);
    }
    
    // Check for purpose inconsistency
    const purposes = visits.map(v => v.purpose);
    const uniquePurposes = new Set(purposes);
    
    console.log(`🎯 Unique purposes: ${Array.from(uniquePurposes).join(', ')}`);
    
    if (uniquePurposes.size > 1) {
      const behaviorPenalty = 0.3;
      score += behaviorPenalty;
      reasons.push(`${uniquePurposes.size} different purposes`);
      console.log(`⚠️ BEHAVIOR ANOMALY: ${uniquePurposes.size} different purposes (+${behaviorPenalty})`);
    }
    
    // Cap the maximum score at 1.0
    const finalScore = Math.min(score, 1.0);
    
    console.log(`\n📊 FINAL ANOMALY ANALYSIS:`);
    console.log(`   Visitor ID: ${visitorId.substring(0, 8)}...`);
    console.log(`   Score: ${finalScore.toFixed(2)}`);
    console.log(`   Reasons: ${reasons.length > 0 ? reasons.join(', ') : 'None'}`);
    console.log(`   Risk Level: ${finalScore >= 0.7 ? 'HIGH' : finalScore >= 0.4 ? 'MEDIUM' : 'LOW'}\n`);
    
    return finalScore;
  } catch (error) {
    console.error('❌ Anomaly detection error:', error);
    return 0;
  }
}

import { v4 as uuidv4 } from 'uuid';

// In-memory data stores
export const database = {
  users: new Map(),
  visitors: new Map(),
  visits: new Map(),
  passes: new Map(),
  graphNodes: new Map(),
  graphEdges: new Map(),
  watchlist: new Map(),
  anomalies: new Map(),
  auditLogs: new Map()
};

import bcrypt from 'bcryptjs';

// Generate password hash synchronously
const hashedPassword = bcrypt.hashSync('admin123', 10);

const defaultAdmin = {
  id: uuidv4(),
  username: 'admin',
  password: hashedPassword,
  role: 'admin',
  email: 'admin@fpvis.gov',
  createdAt: new Date().toISOString()
};

database.users.set(defaultAdmin.id, defaultAdmin);

// Helper functions
export const dbHelpers = {
  // Users
  createUser(userData) {
    const id = uuidv4();
    const user = {
      id,
      ...userData,
      createdAt: new Date().toISOString()
    };
    database.users.set(id, user);
    return user;
  },

  getUserByUsername(username) {
    return Array.from(database.users.values()).find(u => u.username === username);
  },

  getUserById(id) {
    return database.users.get(id);
  },

  // Visitors
  createVisitor(visitorData) {
    const id = uuidv4();
    const visitor = {
      id,
      ...visitorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    database.visitors.set(id, visitor);
    
    // Create graph node
    this.createGraphNode({
      id,
      type: 'visitor',
      label: visitorData.name,
      properties: { phone: visitorData.phone }
    });
    
    return visitor;
  },

  getVisitorById(id) {
    return database.visitors.get(id);
  },

  getVisitorByPhone(phone) {
    return Array.from(database.visitors.values()).find(v => v.phone === phone);
  },

  getAllVisitors() {
    return Array.from(database.visitors.values());
  },

  updateVisitor(id, updates) {
    const visitor = database.visitors.get(id);
    if (visitor) {
      const updated = { ...visitor, ...updates, updatedAt: new Date().toISOString() };
      database.visitors.set(id, updated);
      return updated;
    }
    return null;
  },

  // Visits
  createVisit(visitData) {
    const id = uuidv4();
    const visit = {
      id,
      ...visitData,
      status: 'active',
      checkInTime: new Date().toISOString(),
      checkOutTime: null
    };
    database.visits.set(id, visit);
    
    // Create graph edge
    this.createGraphEdge({
      id,
      source: visitData.visitorId,
      target: visitData.departmentId || 'main-office',
      type: 'visited',
      properties: {
        purpose: visitData.purpose,
        timestamp: visit.checkInTime
      }
    });
    
    return visit;
  },

  getVisitById(id) {
    return database.visits.get(id);
  },

  getActiveVisits() {
    return Array.from(database.visits.values()).filter(v => v.status === 'active');
  },

  getAllVisits() {
    return Array.from(database.visits.values());
  },

  checkoutVisit(id) {
    const visit = database.visits.get(id);
    if (visit) {
      visit.status = 'completed';
      visit.checkOutTime = new Date().toISOString();
      database.visits.set(id, visit);
      return visit;
    }
    return null;
  },

  // Passes
  createPass(passData) {
    const id = uuidv4();
    const pass = {
      id,
      ...passData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      used: false
    };
    database.passes.set(id, pass);
    return pass;
  },

  getPassById(id) {
    return database.passes.get(id);
  },

  validatePass(id) {
    const pass = database.passes.get(id);
    if (!pass) return { valid: false, reason: 'Pass not found' };
    if (pass.used) return { valid: false, reason: 'Pass already used' };
    if (new Date(pass.expiresAt) < new Date()) {
      return { valid: false, reason: 'Pass expired' };
    }
    return { valid: true, pass };
  },

  usePass(id) {
    const pass = database.passes.get(id);
    if (pass) {
      pass.used = true;
      pass.usedAt = new Date().toISOString();
      database.passes.set(id, pass);
      return pass;
    }
    return null;
  },

  // Graph Operations
  createGraphNode(nodeData) {
    database.graphNodes.set(nodeData.id, {
      ...nodeData,
      createdAt: new Date().toISOString()
    });
  },

  createGraphEdge(edgeData) {
    database.graphEdges.set(edgeData.id, {
      ...edgeData,
      createdAt: new Date().toISOString()
    });
  },

  getGraphData() {
    return {
      nodes: Array.from(database.graphNodes.values()),
      edges: Array.from(database.graphEdges.values())
    };
  },

  findConnections(nodeId, maxDepth = 2) {
    const visited = new Set();
    const connections = [];
    
    const traverse = (currentId, depth) => {
      if (depth > maxDepth || visited.has(currentId)) return;
      visited.add(currentId);
      
      const edges = Array.from(database.graphEdges.values())
        .filter(e => e.source === currentId || e.target === currentId);
      
      edges.forEach(edge => {
        const nextId = edge.source === currentId ? edge.target : edge.source;
        if (!visited.has(nextId)) {
          connections.push({ edge, depth });
          traverse(nextId, depth + 1);
        }
      });
    };
    
    traverse(nodeId, 0);
    return connections;
  },

  // Watchlist
  addToWatchlist(personData) {
    const id = uuidv4();
    database.watchlist.set(id, {
      id,
      ...personData,
      addedAt: new Date().toISOString()
    });
    return id;
  },

  checkWatchlist(phone, idNumber) {
    return Array.from(database.watchlist.values()).some(
      w => w.phone === phone || w.idNumber === idNumber
    );
  },

  // Anomalies
  recordAnomaly(anomalyData) {
    const id = uuidv4();
    database.anomalies.set(id, {
      id,
      ...anomalyData,
      timestamp: new Date().toISOString(),
      status: 'new'
    });
    return id;
  },

  getRecentAnomalies(limit = 50) {
    return Array.from(database.anomalies.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  },

  // Audit Logs
  createAuditLog(action, userId, details) {
    const id = uuidv4();
    database.auditLogs.set(id, {
      id,
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  },

  getAuditLogs(limit = 100) {
    return Array.from(database.auditLogs.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  },

  // Statistics
  getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const allVisits = Array.from(database.visits.values());
    const todayVisits = allVisits.filter(v => new Date(v.checkInTime) >= today);
    const activeVisits = allVisits.filter(v => v.status === 'active');
    
    return {
      totalVisitors: database.visitors.size,
      totalVisits: allVisits.length,
      todayVisits: todayVisits.length,
      activeVisits: activeVisits.length,
      totalPasses: database.passes.size,
      watchlistEntries: database.watchlist.size,
      anomaliesDetected: database.anomalies.size
    };
  }
};

export default database;
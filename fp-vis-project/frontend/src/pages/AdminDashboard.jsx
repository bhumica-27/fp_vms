// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';

const COLORS = ['#21808d', '#5e5240', '#32b8c6', '#a84b2f'];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeVisits: 0,
    todayVisits: 0,
    anomaliesDetected: 0
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [analytics, setAnalytics] = useState({ byDate: {}, byPurpose: {}, total: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardRes, visitsRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard').catch(err => {
          console.error('Dashboard API error:', err);
          return { data: { stats: {}, recentAnomalies: [] } };
        }),
        api.get('/admin/visits').catch(err => {
          console.error('Visits API error:', err);
          return { data: [] };
        }),
        api.get('/analytics/visits').catch(err => {
          console.error('Analytics API error:', err);
          return { data: { byDate: {}, byPurpose: {}, total: 0 } };
        }),
      ]);

      setStats(dashboardRes.data.stats || stats);
      setRecentVisits(Array.isArray(visitsRes.data) ? visitsRes.data.slice(0, 10) : []);
      setAnomalies(dashboardRes.data.recentAnomalies || []);
      setAnalytics(analyticsRes.data || analytics);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { label: 'Total Visitors', value: stats.totalVisitors || 0, icon: People, color: '#21808d' },
    { label: 'Active Now', value: stats.activeVisits || 0, icon: CheckCircle, color: '#32b8c6' },
    { label: 'Today\'s Visits', value: stats.todayVisits || 0, icon: PersonAdd, color: '#5e5240' },
    { label: 'Anomalies', value: stats.anomaliesDetected || 0, icon: Warning, color: '#a84b2f' },
  ];

  const purposeData = analytics?.byPurpose 
    ? Object.entries(analytics.byPurpose).map(([name, value]) => ({ name, value }))
    : [];

  const dateData = analytics?.byDate
    ? Object.entries(analytics.byDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        visits: count,
      }))
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      {stat.label}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                  </Box>
                  <stat.icon sx={{ fontSize: 48, color: stat.color, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Recent Visits" />
          <Tab label="Analytics" />
          <Tab label="Anomalies" />
        </Tabs>

        {/* Recent Visits Tab */}
        <TabPanel value={activeTab} index={0}>
          {recentVisits.length === 0 ? (
            <Alert severity="info">No visits recorded yet. Register a visitor to see data here.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Visitor ID</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Check-in</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{visit.visitorId?.substring(0, 8)}...</TableCell>
                      <TableCell>{visit.purpose}</TableCell>
                      <TableCell>{visit.departmentId || 'N/A'}</TableCell>
                      <TableCell>{new Date(visit.checkInTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={visit.status}
                          color={visit.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          {purposeData.length === 0 && dateData.length === 0 ? (
            <Alert severity="info">No analytics data yet. Visit data will appear here after registrations.</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Visits by Purpose
                </Typography>
                {purposeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={purposeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {purposeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">No purpose data available</Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Daily Visits Trend
                </Typography>
                {dateData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visits" fill="#21808d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">No date data available</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Anomalies Tab */}
        <TabPanel value={activeTab} index={2}>
          {anomalies.length === 0 ? (
            <Alert severity="success">No anomalies detected</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anomalies.map((anomaly) => (
                    <TableRow key={anomaly.id}>
                      <TableCell>{anomaly.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={anomaly.severity}
                          color={anomaly.severity === 'high' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {anomaly.visitorId && `Visitor: ${anomaly.visitorId.substring(0, 8)}`}
                        {anomaly.score && ` (Score: ${anomaly.score.toFixed(2)})`}
                      </TableCell>
                      <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}

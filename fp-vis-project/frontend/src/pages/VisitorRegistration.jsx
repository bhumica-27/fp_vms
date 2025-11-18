import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';

const purposes = ['Meeting', 'Interview', 'Delivery', 'Consultation', 'Other'];
const departments = ['Administration', 'Finance', 'HR', 'IT', 'Public Relations'];

export default function VisitorRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idType: 'Aadhaar',
    idNumber: '',
    purpose: '',
    visitingDepartment: '',
  });
  const [qrCode, setQrCode] = useState(null);
  const [passData, setPassData] = useState(null);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/visitors/register', formData);
      setPassData(response.data.pass);
      setQrCode(response.data.pass.qrCode);
      setShowQR(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box maxWidth={600} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Visitor Registration
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="ID Type"
            name="idType"
            value={formData.idType}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="Aadhaar">Aadhaar</MenuItem>
            <MenuItem value="PAN">PAN Card</MenuItem>
            <MenuItem value="Passport">Passport</MenuItem>
            <MenuItem value="DL">Driving License</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="ID Number"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Purpose of Visit"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            margin="normal"
            required
          >
            {purposes.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Visiting Department"
            name="visitingDepartment"
            value={formData.visitingDepartment}
            onChange={handleChange}
            margin="normal"
            required
          >
            {departments.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{ mt: 3 }}
            size="large"
          >
            Generate Pass
          </Button>
        </form>
      </Paper>

      <Dialog open={showQR} onClose={() => setShowQR(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your Visitor Pass</DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            {qrCode && <img src={qrCode} alt="QR Code" style={{ maxWidth: '300px' }} />}
            <Typography variant="body1" sx={{ mt: 2 }}>
              Show this QR code at the entrance
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Valid until: {passData && new Date(passData.expiresAt).toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

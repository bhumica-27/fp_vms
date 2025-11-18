import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { QrCodeScanner, CheckCircle, Cancel } from '@mui/icons-material';
import api from '../api/axios';

export default function GuardScanner() {
  const [passId, setPassId] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!passId.trim()) {
      setError('Please enter a pass ID');
      return;
    }

    setLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const response = await api.post('/visitors/validate-pass', { passId: passId.trim() });
      setValidationResult(response.data);
      setPassId('');
    } catch (err) {
      setError(err.response?.data?.reason || err.response?.data?.error || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <Box maxWidth={600} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <QrCodeScanner sx={{ fontSize: 40, color: '#21808d' }} />
          <Typography variant="h4">
            Visitor Pass Scanner
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Scan the visitor's QR code or manually enter the Pass ID to validate entry.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Pass ID"
          value={passId}
          onChange={(e) => setPassId(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter or scan pass ID"
          margin="normal"
          autoFocus
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleValidate}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Validating...' : 'Validate Pass'}
        </Button>

        {validationResult && (
          <Card sx={{ mt: 3, border: '2px solid', borderColor: validationResult.valid ? 'success.main' : 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {validationResult.valid ? (
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
                ) : (
                  <Cancel sx={{ fontSize: 48, color: 'error.main' }} />
                )}
                <Box>
                  <Typography variant="h5">
                    {validationResult.valid ? 'VALID PASS' : 'INVALID PASS'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {validationResult.valid ? 'Access Granted' : 'Access Denied'}
                  </Typography>
                </Box>
              </Box>

              {validationResult.valid && validationResult.visitor && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Visitor Details
                  </Typography>
                  <Typography variant="h6">
                    {validationResult.visitor.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purpose: {validationResult.visitor.purpose}
                  </Typography>
                </>
              )}

              {!validationResult.valid && validationResult.reason && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="error">
                    Reason: {validationResult.reason}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Box mt={4} p={2} bgcolor="background.default" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note:</strong> For demo purposes, you can get a Pass ID by registering as a visitor first.
            In production, this would scan QR codes using the device camera.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
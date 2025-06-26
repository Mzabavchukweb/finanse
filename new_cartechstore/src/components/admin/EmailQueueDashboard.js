import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh as RefreshIcon, Delete as DeleteIcon, Replay as ReplayIcon } from '@mui/icons-material';
import axios from 'axios';

const EmailQueueDashboard = () => {
  const [status, setStatus] = useState(null);
  const [failedEmails, setFailedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, failedRes] = await Promise.all([
        axios.get('/api/admin/email-queue/status'),
        axios.get('/api/admin/email-queue/failed')
      ]);
      setStatus(statusRes.data.data);
      setFailedEmails(failedRes.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch queue data');
      console.error('Error fetching queue data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (jobId) => {
    try {
      await axios.post(`/api/admin/email-queue/retry/${jobId}`);
      fetchData();
    } catch (err) {
      setError('Failed to retry job');
      console.error('Error retrying job:', err);
    }
  };

  const handleClearFailed = async () => {
    try {
      await axios.delete('/api/admin/email-queue/failed');
      setFailedEmails([]);
    } catch (err) {
      setError('Failed to clear failed jobs');
      console.error('Error clearing failed jobs:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Email Queue Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Queue Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Waiting</Typography>
                  <Typography variant="h4">{status?.waiting || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Active</Typography>
                  <Typography variant="h4">{status?.active || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Completed</Typography>
                  <Typography variant="h4">{status?.completed || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Failed</Typography>
                  <Typography variant="h4" color="error">
                    {status?.failed || 0}
                  </Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Never'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Failed Emails</Typography>
                {failedEmails.length > 0 && (
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={handleClearFailed}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Error</TableCell>
                      <TableCell>Failed At</TableCell>
                      <TableCell>Attempts</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failedEmails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No failed emails
                        </TableCell>
                      </TableRow>
                    ) : (
                      failedEmails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell>{email.id}</TableCell>
                          <TableCell>{email.to}</TableCell>
                          <TableCell>
                            <Tooltip title={email.error}>
                              <Typography noWrap sx={{ maxWidth: 300 }}>
                                {email.error}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {new Date(email.failedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>{email.attempts}</TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => handleRetry(email.id)}
                              size="small"
                            >
                              <ReplayIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailQueueDashboard; 
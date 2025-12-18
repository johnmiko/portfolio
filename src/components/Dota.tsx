import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface Match {
  match_id: number;
  title?: string;
  final_score?: number;  time_ago?: string;  [key: string]: any;
}

const Dota: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');

  const API_BASE_URL = import.meta.env.VITE_DOTA_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/matches`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      setMatches(data.slice(0, 20)); // Show first 20 matches
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRateMatch = (match: Match) => {
    setSelectedMatch(match);
    setRating(null);
    setTitle(match.title || '');
    setRatingDialog(true);
  };

  const submitRating = async () => {
    if (!selectedMatch || !rating) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/rate_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: selectedMatch.match_id,
          title,
          score: rating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate match');
      }

      setRatingDialog(false);
      // Optionally refresh matches or show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/api/recalculate`, { method: 'POST' });
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dota Game Finder
      </Typography>
      <Typography variant="body1" paragraph>
        Find interesting Dota 2 matches based on various scoring criteria.
      </Typography>

      <Box mb={3}>
        <Button variant="contained" onClick={handleRecalculate}>
          Recalculate Scores
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Match ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Time Ago</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.match_id}>
                <TableCell>{match.match_id}</TableCell>
                <TableCell>{match.title || 'N/A'}</TableCell>
                <TableCell>{match.final_score || 'N/A'}</TableCell>                <TableCell>{match.time_ago || 'N/A'}</TableCell>                <TableCell>
                  <Button size="small" onClick={() => handleRateMatch(match)}>
                    Rate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)}>
        <DialogTitle>Rate Match #{selectedMatch?.match_id}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            type="number"
            label="Rating (1-100)"
            value={rating || ''}
            onChange={(e) => setRating(Number(e.target.value))}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog(false)}>Cancel</Button>
          <Button onClick={submitRating} disabled={!rating}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dota;
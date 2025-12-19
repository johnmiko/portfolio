import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

interface Match {
  match_id: string | number;
  radiant_team_name?: string;
  dire_team_name?: string;
  final_score: number;
  user_score?: number;
  user_title?: string;
  duration_min?: number;
  title?: string;
  tournament?: string;
}

const DOTA_API_URL = 'https://dota-production-9f0c.up.railway.app';

const Dota: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingTitle, setRatingTitle] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DOTA_API_URL}/api/matches`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRatingDialog = (match: Match) => {
    setSelectedMatch(match);
    setRatingScore(match.user_score || 0);
    setRatingTitle(match.user_title || '');
    setDialogOpen(true);
  };

  const submitRating = async () => {
    if (!selectedMatch) return;
    try {
      const response = await fetch(`${DOTA_API_URL}/api/rate_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: selectedMatch.match_id,
          score: ratingScore,
          title: ratingTitle,
        }),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      setDialogOpen(false);
      fetchMatches();
    } catch (err) {
      console.error('Rating error:', err);
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dota 2 Match Finder
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Top-scored Dota 2 games, ranked by automatic analysis. Click a match to rate it.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Title</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Duration</TableCell>
              <TableCell align="center">Your Rating</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.slice(0, 50).map((match) => (
              <TableRow key={match.match_id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {match.title || `${match.radiant_team_name || 'Radiant'} vs ${match.dire_team_name || 'Dire'}`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Match ID: {match.match_id}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {Math.round(match.final_score)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {typeof match.duration_min === 'number' ? `${match.duration_min}m` : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {match.user_score ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {match.user_score}
                      </Typography>
                      <Typography variant="caption">{match.user_title}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openRatingDialog(match)}
                  >
                    Rate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Rate Match {selectedMatch?.match_id}</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 2 }}>
          <TextField
            label="Score (0-100)"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={ratingScore}
            onChange={(e) => setRatingScore(Number(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Title (optional)"
            value={ratingTitle}
            onChange={(e) => setRatingTitle(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitRating} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dota;
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
  duration_min?: number;
  title?: string;
  tournament?: string;
  days_ago_pretty?: string;
}

const DOTA_API_URL =
  import.meta.env.VITE_DOTA_API_URL || 'https://dota-production-9f0c.up.railway.app';

// Pretty days-ago formatting is now provided by the backend as days_ago_pretty.

const Dota: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [ratingScoreInput, setRatingScoreInput] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Step 1: Immediately fetch from cache
    fetchCachedMatches();
    // Step 2: Then fetch fresh matches in the background
    fetchFreshMatches();
  }, []);

  const fetchCachedMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DOTA_API_URL}/api/matches_cached`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cached matches');
      console.error('Fetch cached error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshMatches = async () => {
    try {
      // Fetch fresh matches from the live API
      const response = await fetch(`${DOTA_API_URL}/api/matches`);
      if (!response.ok) {
        console.warn('Failed to fetch fresh matches, using cache');
        return;
      }
      const data = await response.json();
      // Step 2b: Update the frontend table with fresh data
      setMatches(data);
      
      // Step 3: Update the cached database in the background
      updateCachedDatabase(data);
    } catch (err) {
      console.warn('Fresh matches fetch failed, using cache:', err);
    }
  };

  const updateCachedDatabase = async (matchData: Match[]) => {
    try {
      // Send request to update the matches_cached database
      await fetch(`${DOTA_API_URL}/api/update_cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches: matchData }),
      });
    } catch (err) {
      console.error('Failed to update cache database:', err);
    }
  };

  const fetchMatches = async (updateDb: boolean = false) => {
    try {
      setLoading(true);
      // Fetch from /api/matches with optional update_db parameter
      const url = updateDb 
        ? `${DOTA_API_URL}/api/matches?update_db=true`
        : `${DOTA_API_URL}/api/matches`;
      
      let response = await fetch(url);
      if (!response.ok) {
        response = await fetch(`${DOTA_API_URL}/api/matches_cached`);
      }
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

  const updateLatestMatches = async () => {
    try {
      setUpdating(true);
      await fetchMatches(true);
    } finally {
      setUpdating(false);
    }
  };

  const openRatingDialog = (match: Match) => {
    setSelectedMatch(match);
    setRatingScoreInput(
      typeof match.user_score === 'number' ? String(match.user_score) : ''
    );
    setDialogOpen(true);
  };

  const submitRating = async () => {
    if (!selectedMatch) return;
    const score = parseInt(ratingScoreInput, 10);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      alert('Please enter a score between 0 and 100');
      return;
    }
    try {
      const response = await fetch(`${DOTA_API_URL}/api/rate_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: selectedMatch.match_id,
          score,
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dota 2 Match Finder
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Note: Currently only for personal use.<br />
        Do not have any user specification to distinguish who is rating the match.<br />
        The purpose of rating the match is to have some manual check to see how accurate the scores are.<br />
        Top-scored Dota 2 games, ranked by automatic analysis. Click a match to rate it.
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={updateLatestMatches}
          disabled={updating || loading}
        >
          {updating ? 'Updating...' : 'Update Latest Matches Table'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => fetchMatches(false)}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

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
              <TableCell align="left">Days Ago</TableCell>
              <TableCell align="center">Your Rating</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : matches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">No matches found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              matches.slice(0, 50).map((match) => (
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
                  <TableCell align="left">
                    <Typography variant="body2">
                      {match.days_ago_pretty || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {match.user_score ? (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {match.user_score}
                      </Typography>
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
              ))
            )}
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
            value={ratingScoreInput}
            onChange={(e) => setRatingScoreInput(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
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
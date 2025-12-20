import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Stack,
} from '@mui/material';

interface Opponent {
  key: string;
  label: string;
  description: string;
}

interface SimulatedGame {
  id: string;
  winner: number;
  margin: number;
}

interface SimulateResponse {
  opponent: string;
  games: number;
  wins: {
    player: number;
    opponent: number;
  };
  results: SimulatedGame[];
}

const CRIB_API_URL =
  import.meta.env.VITE_CRIB_API_URL || 'http://localhost:8000';

const Crib: React.FC = () => {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [gamesToRun, setGamesToRun] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulateResult, setSimulateResult] = useState<SimulateResponse | null>(null);

  useEffect(() => {
    const loadOpponents = async () => {
      try {
        const response = await fetch(`${CRIB_API_URL}/opponents`);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data: Opponent[] = await response.json();
        setOpponents(data);
        if (data.length > 0) {
          setSelectedOpponent(data[0].key);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load opponents');
      }
    };

    loadOpponents();
  }, []);

  const runSimulation = async () => {
    if (!selectedOpponent) {
      setError('Select an opponent first');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${CRIB_API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent: selectedOpponent, games: gamesToRun }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Simulation failed');
      }
      const data: SimulateResponse = await response.json();
      setSimulateResult(data);
    } catch (err) {
      setSimulateResult(null);
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cribbage Lab
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Early backend demo: run AI-vs-AI cribbage matches. A playable UI vs the
        agents will be layered on once the session flow is finalized.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Simulate a Matchup
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              displayEmpty
              fullWidth
              size="small"
            >
              {opponents.map((opp) => (
                <MenuItem key={opp.key} value={opp.key}>
                  {opp.label}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Games"
              type="number"
              inputProps={{ min: 1, max: 20 }}
              size="small"
              value={gamesToRun}
              onChange={(e) => setGamesToRun(Number(e.target.value))}
              sx={{ width: { xs: '100%', sm: '140px' } }}
            />
            <Button variant="contained" onClick={runSimulation} disabled={loading}>
              {loading ? 'Running...' : 'Run'}
            </Button>
          </Stack>
          {opponents.length > 0 && (
            <Typography variant="body2" color="textSecondary">
              {opponents.find((o) => o.key === selectedOpponent)?.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      {simulateResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Player (Random) wins: {simulateResult.wins.player} / {simulateResult.games}
              {' - '}Opponent wins: {simulateResult.wins.opponent}
            </Typography>
            <Grid container spacing={2}>
              {simulateResult.results.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2">Game {game.id.slice(0, 8)}</Typography>
                      <Typography variant="body2">
                        Winner: {game.winner === 1 ? 'Player' : 'Opponent'}
                      </Typography>
                      <Typography variant="body2">Margin: {game.margin} pips</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Roadmap
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>Expose session-based endpoints for human-vs-agent play.</li>
            <li>Add move validation helpers to keep the frontend thin.</li>
            <li>Make opponents selectable per session (trained models vs heuristics).</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Crib;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

type ActionType =
  | 'select_crib_cards'
  | 'select_card_to_play'
  | 'waiting_for_computer'
  | 'game_over';

interface CardData {
  rank: string;
  suit: string;
  symbol: string;
  value: number;
}

interface GameStateResponse {
  game_id: string;
  action_required: ActionType;
  message: string;
  your_hand: CardData[];
  table_cards: CardData[];
  scores: { you: number; computer: number };
  dealer: string;
  table_value: number;
  starter_card?: CardData | null;
  valid_card_indices: number[];
  game_over: boolean;
  winner?: string | null;
}

const API_BASE = import.meta.env.VITE_CRIB_API_URL || 'http://localhost:8001';

const suitColor = (suit: string) =>
  suit === 'hearts' || suit === 'diamonds' ? '#c62828' : '#1b1b1b';

const wsUrlFor = (httpUrl: string, gameId: string) => {
  const base = new URL(httpUrl);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = `/ws/${gameId}`;
  base.search = '';
  return base.toString();
};

const Crib: React.FC = () => {
  const [game, setGame] = useState<GameStateResponse | null>(null);
  const [selectedCrib, setSelectedCrib] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const gameId = game?.game_id;

  const connectWs = useMemo(() => {
    if (!gameId) return null;
    return wsUrlFor(API_BASE, gameId);
  }, [gameId]);

  useEffect(() => {
    if (!connectWs) return undefined;
    setWsStatus('connecting');
    const ws = new WebSocket(connectWs);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');
    ws.onmessage = (event) => {
      try {
        const state: GameStateResponse = JSON.parse(event.data);
        setGame(state);
        setSelectedCrib([]);
        setError(null);
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [connectWs]);

  const startGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/game/new`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Failed to start game (${res.status})`);
      }
      const state: GameStateResponse = await res.json();
      setGame(state);
      setSelectedCrib([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const startTestGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'aces_twos_vs_threes_fours', dealer: 'you' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to start test game (${res.status})`);
      }
      const state: GameStateResponse = await res.json();
      setGame(state);
      setSelectedCrib([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test game');
    } finally {
      setLoading(false);
    }
  };

  const submitAction = async (indices: number[]) => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/game/${gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_indices: indices }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Action failed (${res.status})`);
      }
      const state: GameStateResponse = await res.json();
      setGame(state);
      if (state.action_required !== 'select_crib_cards') {
        setSelectedCrib([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCribCard = (index: number) => {
    setSelectedCrib((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };

  const goAllowed = game?.action_required === 'select_card_to_play' && (!game.valid_card_indices || game.valid_card_indices.length === 0);

  const renderHand = () => {
    if (!game) return null;

    if (game.action_required === 'select_crib_cards') {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {game.message || 'Choose 2 cards for the crib'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {game.your_hand.map((card, idx) => (
                <Chip
                  key={idx}
                  label={card.symbol}
                  onClick={() => toggleCribCard(idx)}
                  color={selectedCrib.includes(idx) ? 'primary' : 'default'}
                  variant={selectedCrib.includes(idx) ? 'filled' : 'outlined'}
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: suitColor(card.suit),
                  }}
                />
              ))}
            </Stack>
            <Button
              variant="contained"
              onClick={() => submitAction(selectedCrib)}
              disabled={loading || selectedCrib.length !== 2}
            >
              {loading ? 'Submitting...' : 'Submit crib cards'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (game.action_required === 'select_card_to_play') {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {game.message || 'Play a card'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {game.your_hand.map((card, idx) => (
                <Chip
                  key={idx}
                  label={card.symbol}
                  onClick={() => submitAction([idx])}
                  disabled={!game.valid_card_indices.includes(idx) || loading}
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: suitColor(card.suit),
                    opacity: game.valid_card_indices.includes(idx) ? 1 : 0.45,
                  }}
                  variant={game.valid_card_indices.includes(idx) ? 'filled' : 'outlined'}
                  color={game.valid_card_indices.includes(idx) ? 'primary' : 'default'}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => submitAction([])}
                disabled={loading || (!goAllowed && game.valid_card_indices.length > 0)}
              >
                Say "Go"
              </Button>
            </Stack>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {game.message || 'Waiting for computer'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {game.action_required === 'waiting_for_computer'
              ? 'Computer is playing...'
              : 'Game over. Start a new game to play again.'}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cribbage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Play a quick game against the computer using the new API with live updates.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Button variant="contained" onClick={startGame} disabled={loading}>
          {loading ? 'Starting...' : game ? 'Restart game' : 'Start game'}
        </Button>
        <Button variant="outlined" onClick={startTestGame} disabled={loading}>
          Test game (A/2 vs 3/4)
        </Button>
        <Typography variant="caption" color="text.secondary">
          WS: {wsStatus}
        </Typography>
      </Stack>

      {!game ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ready when you are
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click start to deal a new hand and open a live connection to the crib backend.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Your score
                  </Typography>
                  <Typography variant="h5">{game.scores.you}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Computer score
                  </Typography>
                  <Typography variant="h5">{game.scores.computer}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dealer
                  </Typography>
                  <Typography variant="body2">{game.dealer === 'you' ? 'You' : 'Computer'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Table count
                  </Typography>
                  <Typography variant="body2">{game.table_value}</Typography>
                </Box>
                {game.starter_card && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Starter
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: suitColor(game.starter_card.suit) }}>
                      {game.starter_card.symbol}
                    </Typography>
                  </Box>
                )}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {game.message}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Table
              </Typography>
              {game.table_cards.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No cards on the table yet.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {game.table_cards.map((card, idx) => (
                    <Chip
                      key={`${card.symbol}-${idx}`}
                      label={card.symbol}
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: suitColor(card.suit),
                      }}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {renderHand()}

          {game.game_over && (
            <Alert severity="success">
              Game over. Winner: {game.winner === 'you' ? 'You' : 'Computer'}.
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Crib;

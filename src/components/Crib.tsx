import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  Typography,
  Alert,
  Stack,
  Chip,
} from '@mui/material';

interface Opponent {
  key: string;
  label: string;
  description: string;
}

interface CardModel {
  rank: number;
  suit: number;
}

interface GameStateResponse {
  session_id: string;
  phase: string;
  player_hand: CardModel[];
  opponent_score: number;
  player_score: number;
  dealer: number;
  starter_card: CardModel | null;
  message: string;
  crib_owner: string;
  opponent_cards_left: number;
  cards_played: Array<{ player: CardModel | null; opponent: CardModel | null }>;
}

const CRIB_API_URL =
  import.meta.env.VITE_CRIB_API_URL || 'http://localhost:8000';

const suitSymbols: { [key: number]: string } = {
  1: '♠',
  2: '♥',
  3: '♦',
  4: '♣',
};

const rankNames: { [key: number]: string } = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

const cardToString = (card: CardModel): string =>
  `${rankNames[card.rank]}${suitSymbols[card.suit]}`;

const getCardColor = (card: CardModel): string => {
  // Hearts (2) and Diamonds (3) are red; Spades (1) and Clubs (4) are black
  return card.suit === 2 || card.suit === 3 ? 'red' : 'black';
};

const Crib: React.FC = () => {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCribCards, setSelectedCribCards] = useState<number[]>([]);
  const [selectedPlayCard, setSelectedPlayCard] = useState<number | null>(null);

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

  const startNewGame = async () => {
    if (!selectedOpponent) {
      setError('Select an opponent first');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${CRIB_API_URL}/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent: selectedOpponent }),
      });
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      const data: GameStateResponse = await response.json();
      setGameState(data);
      setSessionId(data.session_id);
      setSelectedCribCards([]);
      setSelectedPlayCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const submitCribThrow = async () => {
    if (!sessionId || !gameState) return;
    if (selectedCribCards.length !== 2) {
      setError('Select exactly 2 cards to discard');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${CRIB_API_URL}/game/${sessionId}/throw-crib`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_indices: selectedCribCards }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to throw cards');
      }
      const data: GameStateResponse = await response.json();
      setGameState(data);
      setSelectedCribCards([]);
      setSelectedPlayCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to throw cards');
    } finally {
      setLoading(false);
    }
  };

  const playCard = async (cardIndex: number) => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const response = await fetch(`${CRIB_API_URL}/game/${sessionId}/play-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_index: cardIndex }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to play card');
      }
      const data: GameStateResponse = await response.json();
      setGameState(data);
      setSelectedPlayCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play card');
    } finally {
      setLoading(false);
    }
  };

  const toggleCribCard = (index: number) => {
    if (selectedCribCards.includes(index)) {
      setSelectedCribCards(selectedCribCards.filter((i) => i !== index));
    } else {
      if (selectedCribCards.length < 2) {
        setSelectedCribCards([...selectedCribCards, index]);
      }
    }
  };

  const currentOpponent = opponents.find((o) => o.key === selectedOpponent);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cribbage
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Play a hand against an AI opponent. Choose your opponent and discard
        cards strategically.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!gameState ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select an Opponent
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
              <Button
                variant="contained"
                onClick={startNewGame}
                disabled={loading || !selectedOpponent}
              >
                {loading ? 'Starting...' : 'Play'}
              </Button>
            </Stack>
            {currentOpponent && (
              <Typography variant="body2" color="textSecondary">
                {currentOpponent.description}
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Score and Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={3} justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Your Score
                    </Typography>
                    <Typography variant="h5">{gameState.player_score}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      {currentOpponent?.label} Opponent Score
                    </Typography>
                    <Typography variant="h5">{gameState.opponent_score}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Phase
                    </Typography>
                    <Typography variant="body2">{gameState.phase}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Crib
                    </Typography>
                    <Typography variant="body2">
                      {gameState.crib_owner === 'player' ? 'Yours' : 'Opponent'}
                    </Typography>
                  </Box>
                  {gameState.starter_card && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Starter
                      </Typography>
                      <Typography variant="body2">
                        {cardToString(gameState.starter_card)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Game Phase Content */}
          {gameState.phase === 'crib_throw' && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {gameState.message}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Your Hand (select 2 cards to discard):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {gameState.player_hand.map((card, idx) => (
                        <Chip
                          key={idx}
                          label={cardToString(card)}
                          onClick={() => toggleCribCard(idx)}
                          color={
                            selectedCribCards.includes(idx) ? 'primary' : 'default'
                          }
                          variant={
                            selectedCribCards.includes(idx) ? 'filled' : 'outlined'
                          }
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            color: getCardColor(card),
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={submitCribThrow}
                    disabled={
                      loading || selectedCribCards.length !== 2
                    }
                  >
                    {loading ? 'Submitting...' : 'Discard'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {gameState.phase === 'play' && (
            <>
              {/* Cards Played */}
              {gameState.cards_played.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Cards Played
                      </Typography>
                      <Grid container spacing={2}>
                        {gameState.cards_played.map((round, idx) => (
                          <Grid item xs={12} sm={6} md={4} key={idx}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                  Round {idx + 1}
                                </Typography>
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      Your Card:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 'bold',
                                        color: round.player ? getCardColor(round.player) : 'inherit',
                                      }}
                                    >
                                      {round.player ? cardToString(round.player) : '—'}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      {currentOpponent?.label} Opponent Card:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 'bold',
                                        color: round.opponent ? getCardColor(round.opponent) : 'inherit',
                                      }}
                                    >
                                      {round.opponent ? cardToString(round.opponent) : '—'}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Player Hand and Opponent Info */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {gameState.message}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          {currentOpponent?.label} Opponent Cards Left
                        </Typography>
                        <Typography variant="h5">{gameState.opponent_cards_left}</Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Your Hand (click to play):
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {gameState.player_hand.map((card, idx) => (
                          <Chip
                            key={idx}
                            label={cardToString(card)}
                            onClick={() => playCard(idx)}
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              color: getCardColor(card),
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {gameState.phase === 'scoring' && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Scoring Phase
                  </Typography>
                  <Typography variant="body2">
                    Hands are being scored. Final results coming soon.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setGameState(null);
                      setSessionId(null);
                    }}
                  >
                    Play Another Hand
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Crib;

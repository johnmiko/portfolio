import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
} from '@mui/material';

interface Medication {
  id: string;
  name: string;
  description: string;
  minTime: number; // minutes
  optimalTime: number; // minutes
  relativeTo?: string; // id of previous med
  efficiency?: { [time: number]: number }; // time in minutes -> efficiency %
}

const medications: Medication[] = [
  {
    id: 'batch1',
    name: 'Vitamin Batch 1',
    description: 'Sertraline, quetiapine, fish oil, etc. (take with fat)',
    minTime: 0,
    optimalTime: 30,
    efficiency: { 0: 60, 10: 75, 20: 88, 30: 100 },
  },
  {
    id: 'batch2',
    name: 'Vitamin Batch 2',
    description: 'Monolaurin + SAMe + NAC',
    minTime: 45,
    optimalTime: 90,
    relativeTo: 'batch1',
    efficiency: { 45: 70, 60: 80, 75: 90, 90: 100 },
  },
  {
    id: 'mos',
    name: 'MOS',
    description: 'Mannan oligosaccharides',
    minTime: 45,
    optimalTime: 90,
    relativeTo: 'batch2',
    efficiency: { 45: 75, 60: 85, 75: 92, 90: 100 },
  },
  {
    id: 'chlorella',
    name: 'Chlorella',
    description: 'Most timing-sensitive binder',
    minTime: 45,
    optimalTime: 90,
    relativeTo: 'mos',
    efficiency: { 45: 70, 60: 85, 75: 92, 90: 100 },
  },
  {
    id: 'meal',
    name: 'First Meal + Vitamin Batch 3',
    description: 'Safe immediately after chlorella',
    minTime: 0,
    optimalTime: 0,
    relativeTo: 'chlorella',
  },
];

const Alarm: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<number>(-1); // -1 = not started
  const [startTimes, setStartTimes] = useState<{ [key: string]: Date }>({});
  const [takenTimes, setTakenTimes] = useState<{ [key: string]: Date }>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [startTimeDialog, setStartTimeDialog] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [mealTime, setMealTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [efficiencyAlerts, setEfficiencyAlerts] = useState<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startSequence = () => {
    setStartTimeDialog(true);
  };

  const confirmStartSequence = () => {
    let startTime: Date;

    if (startTimeInput) {
      // Use the entered time
      startTime = new Date();
      const [hours, minutes] = startTimeInput.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      // If the entered time is in the future, assume it's yesterday
      if (startTime > new Date()) {
        startTime.setDate(startTime.getDate() - 1);
      }
    } else {
      // No time entered, use current time ("now")
      startTime = new Date();
    }

    setStartTimes({ batch1: startTime });
    setCurrentPhase(0);
    setTakenTimes({});
    setEfficiencyAlerts(new Set());
    
    // Calculate earliest meal time (165 minutes from start time)
    const mealTimeCalc = new Date(startTime.getTime() + 165 * 60 * 1000);
    setMealTime(mealTimeCalc);
    
    setStartTimeDialog(false);
    startTimer();
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(checkAlarms, 1000);
  };

  const playEfficiencySound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported, efficiency alert reached silently');
    }
  };

  const checkAlarms = () => {
    const now = new Date();
    setCurrentTime(now); // Update current time to trigger re-renders
    
    medications.forEach((med, index) => {
      if (index > currentPhase) return;

      const startTime = getStartTime(med.id);
      if (!startTime) return;

      const elapsed = (now.getTime() - startTime.getTime()) / 1000 / 60; // minutes
      const efficiency = getEfficiency(med, elapsed);

      // Check for 100% efficiency achievement
      if (efficiency === 100 && !efficiencyAlerts.has(med.id)) {
        setEfficiencyAlerts(prev => new Set(prev).add(med.id));
        // Play sound for 100% efficiency
        playEfficiencySound();
      }

      if (elapsed >= med.optimalTime && !takenTimes[med.id]) {
        // Optimal time reached, show alarm
        if (notificationPermission === 'granted') {
          new Notification(`Time to take ${med.name}!`, {
            body: `Optimal time reached (${med.optimalTime} minutes)`,
            icon: '/vite.svg',
          });
        }
      }
    });
  };

  const getStartTime = (medId: string): Date | null => {
    const med = medications.find(m => m.id === medId);
    if (!med) return null;

    if (med.relativeTo) {
      return takenTimes[med.relativeTo] || null;
    }
    return startTimes[medId] || null;
  };

  const markAsTaken = (medId: string) => {
    const now = new Date();
    setTakenTimes(prev => ({ ...prev, [medId]: now }));

    // Move to next phase
    const currentIndex = medications.findIndex(m => m.id === medId);
    if (currentIndex < medications.length - 1) {
      setCurrentPhase(currentIndex + 1);
    } else {
      setCurrentPhase(-2); // completed
    }
  };

  const getElapsedTime = (medId: string): number => {
    const startTime = getStartTime(medId);
    if (!startTime) return 0;

    return (currentTime.getTime() - startTime.getTime()) / 1000 / 60; // minutes
  };

const getEfficiency = (med: Medication, elapsed: number): number => {
  if (!med.efficiency) return 100;

  const times = Object.keys(med.efficiency).map(Number).sort((a, b) => a - b);

  // If elapsed is before the first time point, return 0
  if (elapsed < times[0]) return 0;

  // If elapsed is at or beyond the last time point, return the last efficiency
  if (elapsed >= times[times.length - 1]) return med.efficiency[times[times.length - 1]];

  // Find the two time points to interpolate between
  for (let i = 0; i < times.length - 1; i++) {
    const time1 = times[i];
    const time2 = times[i + 1];
    const efficiency1 = med.efficiency[time1];
    const efficiency2 = med.efficiency[time2];

    if (elapsed >= time1 && elapsed < time2) {
      // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      const interpolatedEfficiency = efficiency1 + (elapsed - time1) * (efficiency2 - efficiency1) / (time2 - time1);
      return Math.round(interpolatedEfficiency); // Round to nearest integer
    }
  }

  return 0;
};

  const getStatusColor = (med: Medication, index: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (takenTimes[med.id]) return 'success';
    if (index === currentPhase) return 'primary';
    if (index < currentPhase) return 'default';
    return 'default';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Medication Timing Alarm
      </Typography>
      <Typography variant="body1" paragraph>
        Currently recovering from mold poisoning. Create a custom alarm system to more easily track when to take anti fungals and vitamins with efficiency tracking.
      </Typography>

      {mealTime && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Earliest First Meal Time:</strong> {mealTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (2 hours 45 minutes after starting serrapeptase)
          </Typography>
        </Alert>
      )}

      {currentPhase === -1 && (
        <Box mb={3}>
          <Button variant="contained" size="large" onClick={startSequence}>
            Start Medication Sequence
          </Button>
        </Box>
      )}

      {currentPhase === -2 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Medication sequence completed! You can eat now.
        </Alert>
      )}

      {medications.map((med, index) => {
        const elapsed = getElapsedTime(med.id);
        const efficiency = getEfficiency(med, elapsed);
        const isActive = index === currentPhase;
        const isTaken = !!takenTimes[med.id];

        return (
          <Card key={med.id} sx={{ mb: 2, opacity: isTaken ? 0.7 : 1 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">
                  {med.name}
                  <Chip
                    label={isTaken ? 'Taken' : isActive ? 'Active' : 'Pending'}
                    color={getStatusColor(med, index)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                {med.efficiency && (
                  <Typography variant="body2" color="text.secondary">
                    Efficiency: {efficiency}%
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" mb={1}>
                {med.description}
              </Typography>

              {med.relativeTo && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Relative to: {medications.find(m => m.id === med.relativeTo)?.name}
                </Typography>
              )}

              {med.optimalTime > 0 && (
                <Typography variant="body2" mb={1}>
                  Window: {med.minTime}-{med.optimalTime} min (optimal: {med.optimalTime} min)
                </Typography>
              )}

              {isActive && !isTaken && (
                <Box>
                  <Typography variant="body2" mb={1}>
                    Elapsed: {Math.floor(elapsed)} minutes
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((elapsed / med.optimalTime) * 100, 100)}
                    sx={{ mb: 1 }}
                  />
                  <Button variant="outlined" onClick={() => markAsTaken(med.id)}>
                    Mark as Taken
                  </Button>
                </Box>
              )}

              {isTaken && (
                <Typography variant="body2" color="success.main">
                  Taken at: {takenTimes[med.id]?.toLocaleTimeString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <Dialog open={startTimeDialog} onClose={() => setStartTimeDialog(false)}>
        <DialogTitle>When did you take Serrapeptase?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Enter the time you took your first medication (Serrapeptase), or leave blank to start now.
          </Typography>
          <TextField
            type="time"
            label="Time taken (optional)"
            value={startTimeInput}
            onChange={(e) => setStartTimeInput(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartTimeDialog(false)}>Cancel</Button>
          <Button onClick={confirmStartSequence} variant="contained">
            Start Sequence
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alarm;
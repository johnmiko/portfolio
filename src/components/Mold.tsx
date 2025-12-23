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
import { Slider, Switch, FormControlLabel } from '@mui/material';

interface Medication {
  id: string;
  name: string;
  description: string;
  minTime: number; // minutes
  optimalTime: number; // minutes
  relativeTo?: string; // id of previous med
  efficiency?: { [time: number]: number }; // time in minutes -> efficiency %
}

const baseMedications: Medication[] = [
  {
    id: 'batch1',
    name: 'Vitamin Batch 1',
    description: 'Sertraline, quetiapine, fish oil, etc. (take with fat)',
    minTime: 30,
    optimalTime: 60,
    efficiency: { 30: 85, 45: 95, 60: 100 },
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
    optimalTime: 90,
    relativeTo: 'chlorella',
    efficiency: { 0: 70, 15: 75, 30: 90, 60: 95, 90: 100 },
  },
];

// Demo schedule: each step can reach 100% in ~1 minute
const demoMedications: Medication[] = [
  {
    id: 'batch1',
    name: 'Vitamin Batch 1',
    description: 'Demo: first batch',
    minTime: 0,
    optimalTime: 1,
    efficiency: { 0: 0, 1: 100 },
  },
  {
    id: 'batch2',
    name: 'Vitamin Batch 2',
    description: 'Demo: second batch',
    minTime: 1,
    optimalTime: 1,
    relativeTo: 'batch1',
    efficiency: { 0: 0, 1: 100 },
  },
  {
    id: 'mos',
    name: 'MOS',
    description: 'Demo: MOS',
    minTime: 1,
    optimalTime: 1,
    relativeTo: 'batch2',
    efficiency: { 0: 0, 1: 100 },
  },
  {
    id: 'chlorella',
    name: 'Chlorella',
    description: 'Demo: binder',
    minTime: 1,
    optimalTime: 1,
    relativeTo: 'mos',
    efficiency: { 0: 0, 1: 100 },
  },
  {
    id: 'meal',
    name: 'First Meal + Vitamin Batch 3',
    description: 'Demo: meal after chlorella',
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
  const [useDemo, setUseDemo] = useState<boolean>(false);
  const [alarmEfficiency, setAlarmEfficiency] = useState<number>(100); // Alarm threshold + simulation
  const [showNotifications, setShowNotifications] = useState<boolean>(true);
  const [beepOnce, setBeepOnce] = useState<boolean>(false);
  const [proteinShakeCount, setProteinShakeCount] = useState<number>(0);
  const [phggCount, setPhggCount] = useState<number>(0);
  const [chiaSeedsCount, setChiaSeedsCount] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const beepIntervalRef = useRef<number | null>(null);
  const [alarmMedId, setAlarmMedId] = useState<string | null>(null);
  const [alarmMessage, setAlarmMessage] = useState<string | null>(null);
  const [overrideTimeDialog, setOverrideTimeDialog] = useState(false);
  const [overrideMedId, setOverrideMedId] = useState<string | null>(null);
  const [overrideMinutesAgo, setOverrideMinutesAgo] = useState<string>('0');

  // Active medications set (base or demo)
  const medications = useDemo ? demoMedications : baseMedications;

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
    // Try Web Audio API; fallback to HTMLAudioElement if blocked
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const audioContext = new Ctx();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.9);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.9);
        return;
      }
    } catch {}
    try {
      // Basic short beep; will be re-triggered in a loop by startAlarm()
      const audio = new Audio('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAAA');
      audio.play().catch(() => {});
    } catch {}
  };

  const startAlarm = (medName: string) => {
    setAlarmMessage(`Time to take ${medName}! Reached ${alarmEfficiency}% efficiency.`);
    setTimeout(() => {
      // start immediate beep then every 1s until stopped (unless beepOnce is true)
      playEfficiencySound();
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      if (!beepOnce) {
        beepIntervalRef.current = window.setInterval(playEfficiencySound, 1000);
      }
    }, 0);
  };

  const stopAlarm = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    setAlarmMedId(null);
    setAlarmMessage(null);
  };

  const computeEarliestTime = (medId: string, memo: Map<string, Date | null> = new Map()): Date | null => {
    if (memo.has(medId)) return memo.get(medId) ?? null;
    const med = medications.find(m => m.id === medId);
    if (!med) return null;

    let base: Date | null = null;
    if (med.relativeTo) {
      base = takenTimes[med.relativeTo] || computeEarliestTime(med.relativeTo, memo);
    } else {
      base = startTimes[medId] || null;
    }
    if (!base) {
      memo.set(medId, null);
      return null;
    }
    const ts = new Date(base.getTime() + (med.minTime || 0) * 60 * 1000);
    memo.set(medId, ts);
    return ts;
  };

  useEffect(() => {
    setMealTime(computeEarliestTime('meal'));
  }, [startTimes, takenTimes]);

  // When phase changes, clear old med's alert to allow fresh alarm on new med
  useEffect(() => {
    if (currentPhase >= 0 && currentPhase < medications.length) {
      const activeMed = medications[currentPhase];
      console.log(`[Alarm] Phase changed to: ${activeMed.name}`);
      // If this med hasn't been triggered yet, allow it to alarm fresh
      setEfficiencyAlerts(prev => {
        const updated = new Set(prev);
        // Keep alerts for taken meds, but clear for the newly active med
        updated.delete(activeMed.id);
        return updated;
      });
    }
  }, [currentPhase, medications]);

  const getTimeForEfficiency = (med: Medication, eff: number): number => {
    // Returns minutes to reach desired efficiency, clamped to min/last points
    if (!med.efficiency) {
      // Fallback: scale linearly between minTime (0 eff) and optimalTime (100 eff)
      const minutes = Math.round((eff / 100) * (med.optimalTime || med.minTime || 0));
      return Math.max(med.minTime || 0, minutes);
    }

    const points = Object.keys(med.efficiency)
      .map(Number)
      .sort((a, b) => a - b);
    const effAt = (t: number) => med.efficiency![t];

    // If target efficiency is below first point, clamp to first time
    if (eff <= effAt(points[0])) {
      return Math.max(points[0], med.minTime || 0);
    }
    // If target efficiency is above/equal to last point, clamp to last time
    if (eff >= effAt(points[points.length - 1])) {
      return Math.max(points[points.length - 1], med.minTime || 0);
    }

    // Find segment where eff1 <= eff < eff2 and inverse-interpolate time
    for (let i = 0; i < points.length - 1; i++) {
      const t1 = points[i];
      const t2 = points[i + 1];
      const e1 = effAt(t1);
      const e2 = effAt(t2);
      if (eff >= e1 && eff <= e2) {
        const time = t1 + ((eff - e1) * (t2 - t1)) / (e2 - e1);
        return Math.max(Math.round(time), med.minTime || 0);
      }
    }

    return Math.max(med.minTime || 0, points[points.length - 1]);
  };

  const computeScheduleForEfficiency = (eff: number): { [key: string]: Date } | null => {
    const baseStart = startTimes['batch1'];
    if (!baseStart) return null;

    const schedule: { [key: string]: Date } = {};
    let prevTime = new Date(baseStart);

    for (const med of medications) {
      if (med.id === 'meal') {
        // Meal time is immediately after last med by minTime (often 0)
        const mealAt = new Date(prevTime.getTime() + (med.minTime || 0) * 60000);
        schedule[med.id] = mealAt;
        prevTime = mealAt;
        continue;
      }

      const waitMinutes = getTimeForEfficiency(med, eff);
      const takeAt = new Date(prevTime.getTime() + waitMinutes * 60000);
      schedule[med.id] = takeAt;
      prevTime = takeAt;
    }

    return schedule;
  };

  // Removed target meal time feature

  const checkAlarms = () => {
    const now = new Date();
    setCurrentTime(now); // Update current time to trigger re-renders
    
    medications.forEach((med, index) => {
      if (index > currentPhase) return;

      const startTime = getStartTime(med.id);
      if (!startTime) return;

      const elapsed = (now.getTime() - startTime.getTime()) / 1000 / 60; // minutes
      const efficiency = getEfficiency(med, elapsed);
      const isActive = index === currentPhase;
      const notTaken = !takenTimes[med.id];
      const thresholdReached = efficiency >= alarmEfficiency;
      const alreadyAlarmed = efficiencyAlerts.has(med.id);

      if (isActive && notTaken) {
        console.log(`[Alarm] ${med.name}: eff=${efficiency}%, target=${alarmEfficiency}%, threshold=${thresholdReached}, alarmed=${alreadyAlarmed}`);
      }

      // Check for reaching the alarm threshold on the active medication
      if (isActive && notTaken && thresholdReached && !alreadyAlarmed) {
        console.log(`[Alarm] TRIGGER: ${med.name} reached ${alarmEfficiency}%`);
        setEfficiencyAlerts(prev => new Set(prev).add(med.id));
        setAlarmMedId(med.id);
        startAlarm(med.name);
        if (showNotifications && notificationPermission === 'granted') {
          new Notification(`Time to take ${med.name}!`, {
            body: `Reached ${alarmEfficiency}% efficiency`,
            icon: '/vite.svg',
          });
        }
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

  const markAsTaken = (medId: string, overrideMinutesAgo?: number) => {
    const now = new Date();
    let takenTime = now;
    
    // If override is provided, calculate the time minutes ago
    if (overrideMinutesAgo !== undefined && overrideMinutesAgo > 0) {
      takenTime = new Date(now.getTime() - overrideMinutesAgo * 60000);
    }
    
    setTakenTimes(prev => ({ ...prev, [medId]: takenTime }));

    // Stop alarm when acknowledging/taking a med
    if (alarmMedId === medId) {
      stopAlarm();
    }

    // Move to next phase
    const currentIndex = medications.findIndex(m => m.id === medId);
    if (currentIndex < medications.length - 1) {
      setCurrentPhase(currentIndex + 1);
    } else {
      setCurrentPhase(-2); // completed
    }
  };

  const handleOverrideTimeSubmit = () => {
    if (overrideMedId) {
      const minutesAgo = parseInt(overrideMinutesAgo, 10) || 0;
      markAsTaken(overrideMedId, minutesAgo);
      setOverrideTimeDialog(false);
      setOverrideMedId(null);
      setOverrideMinutesAgo('0');
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

  const getFiberEffectiveness = (total: number): { level: string; description: string } => {
    if (total < 5) return { level: 'None', description: 'Not enough fiber. Aim for at least 5g.' };
    if (total < 10) return { level: 'Minimal', description: 'Barely moves stool. High chance toxins sit longer. ~10–20% effective for clearance.' };
    if (total < 15) return { level: 'Slight', description: 'Slight help. Still slow transit for most people. ~30% effective.' };
    if (total < 20) return { level: 'Starting', description: 'Minimum where things start working. Some benefit. ~50% effective.' };
    if (total < 25) return { level: 'Decent', description: 'Decent. Many people okay here. Still suboptimal with binders. ~65–70%.' };
    if (total < 30) return { level: 'Solid', description: 'Solid baseline. Low reabsorption risk. ~80%.' };
    if (total < 35) return { level: 'Sweet Spot', description: 'Sweet spot for most. Good speed, good consistency. ~90%.' };
    return { level: 'Excellent', description: 'Still good if tolerated. Marginal gains over 30 g. ~92–95%.' };
  };

  const totalFiber = proteinShakeCount * 5 + phggCount * 5 + chiaSeedsCount * 2.5;
  const fiberInfo = getFiberEffectiveness(totalFiber);

  const getStatusColor = (med: Medication, index: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (takenTimes[med.id]) return 'success';
    if (index === currentPhase) return 'primary';
    if (index < currentPhase) return 'default';
    return 'default';
  };

  const baseStart = startTimes['batch1'];
  const mealMinutes = mealTime && baseStart ? Math.round((mealTime.getTime() - baseStart.getTime()) / 60000) : null;

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1">
          Medication Timing Alarm
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => {
              playEfficiencySound();
              if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Test Alarm', {
                  body: `Test alarm at ${alarmEfficiency}% efficiency`,
                  icon: '/android-chrome-192x192.png',
                });
              }
            }}
          >
            Test Alarm
          </Button>
          <FormControlLabel
            control={<Switch checked={showNotifications} onChange={(e) => setShowNotifications(e.target.checked)} />}
            label="Desktop Notifications"
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={<Switch checked={beepOnce} onChange={(e) => setBeepOnce(e.target.checked)} />}
            label="Beep Once"
            sx={{ m: 0 }}
          />
          <FormControlLabel
            sx={{ ml: 1 }}
            control={<Switch
              checked={useDemo}
              onChange={(e) => {
                const on = e.target.checked;
                console.log(`[Alarm] Demo Mode toggled: ${on}`);
                setUseDemo(on);
                if (intervalRef.current) clearInterval(intervalRef.current);
                stopAlarm();
                if (on) {
                  // Auto-start sequence in demo mode
                  const now = new Date();
                  setStartTimes({ batch1: now });
                  setCurrentPhase(0);
                  setTakenTimes({});
                  setEfficiencyAlerts(new Set());
                  // Request notifications again to ensure permission
                  if ('Notification' in window && Notification.permission !== 'granted') {
                    Notification.requestPermission().catch(() => {});
                  }
                  startTimer();
                } else {
                  // Stop and reset when turning off demo
                  setCurrentPhase(-1);
                  setStartTimes({});
                  setTakenTimes({});
                  setEfficiencyAlerts(new Set());
                }
              }} />}
            label="Demo Mode"
          />
        </Box>
      </Box>
      <Typography variant="body1" paragraph>
        Currently recovering from mold poisoning. Create a custom alarm system to more easily track when to take anti fungals and vitamins with efficiency tracking.
      </Typography>

      <Box display="flex" gap={3} sx={{ alignItems: 'flex-start' }}>
        {/* Left side: Medications */}
        <Box flex={1}>

      {mealTime && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body1">
                <strong>Earliest First Meal Time:</strong> {mealTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mealMinutes !== null
                  ? `(~${mealMinutes} minutes after starting serrapeptase)`
                  : 'Based on current timing of prior meds.'}
              </Typography>
             </Box>
          </Box>
        </Alert>
      )}

      {/* Efficiency slider simulation */}
      {currentPhase >= 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Efficiency Simulation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Slide to see predicted times if each medication is taken at the selected efficiency.
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={alarmEfficiency}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                onChange={(_, v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  console.log(`[Alarm] Slider changed to ${val}%`);
                  setAlarmEfficiency(val);
                  // Reset alerts so the current med can alarm again at the new threshold
                  setEfficiencyAlerts(new Set());
                  // Stop any ongoing beep from previous threshold
                  stopAlarm();
                }}
              />
            </Box>
            {(() => {
              const schedule = computeScheduleForEfficiency(alarmEfficiency);
              if (!schedule) return null;
              const mealAt = schedule['meal'];
              return (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Predicted Meal Time at {alarmEfficiency}%: <strong>{mealAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</strong>
                  </Typography>
                </Alert>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* In-app alarm snackbar */}
      <Dialog open={Boolean(alarmMessage)} onClose={stopAlarm}>
        <DialogTitle>Alarm</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{alarmMessage}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This alarm will keep sounding until you stop it or mark the medication as taken.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopAlarm}>Stop Alarm</Button>
        </DialogActions>
      </Dialog>

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
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" onClick={() => markAsTaken(med.id)}>
                      Mark as Taken
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        setOverrideMedId(med.id);
                        setOverrideMinutesAgo('0');
                        setOverrideTimeDialog(true);
                      }}
                    >
                      Override Time
                    </Button>
                  </Box>
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
        </Box>

        {/* Right side: Fiber Tracker */}
        <Box sx={{ minWidth: '280px', maxWidth: '320px' }}>
          <Card sx={{ mb: 3, position: 'sticky', top: 16 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fiber Tracker
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Protein Shake: {proteinShakeCount} × 5g = {proteinShakeCount * 5}g
                </Typography>
                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setProteinShakeCount(Math.max(0, proteinShakeCount - 1))}
                  >
                    −
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setProteinShakeCount(proteinShakeCount + 1)}
                  >
                    +
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  PHGG: {phggCount} × 5g = {phggCount * 5}g
                </Typography>
                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPhggCount(Math.max(0, phggCount - 1))}
                  >
                    −
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setPhggCount(phggCount + 1)}
                  >
                    +
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Chia Seeds: {chiaSeedsCount} × 2.5g = {(chiaSeedsCount * 2.5).toFixed(1)}g
                </Typography>
                <Box display="flex" gap={1} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setChiaSeedsCount(Math.max(0, chiaSeedsCount - 1))}
                  >
                    −
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setChiaSeedsCount(chiaSeedsCount + 1)}
                  >
                    +
                  </Button>
                </Box>
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2">
                  Total Fiber: <strong>{totalFiber.toFixed(1)}g</strong>
                </Typography>
              </Box>

              {/* All fiber effectiveness levels */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[
                  { range: '< 5g', level: 'None', description: 'Not enough fiber. Aim for at least 5g.' },
                  { range: '5–10g', level: 'Minimal', description: 'Barely moves stool. High chance toxins sit longer. ~10–20% effective for clearance.' },
                  { range: '10–15g', level: 'Slight', description: 'Slight help. Still slow transit for most people. ~30% effective.' },
                  { range: '15–20g', level: 'Starting', description: 'Minimum where things start working. Some benefit. ~50% effective.' },
                  { range: '20–25g', level: 'Decent', description: 'Decent. Many people okay here. Still suboptimal with binders. ~65–70%.' },
                  { range: '25–30g', level: 'Solid', description: 'Solid baseline. Low reabsorption risk. ~80%.' },
                  { range: '30–35g', level: 'Sweet Spot', description: 'Sweet spot for most. Good speed, good consistency. ~90%.' },
                  { range: '> 35g', level: 'Excellent', description: 'Still good if tolerated. Marginal gains over 30 g. ~92–95%.' },
                ].map((item, idx) => {
                  const isCurrentLevel = fiberInfo.level === item.level;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        p: 1,
                        backgroundColor: isCurrentLevel ? '#e3f2fd' : '#f5f5f5',
                        border: isCurrentLevel ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        borderRadius: 0.5,
                        cursor: 'default',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: isCurrentLevel ? 'bold' : 'normal' }}>
                        {item.range} — <strong>{item.level}</strong>
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
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

      <Dialog open={overrideTimeDialog} onClose={() => setOverrideTimeDialog(false)}>
        <DialogTitle>Override Medication Time</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            How many minutes ago did you take this medication?
          </Typography>
          <TextField
            type="number"
            label="Minutes ago"
            value={overrideMinutesAgo}
            onChange={(e) => setOverrideMinutesAgo(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOverrideTimeDialog(false);
            setOverrideMedId(null);
            setOverrideMinutesAgo('0');
          }}>
            Cancel
          </Button>
          <Button onClick={handleOverrideTimeSubmit} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Target meal time dialog removed */}
    </Box>
  );
};

export default Alarm;
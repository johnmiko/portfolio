import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Resume from './components/Resume';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

const Dota = lazy(() => import('./components/Dota'));
const Alarm = lazy(() => import('./components/Alarm'));
const Crib = lazy(() => import('./components/Crib'));

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            }
          >
            <Routes>
              <Route path="/" element={<Resume />} />
              <Route path="/dota" element={<Dota />} />
              <Route path="/alarm" element={<Alarm />} />
              <Route path="/crib" element={<Crib />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

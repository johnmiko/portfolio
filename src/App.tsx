import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Resume from './components/Resume';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

const Dota = lazy(() => import('./components/Dota'));
const Mold = lazy(() => import('./components/Mold'));
const Crib = lazy(() => import('./components/Crib'));
const Miscellaneous = lazy(() => import('./components/Miscellaneous'));

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
              <Route path="/mold" element={<Mold />} />
              <Route path="/crib" element={<Crib />} />
              <Route path="/misc" element={<Miscellaneous />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

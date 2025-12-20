import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Resume from './components/Resume';
import Dota from './components/Dota';
import Alarm from './components/Alarm';
import Crib from './components/Crib';

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
          <Routes>
            <Route path="/" element={<Resume />} />
            <Route path="/dota" element={<Dota />} />
            <Route path="/alarm" element={<Alarm />} />
            <Route path="/crib" element={<Crib />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { AppBar, Toolbar, Tabs, Tab, Box, Container, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getTabValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/dota':
        return 1;
      case '/alarm':
        return 2;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Tabs value={getTabValue()} textColor="inherit" indicatorColor="secondary">
            <Tab label="Resume" component={Link} to="/" />
            <Tab label="Dota" component={Link} to="/dota" />
            <Tab label="Alarm" component={Link} to="/alarm" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'grey.100' }}>
        <Container maxWidth="sm">
          <Typography variant="body1" align="center">
            Contact: mickeywmiko@gmail.com | 587-700-2734
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
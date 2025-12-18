import React from 'react';
import { Typography, Box } from '@mui/material';

const Alarm: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Alarm Project
      </Typography>
      <Typography variant="body1">
        This is a placeholder for the Alarm project. New frontend integration coming soon.
      </Typography>
    </Box>
  );
};

export default Alarm;
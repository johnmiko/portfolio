import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

const Miscellaneous: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Miscellaneous
      </Typography>
      <Card>
        <CardContent>
          <Typography>Random things</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Miscellaneous;

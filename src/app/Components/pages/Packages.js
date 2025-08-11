import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';

const packages = [
  {
    name: 'Basic',
    price: '$9.99/month',
    features: [
      'Up to 100 products',
      'Basic Analytics',
      'Email Support',
    ],
  },
  {
    name: 'Premium',
    price: '$29.99/month',
    features: [
      'Up to 500 products',
      'Advanced Analytics',
      'Priority Email Support',
      'Custom Reports',
    ],
  },
  {
    name: 'Gold',
    price: '$49.99/month',
    features: [
      'Unlimited products',
      'Advanced Analytics & Insights',
      '24/7 Phone Support',
      'Custom Reports & Dashboards',
    ],
  },
];

const PackagePage = () => {
  return (
    <Box sx={{ padding: '40px', backgroundColor: '#f4f4f9' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Choose the Perfect Package for Your Needs
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {packages.map((pkg) => (
          <Grid item xs={12} md={4} key={pkg.name}>
            <Paper
              sx={{
                padding: '30px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
                {pkg.name}
              </Typography>
              <Typography variant="h6" sx={{ color: '#777', marginBottom: '20px' }}>
                {pkg.price}
              </Typography>
              <Box sx={{ marginBottom: '20px' }}>
                {pkg.features.map((feature, index) => (
                  <Typography key={index} variant="body1" sx={{ marginBottom: '10px' }}>
                    {feature}
                  </Typography>
                ))}
              </Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#115293',
                  },
                }}
              >
                Select {pkg.name}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PackagePage;

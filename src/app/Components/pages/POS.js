import React, { useState, useRef } from 'react';
import {
    Box, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TextField, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem,
    FormControl, InputLabel, Divider
} from '@mui/material';
import { Delete, Print } from '@mui/icons-material';
import ReactToPrint from 'react-to-print';

import QuickSales from '../Models/quickSales';
// import QuickSales from '../Models/quickSalesAI';

const POSPage = () => {
    return (
        <Box sx={{ padding: '1rem' }}>
            <QuickSales />
        </Box>
    );
};

export default POSPage;

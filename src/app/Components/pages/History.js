import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { useSelector } from 'react-redux';
import { selectHistory } from '../../features/api/historySlice';
import { selectStock } from '../../features/stock/stockSlice';
import ItemsExerpt from '../../features/items/ItemsExerpt';
import HistoryTable from '../tables/HistoryTable';
import { useSettings } from '../Settings';

const HistoryPage = () => {

    const { settings } = useSettings();

    const inventory = useSelector(selectStock);
    const history = useSelector(selectHistory);

    return (
<>
<HistoryTable historyData={history} itemsData={inventory} companyName="HamTech Solutions" />
{/* historyData={history} itemData={inventory} */}
</>
    );
};

export default HistoryPage;

import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, MenuItem } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FilterIcon from '@mui/icons-material/FilterList';

const style = {
    position: 'fixed',
    top: '2rem',
    left: 0,
    width: '60%',
    marginLeft:'20%',
    borderRadius:'1rem',
    height: '100vh',
    bgcolor: 'background.paper',
    borderRadius: 0,
    boxShadow: 24,
    p: 4,
    fontFamily: 'Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
};

const contentStyle = {
    overflowY: 'auto',
    flexGrow: 1,
    mt: 2,
};

const buttonStyle = {
    mt: 2,
};

const FilterModal = ({ onApplyFilters }) => {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        supplier: '',
        stockLevel: '',
        priceRange: '',
        dateAdded: null,
        dateUpdated: null,
        location: '',
        reorderLevel: '',
        sku: '',
        brand: '',
        status: '',
        discounted: '',
        tags: '',
        unitsSold: '',
        type: '',
        weight: '',
    });

    const filterOptions = {
        category: ['Electronics', 'Apparel', 'Home Goods'],
        supplier: ['Supplier A', 'Supplier B', 'Supplier C'],
        status: ['In Stock', 'Out of Stock', 'Discontinued'],
        // Add more filter options as needed
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const handleDateChange = (name, date) => {
        setFilters({ ...filters, [name]: date });
    };

    const handleApplyFilters = () => {
        onApplyFilters(filters);
        handleClose();
    };

    const renderFilterInput = (filter) => {
        if (filter === 'dateAdded' || filter === 'dateUpdated') {
            return (
                <DatePicker
                    selected={filters[filter]}
                    onChange={(date) => handleDateChange(filter, date)}
                    customInput={<TextField label={`Select ${filter.replace(/([A-Z])/g, ' $1').trim()}`} fullWidth margin="normal" />}
                    dateFormat="dd/MM/yyyy"
                />
            );
        } else if (filterOptions[filter]) {
            return (
                <TextField
                    select
                    label={`Select ${filter}`}
                    name={filter}
                    value={filters[filter]}
                    onChange={handleFilterChange}
                    fullWidth
                    margin="normal"
                >
                    {filterOptions[filter].map((option, index) => (
                        <MenuItem key={index} value={option}>{option}</MenuItem>
                    ))}
                </TextField>
            );
        } else if (filter === 'stockLevel' || filter === 'priceRange' || filter === 'reorderLevel' || filter === 'unitsSold' || filter === 'weight') {
            return (
                <TextField
                    type="number"
                    label={filter.replace(/([A-Z])/g, ' $1').trim()}
                    name={filter}
                    value={filters[filter]}
                    onChange={handleFilterChange}
                    fullWidth
                    margin="normal"
                />
            );
        }

        return (
            <TextField
                label={`Enter ${filter}`}
                name={filter}
                value={filters[filter]}
                onChange={handleFilterChange}
                fullWidth
                margin="normal"
            />
        );
    };

    return (
        <div className="filter-modal">
            <Button onClick={handleOpen} variant="contained" startIcon={<FilterIcon />}>
                Filters
            </Button>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="filter-modal-title"
                aria-describedby="filter-modal-description"
            >
                <Box sx={style}>
                    <Typography id="filter-modal-title" variant="h6" component="h2">
                        Apply Filters
                    </Typography>

                    <Box sx={contentStyle}>
                        {Object.keys(filters).map((filter, index) => (
                            <div key={index} className="filter-option">
                                {renderFilterInput(filter)}
                            </div>
                        ))}
                    </Box>

                    <Button onClick={handleApplyFilters} variant="contained" color="primary" fullWidth sx={buttonStyle}>
                        Apply Filters
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

export default FilterModal;

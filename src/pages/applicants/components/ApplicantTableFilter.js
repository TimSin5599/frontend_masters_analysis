import React from "react";
import { Box, Typography, Button, Divider } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';

export const ApplicantFilterFooter = (currentFilterList, applyFilters) => {
    return (
        <Box sx={{ p: 2, pt: 0 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => {
                        if (applyFilters) applyFilters();
                    }}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        px: 3
                    }}
                >
                    Применить
                </Button>
            </Box>
        </Box>
    );
};

export const ApplicantFilterHeader = () => (
    <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Фильтры
        </Typography>
    </Box>
);

export default ApplicantFilterFooter;

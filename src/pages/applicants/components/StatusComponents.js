import { Box, Typography, Chip, Paper } from "@mui/material";
import { TableFilterList } from "mui-datatables";

export const statusMap = {
    "uploaded": { label: "Создан", color: "default" },
    "processing": { label: "Анализ", color: "primary" },
    "verifying": { label: "Проверка", color: "warning" },
    "assessed": { label: "Оценивание", color: "secondary" },
    "completed": { label: "Оценено", color: "success" }
};

export const statusStyle = {
    "uploaded":   { color: '#616161', borderColor: '#bdbdbd', bgColor: 'transparent' },
    "processing": { color: '#1061b1', borderColor: '#1976d2', bgColor: 'rgba(25,118,210,0.04)' },
    "verifying":  { color: '#c05600', borderColor: '#ed6c02', bgColor: 'rgba(237,108,2,0.04)' },
    "assessed":   { color: '#6d1b8e', borderColor: '#9c27b0', bgColor: 'rgba(156,39,176,0.04)' },
    "completed":  { color: '#2b722f', borderColor: '#4caf50', bgColor: 'rgba(76,175,80,0.04)' },
};

export const StatusChip = ({ status, onDelete }) => {
    const s = statusStyle[status] || statusStyle['uploaded'];
    const label = statusMap[status]?.label || status;

    return (
        <Chip
            label={label}
            size="small"
            variant="outlined"
            onDelete={onDelete}
            sx={{
                color: `${s.color} !important`,
                borderColor: `${s.borderColor} !important`,
                backgroundColor: `${s.bgColor} !important`,
                height: 24,
                fontWeight: 500,
                fontSize: '0.75rem',
                borderWidth: '1px !important',
                '& .MuiChip-label': {
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 120
                },
                '& .MuiChip-deleteIcon': {
                    color: `${s.color} !important`,
                    '&:hover': { color: `${s.color} !important`, opacity: 0.7 }
                }
            }}
        />
    );
};

export const CustomFilterList = (props) => {
    return (
        <TableFilterList 
            {...props} 
            ItemComponent={({ label, onDelete }) => {
                const statusKey = Object.keys(statusMap).find(k => statusMap[k].label === label);
                return <StatusChip status={statusKey || label} onDelete={onDelete} />;
            }} 
        />
    );
};

export const StatusLegend = () => (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="subtitle2" sx={{ mr: 1, fontWeight: 'bold', color: '#666' }}>
                Легенда статусов:
            </Typography>
            {Object.keys(statusMap).map((key) => (
                <StatusChip key={key} status={key} />
            ))}
        </Box>
    </Paper>
);

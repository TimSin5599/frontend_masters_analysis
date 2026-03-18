import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    CircularProgress 
} from '@mui/material';
import axios from 'axios';
import config from '../../config';
import { useManagementState, actions, useManagementDispatch } from '../../context/ManagementContext';
import { showSnackbar } from '../../components/Snackbar';

const ExpertSlotsManager = () => {
    const { rows: allUsers, loading: usersLoading } = useManagementState();
    const dispatch = useManagementDispatch();
    const [expertSlots, setExpertSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [expertUsers, setExpertUsers] = useState([]);
    const [loadingExperts, setLoadingExperts] = useState(true);

    useEffect(() => {
        fetchSlots();
        fetchExperts();
    }, []);

    const fetchExperts = () => {
        setLoadingExperts(true);
        axios.get(`${config.manageApi}/v1/experts`)
            .then(res => {
                setExpertUsers(res.data || []);
                setLoadingExperts(false);
            })
            .catch(err => {
                console.error("Error fetching experts:", err);
                setLoadingExperts(false);
            });
    };

    const fetchSlots = () => {
        setLoadingSlots(true);
        axios.get(`${config.manageApi}/v1/experts/slots`)
            .then(res => {
                setExpertSlots(res.data);
                setLoadingSlots(false);
            })
            .catch(err => {
                console.error("Error fetching expert slots:", err);
                setLoadingSlots(false);
            });
    };

    const handleSlotChange = (slotNumber, userId) => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
            alert("Только администратор или менеджер может менять слоты экспертов");
            return;
        }

        axios.post(`${config.manageApi}/v1/experts/slots`, {
            user_id: userId ? String(userId) : "",
            slot_number: slotNumber,
            user_role: currentUser.role
        }).then(() => {
            showSnackbar({ type: 'success', message: 'Эксперт успешно назначен' });
            fetchSlots();
        }).catch(err => {
            console.error(err);
            showSnackbar({ type: 'error', message: 'Ошибка при назначении эксперта' });
        });
    };

    if (usersLoading || loadingSlots) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>Управление глобальными экспертами</Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24 }}>
                Выберите ровно 3 экспертов из государственного списка для назначения на роли Эксперт 1, 2 и 3. 
                Система ищет пользователей с ролями «expert» или «observer».
                Эти настройки будут использоваться для оценки документов всеми абитуриентами.
                Больше 3 экспертов назначить нельзя.
            </Typography>

            <Grid container spacing={3}>
                {[1, 2, 3].map(i => {
                    const currentSlot = (expertSlots || []).find(s => s.slot_number === i);
                    return (
                        <Grid item xs={12} md={4} key={i}>
                            <Paper variant="outlined" style={{ padding: 20 }}>
                                <Typography variant="h6" gutterBottom>Эксперт {i}</Typography>
                                <FormControl fullWidth variant="outlined" size="small">
                                    <InputLabel id={`expert-select-label-${i}`}>Выберите эксперта</InputLabel>
                                    <Select
                                        labelId={`expert-select-label-${i}`}
                                        value={currentSlot?.user_id ? String(currentSlot.user_id) : ""}
                                        onChange={(e) => handleSlotChange(i, e.target.value)}
                                        label="Выберите эксперта"
                                    >
                                        <MenuItem value="">
                                            <em>Не назначен</em>
                                        </MenuItem>
                                        {expertUsers.map(user => (
                                            <MenuItem key={user.id} value={String(user.id)}>
                                                {user.first_name} {user.last_name} ({user.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {currentSlot && (
                                    <Box mt={2}>
                                        <Typography variant="caption" color="primary" style={{ fontWeight: 'bold' }}>
                                            Текущий: {currentSlot.first_name || currentSlot.last_name ? `${currentSlot.first_name} ${currentSlot.last_name}` : 'Загрузка...'}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

export default ExpertSlotsManager;

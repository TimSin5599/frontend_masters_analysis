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
import { useManagementState } from '../../context/ManagementContext';
import { actions } from '../../context/ManagementContext';
import { useManagementDispatch } from '../../context/ManagementContext';

const ExpertSlotsManager = () => {
    const { rows: allUsers, loading: usersLoading } = useManagementState();
    const dispatch = useManagementDispatch();
    const [expertSlots, setExpertSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [expertUsers, setExpertUsers] = useState([]);

    useEffect(() => {
        // Filter users who have the role 'expert' or 'observer' (which is now labeled as Expert)
        const experts = allUsers.filter(u => {
            const role = String(u.role || "").toLowerCase();
            return role === 'expert' || role === 'observer';
        });
        setExpertUsers(experts);
    }, [allUsers]);

    useEffect(() => {
        if (allUsers.length === 0 && !usersLoading) {
            // Fetch with large limit to get potentially all experts
            actions.doFetch({ limit: 1000 })(dispatch);
        }
        fetchSlots();
    }, []);

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
        if (!currentUser || currentUser.role !== 'admin') {
            alert("Только администратор может менять слоты экспертов");
            return;
        }

        axios.post(`${config.manageApi}/v1/experts/slots`, {
            user_id: parseInt(userId),
            slot_number: slotNumber,
            user_role: currentUser.role
        }).then(() => {
            fetchSlots();
        }).catch(err => {
            console.error(err);
            alert("Ошибка при назначении эксперта");
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
                Выберите экспертов из государственного списка для назначения на роли Эксперт 1, 2 и 3. 
                Система ищет пользователей с ролями «expert» или «observer».
                Эти настройки будут использоваться для оценки документов всеми абитуриентами.
            </Typography>

            <Grid container spacing={3}>
                {[1, 2, 3].map(i => {
                    const currentSlot = expertSlots.find(s => s.slot_number === i);
                    return (
                        <Grid item xs={12} md={4} key={i}>
                            <Paper variant="outlined" style={{ padding: 20 }}>
                                <Typography variant="h6" gutterBottom>Эксперт {i}</Typography>
                                <FormControl fullWidth variant="outlined" size="small">
                                    <InputLabel id={`expert-select-label-${i}`}>Выберите эксперта</InputLabel>
                                    <Select
                                        labelId={`expert-select-label-${i}`}
                                        value={currentSlot?.user_id || ""}
                                        onChange={(e) => handleSlotChange(i, e.target.value)}
                                        label="Выберите эксперта"
                                    >
                                        <MenuItem value="">
                                            <em>Не назначен</em>
                                        </MenuItem>
                                        {expertUsers.map(user => (
                                            <MenuItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {currentSlot && (
                                    <Box mt={2}>
                                        <Typography variant="caption" color="primary" style={{ fontWeight: 'bold' }}>
                                            Текущий: {currentSlot.user_name}
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

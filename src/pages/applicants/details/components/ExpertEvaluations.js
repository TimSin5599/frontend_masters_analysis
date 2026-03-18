import React from 'react';
import { Box, Button, Grid, Paper, TextField, Typography, useTheme } from "@mui/material";
import axios from 'axios';
import config from '../../../../config';

export function ExpertScoreSection({ applicantId, category, currentUser, expertSlots, evaluations, onSaved }) {
    const theme = useTheme();
    
    const mySlot = expertSlots.find(s => s.user_id === currentUser?.id);
    const isAdmin = currentUser?.role === 'admin';
    const isExpert = currentUser?.role === 'expert' || currentUser?.role === 'observer';
    
    if (!isAdmin && !isExpert) return null;

    function saveEval(targetExpertId, score, comment) {
        axios.post(`${config.manageApi}/v1/applicants/${applicantId}/evaluations`, {
            expert_id: targetExpertId,
            category: category,
            score: score,
            comment: comment,
            user_id: currentUser.id,
            user_name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            user_role: currentUser.role
        }).then(() => {
            onSaved();
        }).catch(err => {
            console.error(err);
            alert("Ошибка при сохранении оценки");
        });
    }
    
    return (
        <Box mt={4} p={2} bgcolor="#f8f9fa" borderRadius={1} border={1} borderColor="divider">
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">Экспертная оценка категории</Typography>
            
            {!mySlot && (
                <Typography variant="body2" color="textSecondary" mb={2}>
                    {isAdmin 
                        ? 'Эксперты еще не назначены. Перейдите во вкладку "Оценки экспертов", чтобы закрепить за системой экспертов.' 
                        : 'Вы еще не назначены на роль эксперта для этого абитуриента. Попросите администратора добавить ваш ID в один из слотов экспертов.'}
                </Typography>
            )}

            <Grid container spacing={2} alignItems="flex-end">
                {expertSlots.map(slot => {
                    const isMySlot = mySlot && mySlot.slot_number === slot.slot_number;
                    const canEdit = isMySlot || isAdmin;
                    const evalData = evaluations.find(e => e.category === category && e.expert_id === slot.user_id);
                    
                    return (
                        <Grid item xs={12} key={slot.slot_number}>
                            <Paper variant="outlined" style={{ padding: 12, borderLeft: `4px solid ${isMySlot ? theme.palette.primary.main : '#ccc'}` }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Эксперт {slot.slot_number}: {slot.first_name} {slot.last_name}
                                </Typography>
                                
                                <Grid container spacing={1} mt={0.5}>
                                    <Grid item xs={2}>
                                        <TextField 
                                            label="Оценка" 
                                            type="number" 
                                            size="small" 
                                            fullWidth
                                            disabled={!canEdit}
                                            defaultValue={evalData?.score || 0}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val !== (evalData?.score || 0)) {
                                                    saveEval(slot.user_id, val, evalData?.comment || "");
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={10}>
                                        <TextField 
                                            label="Комментарий эксперта" 
                                            size="small" 
                                            fullWidth
                                            disabled={!canEdit}
                                            defaultValue={evalData?.comment || ""}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== (evalData?.comment || "")) {
                                                    saveEval(slot.user_id, evalData?.score || 0, val);
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                {evalData?.is_admin_override && (
                                    <Typography variant="caption" color="error" style={{ fontStyle: 'italic', marginTop: 4, display: 'block' }}>
                                        Переопределено: {evalData.source_info}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}

export function ExpertEvaluationsTab({ evaluations, expertSlots, categories, currentUser }) {
    return (
        <Box p={3} flexGrow={1} overflow="auto">
            <Typography variant="h5" gutterBottom>Сводная таблица оценок</Typography>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Категория</th>
                        {[1, 2, 3].map(i => {
                            const slot = (expertSlots || []).find(s => s.slot_number === i);
                            return (
                                <th key={i} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                    Эксперт {i} {slot ? `(${slot.first_name} ${slot.last_name})` : '(не назначен)'}
                                </th>
                            );
                        })}
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Итого</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        let rowTotal = 0;
                        let rowCount = 0;
                        return (
                            <tr key={cat.id}>
                                <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>{cat.label}</td>
                                {[1, 2, 3].map(i => {
                                    const slot = (expertSlots || []).find(s => s.slot_number === i);
                                    const evalData = (evaluations || []).find(e => e.category === cat.id && e.expert_id === slot?.user_id);
                                    if (evalData) {
                                        rowTotal += evalData.score;
                                        rowCount++;
                                    }
                                    return (
                                        <td key={i} style={{ border: '1px solid #ddd', padding: '12px' }}>
                                            {evalData ? (
                                                <Box>
                                                    <Typography variant="body1" fontWeight="bold" align="center">{evalData.score}</Typography>
                                                    {evalData.comment && (
                                                        <Typography variant="caption" color="textSecondary" style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 150 }}>
                                                            "{evalData.comment}"
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="textSecondary" align="center">-</Typography>
                                            )}
                                        </td>
                                    );
                                })}
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                                    <Typography variant="h6" color="primary">{rowCount > 0 ? (rowTotal / rowCount).toFixed(1) : '-'}</Typography>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                        <td style={{ border: '1px solid #ddd', padding: '12px' }}>Среднее по эксперту</td>
                        {[1, 2, 3].map(i => {
                            const slot = (expertSlots || []).find(s => s.slot_number === i);
                            let colTotal = 0;
                            let colCount = 0;
                            
                            if (slot) {
                                categories.forEach(cat => {
                                    const evalData = (evaluations || []).find(e => e.category === cat.id && e.expert_id === slot.user_id);
                                    if (evalData) {
                                        colTotal += evalData.score;
                                        colCount++;
                                    }
                                });
                            }
                            
                            return (
                                <td key={i} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                    <Typography variant="h6" color="secondary">
                                        {colCount > 0 ? (colTotal / colCount).toFixed(1) : '-'}
                                    </Typography>
                                </td>
                            );
                        })}
                        <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#eee' }}>
                            {(() => {
                                let grandTotal = 0;
                                let grandCount = 0;
                                (evaluations || []).forEach(e => {
                                    const isAssigned = (expertSlots || []).some(slot => slot.user_id === e.expert_id);
                                    const isValidCategory = categories.some(cat => cat.id === e.category);
                                    if (isAssigned && isValidCategory) {
                                        grandTotal += e.score;
                                        grandCount++;
                                    }
                                });
                                return (
                                    <Typography variant="h5" color="primary" style={{ fontWeight: 'bold' }}>
                                        {grandCount > 0 ? (grandTotal / grandCount).toFixed(1) : '-'}
                                    </Typography>
                                );
                            })()}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </Box>
    );
}

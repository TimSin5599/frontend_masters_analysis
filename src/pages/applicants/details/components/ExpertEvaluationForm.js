import React, { useState, useEffect } from 'react';
import {
    Box, Button, Chip, Grid, Paper, TextField, Typography,
    useTheme, Divider, Alert, CircularProgress
} from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import axios from 'axios';
import config from '../../../../config';

export default function ExpertEvaluationForm({ applicantId, currentUser, evaluations, criteria, onSaved }) {
    const theme = useTheme();
    const [localScores, setLocalScores] = useState({});
    const [localComments, setLocalComments] = useState({});
    const [aiPrefilled, setAiPrefilled] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Initial load: prefer expert's own scores, fall back to AI drafts
    useEffect(() => {
        if (!evaluations || evaluations.length === 0) return;
        const scores = {};
        const comments = {};
        const aiCodes = new Set();

        // 1. AI drafts as defaults
        evaluations.forEach(e => {
            if (e.is_ai_generated || e.expert_id === 'AI_SYSTEM') {
                scores[e.category] = e.score;
                comments[e.category] = e.comment;
                aiCodes.add(e.category);
            }
        });

        // 2. Expert's own scores override AI defaults
        evaluations.forEach(e => {
            if (String(e.expert_id) === String(currentUser?.id || currentUser?._id)) {
                scores[e.category] = e.score;
                comments[e.category] = e.comment;
                aiCodes.delete(e.category);
            }
        });

        setLocalScores(scores);
        setLocalComments(comments);
        setAiPrefilled(aiCodes);
    }, [evaluations, currentUser]);

    const isCompleted = (evaluations || []).some(e => 
        String(e.expert_id) === String(currentUser?.id || currentUser?._id) && 
        e.status === 'COMPLETED'
    );

    const handleScoreChange = (category, score, maxScore) => {
        if (score === "") {
            setLocalScores(prev => ({ ...prev, [category]: "" }));
            setAiPrefilled(prev => { const s = new Set(prev); s.delete(category); return s; });
            return;
        }
        const val = parseInt(score);
        if (isNaN(val)) return;
        if (val > maxScore) {
            alert(`Максимальный балл для этой категории: ${maxScore}`);
            return;
        }
        setLocalScores(prev => ({ ...prev, [category]: val }));
        setAiPrefilled(prev => { const s = new Set(prev); s.delete(category); return s; });
    };

    const handleCommentChange = (category, comment) => {
        setLocalComments(prev => ({ ...prev, [category]: comment }));
        setAiPrefilled(prev => { const s = new Set(prev); s.delete(category); return s; });
    };

    const handleSave = (complete = false) => {
        if (complete && !window.confirm("Вы уверены, что хотите завершить оценку? После этого редактирование будет заблокировано.")) {
            return;
        }

        setIsSaving(true);

        const scoresPayload = (criteria || []).map(c => ({
            category: c.code,
            score: (localScores[c.code] === "" || localScores[c.code] === undefined) ? 0 : localScores[c.code],
            comment: localComments[c.code] || ""
        }));

        axios.put(`${config.manageApi}/v1/applicants/${applicantId}/evaluations`, {
            user_id: String(currentUser.id || currentUser._id),
            user_name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            user_role: currentUser.role,
            expert_id: String(currentUser.id || currentUser._id),
            scores: scoresPayload,
            complete: complete
        }).then(() => {
            alert(complete ? "Оценка успешно завершена" : "Черновик сохранен");
            setIsSaving(false);
            onSaved();
        }).catch(err => {
            console.error(err);
            const errMsg = err.response?.data?.error || "Ошибка при сохранении";
            alert(`Ошибка: ${errMsg}`);
            setIsSaving(false);
        });
    };

    if (!criteria || criteria.length === 0) {
        return <Typography color="textSecondary">Критерии не загружены</Typography>;
    }

    return (
        <Box p={3} flexGrow={1} overflow="auto">
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Лист оценки абитуриента
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
                Пожалуйста, выставьте баллы и комментарии по каждому критерию согласно правилам. 
                {isCompleted && (
                    <Box component="span" color="error.main" fontWeight="bold" ml={1}>
                        (Оценка завершена и заблокирована)
                    </Box>
                )}
            </Typography>

            {isCompleted && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Вы завершили оценку этого абитуриента. Редактирование данных более недоступно.
                </Alert>
            )}

            <Grid container spacing={3}>
                {(() => {
                    const order = [
                        'EDU_BASE', 
                        'EDU_ADD', 'IEEE_INT', 
                        'ACHIEVEMENTS', 'ADD_ACHIEV_COMBINED', 
                        'VIDEO', 
                        'MOTIVATION', 
                        'RECOMMENDATION', 
                        'ENGLISH'
                    ];
                    return (criteria || [])
                        .sort((a, b) => {
                            const idxA = order.indexOf(a.code);
                            const idxB = order.indexOf(b.code);
                            return (idxA > -1 ? idxA : 100) - (idxB > -1 ? idxB : 100);
                        })
                        .map(cat => (
                            <Grid item xs={12} key={cat.code}>
                                <Paper variant="outlined" style={{ padding: 16 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {cat.title}
                                        </Typography>
                                        <Typography variant="caption" color="primary">
                                            Максимум: {cat.max_score}
                                        </Typography>
                                    </Box>
                                    
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={2}>
                                            <TextField
                                                label="Балл"
                                                type="number"
                                                size="small"
                                                fullWidth
                                                disabled={isCompleted || isSaving}
                                                value={localScores[cat.code] ?? ""}
                                                onChange={(e) => handleScoreChange(cat.code, e.target.value, cat.max_score)}
                                                inputProps={{ min: 0, max: cat.max_score }}
                                            />
                                            {aiPrefilled.has(cat.code) && (
                                                <Chip
                                                    label="AI"
                                                    icon={<SmartToyIcon />}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                    sx={{ mt: 1, height: 10, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                                                />
                                            )}
                                        </Grid>
                                        <Grid item xs={10}>
                                            <TextField
                                                label="Комментарий (необязательно)"
                                                size="small"
                                                fullWidth
                                                disabled={isCompleted || isSaving}
                                                value={localComments[cat.code] || ""}
                                                onChange={(e) => handleCommentChange(cat.code, e.target.value)}
                                                placeholder="Обоснуйте ваш выбор балла, если это необходимо..."
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ));
                })()}
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Box display="flex" justifyContent="flex-end" gap={2} mb={4}>
                {!isCompleted && (
                    <>
                        <Button 
                            variant="outlined" 
                            size="large"
                            disabled={isSaving}
                            onClick={() => handleSave(false)}
                        >
                            {isSaving ? <CircularProgress size={24} /> : "Сохранить черновик"}
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success"
                            size="large"
                            disabled={isSaving}
                            onClick={() => handleSave(true)}
                        >
                            {isSaving ? <CircularProgress size={24} /> : "Завершить оценку"}
                        </Button>
                    </>
                )}
                {isCompleted && (
                    <Button variant="outlined" disabled>
                        Оценка отправлена
                    </Button>
                )}
            </Box>
        </Box>
    );
}

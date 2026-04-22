import React from 'react';
import { Box, Button, Chip, Grid, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import axios from 'axios';
import config from '../../../../config';
import ExpertEvaluationForm from './ExpertEvaluationForm';


export function ExpertEvaluationsTab({
    applicantId, evaluations, expertSlots, categories, currentUser,
    allExperts, onRefreshSlots, onRefreshEvaluations, mode = 'summary',
    scoringScheme, onChangeScheme
}) {
    const role = String(currentUser?.role || "").toLowerCase();
    const isAdmin = role === 'admin';

    const mySlot = (expertSlots || []).find(s => String(s.user_id) === String(currentUser?.id || currentUser?._id || ""));
    const isExpertInSlots = !!mySlot;

    const schemeLabels = { default: 'Стандартная', ieee: 'IEEE (международные соревнования)' };

    // handleAssign moved or unused in this view

    return (
        <Box p={3} flexGrow={1} overflow="auto">
            {/* 1. Expert Evaluation Form Mode */}
            {mode === 'form' && isExpertInSlots && (
                <Box mb={2}>
                    <ExpertEvaluationForm 
                        applicantId={applicantId}
                        currentUser={currentUser}
                        evaluations={evaluations}
                        criteria={categories}
                        onSaved={onRefreshEvaluations}
                    />
                </Box>
            )}

            {/* 2. Summary Table Mode (with Admin Slot Assignment) */}
            {mode === 'summary' && (
                <>
                    <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
                        <Typography variant="h5">Сводная таблица оценок</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="textSecondary">Схема оценивания:</Typography>
                            <Chip
                                label={schemeLabels[scoringScheme] || scoringScheme || 'Стандартная'}
                                color={scoringScheme === 'ieee' ? 'warning' : 'primary'}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        {isAdmin && onChangeScheme && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Select
                                    size="small"
                                    value={scoringScheme || 'default'}
                                    onChange={(e) => onChangeScheme(e.target.value)}
                                    sx={{ minWidth: 240, fontSize: '0.875rem' }}
                                >
                                    <MenuItem value="default">Стандартная</MenuItem>
                                    <MenuItem value="ieee">IEEE (международные соревнования)</MenuItem>
                                    <MenuItem value="auto">Авто-определение</MenuItem>
                                </Select>
                                <Typography variant="caption" color="textSecondary">
                                    Смена схемы обновляет критерии
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Категория</th>
                                {[1, 2, 3].map(i => {
                                    const slot = (expertSlots || []).find(s => s.slot_number === i);
                                    const expertEvals = (evaluations || []).filter(e => e.expert_id === slot?.user_id);
                                    const isCompleted = expertEvals.some(e => e.status === 'COMPLETED');
                                    const hasDrafts = expertEvals.length > 0;

                                    let statusLabel = "Не начато";
                                    let statusColor = "#f44336"; // Red
                                    if (isCompleted) {
                                        statusLabel = "Оценивание завершено";
                                        statusColor = "#4caf50"; // Green
                                    } else if (hasDrafts) {
                                        statusLabel = "В процессе оценивания";
                                        statusColor = "#ff9800"; // Yellow
                                    }

                                    return (
                                        <th key={i} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                Эксперт {i}
                                            </Typography>
                                            <Typography variant="caption" display="block" color="textSecondary">
                                                {slot ? `${slot.firstName || slot.first_name || ''} ${slot.lastName || slot.last_name || ''}` : '(не назначен)'}
                                            </Typography>
                                            {slot && (
                                                <Box 
                                                    mt={1} px={1} py={0.5} borderRadius={1} 
                                                    style={{ backgroundColor: statusColor, color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}
                                                >
                                                    {statusLabel}
                                                </Box>
                                            )}
                                        </th>
                                    );
                                })}
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Итого</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(categories || []).length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Нет доступных критериев для этого абитуриента</td>
                                </tr>
                            )}
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
                                
                                const sortedCats = (categories || []).sort((a, b) => {
                                    const idxA = order.indexOf(a.code);
                                    const idxB = order.indexOf(b.code);
                                    return (idxA > -1 ? idxA : 100) - (idxB > -1 ? idxB : 100);
                                });

                                // Initialize totals for the footer row
                                const expertTotals = { 1: 0, 2: 0, 3: 0 };
                                const expertCounts = { 1: 0, 2: 0, 3: 0 };
                                let combinedTotal = 0;
                                let combinedCount = 0;

                                const rows = sortedCats.map(cat => {
                                    let rowTotal = 0;
                                    let rowCount = 0;
                                    
                                    const cells = [1, 2, 3].map(i => {
                                        const slot = (expertSlots || []).find(s => s.slot_number === i);
                                        const evalData = (evaluations || []).find(e => e.category === cat.code && e.expert_id === slot?.user_id);
                                        
                                        if (evalData && evalData.score !== -1) {
                                            rowTotal += evalData.score;
                                            rowCount++;
                                            expertTotals[i] += evalData.score;
                                            expertCounts[i]++;
                                        }

                                        const isDraft = evalData && evalData.status === 'DRAFT';
                                        const cellBg = isDraft && isAdmin ? 'rgba(255,152,0,0.07)' : 'transparent';

                                        return (
                                            <td key={i} style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: cellBg }}>
                                                {evalData ? (
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold" align="center"
                                                            color={isDraft && isAdmin ? 'warning.main' : 'inherit'}>
                                                            {evalData.score === -1 ? "?" : evalData.score}
                                                        </Typography>
                                                        {isDraft && isAdmin && (
                                                            <Typography variant="caption" display="block" align="center"
                                                                sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                                                Черновик
                                                            </Typography>
                                                        )}
                                                        {evalData.comment && evalData.score !== -1 && (
                                                            <Typography variant="caption" color="textSecondary" style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                                {evalData.comment}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary" align="center">-</Typography>
                                                )}
                                            </td>
                                        );
                                    });

                                    const rowAvg = rowCount > 0 ? (rowTotal / rowCount) : 0;
                                    if (rowCount > 0) {
                                        combinedTotal += rowAvg;
                                        combinedCount++;
                                    }

                                    return (
                                        <tr key={cat.code}>
                                            <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>{cat.title}</td>
                                            {cells}
                                            <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                                                <Typography variant="h6" color="primary">{rowCount > 0 ? rowAvg.toFixed(1) : '-'}</Typography>
                                            </td>
                                        </tr>
                                    );
                                });

                                // Add the Total row
                                rows.push(
                                    <tr key="total_row" style={{ backgroundColor: '#f0f4f8' }}>
                                        <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', textTransform: 'uppercase',textAlign: 'center' }}>Итого</td>
                                        {[1, 2, 3].map(i => (
                                            <td key={`total_${i}`} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {expertCounts[i] > 0 ? expertTotals[i] : '-'}
                                                </Typography>
                                            </td>
                                        ))}
                                        <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                                            <Typography variant="h5" color="primary" fontWeight="bold">
                                                {combinedCount > 0 ? combinedTotal.toFixed(1) : '-'}
                                            </Typography>
                                        </td>
                                    </tr>
                                );

                                return rows;
                            })()}
                        </tbody>
                    </table>
                </>
            )}
        </Box>
    );
}

export function ExpertScoreSection({ 
    applicantId, category, evaluations, expertSlots, 
    currentUser, onRefreshEvaluations, criteria 
}) {
    const [localScores, setLocalScores] = React.useState({});
    const [localComments, setLocalComments] = React.useState({});
    const [isSaving, setIsSaving] = React.useState(false);
    const [aiSourcedCategories, setAiSourcedCategories] = React.useState(new Set());
    const [modifiedFromAI, setModifiedFromAI] = React.useState(new Set());

    const mySlot = (expertSlots || []).find(s => String(s.user_id) === String(currentUser?.id || currentUser?._id || ""));
    const isExpert = !!mySlot;
    
    const role = String(currentUser?.role || "").toLowerCase();
    const isAdmin = role === 'admin' || role === 'админ' || role === 'manager';

    // Filter relevant criteria for this category tab
    const relevantCriteria = (criteria || []).filter(c => {
        if (category === 'diploma' || category === 'transcript') return c.code === 'EDU_BASE';
        if (['additional_edu', 'prof_development', 'certification', 'second_diploma'].includes(category)) {
            return c.code === 'EDU_ADD' || c.code === 'IEEE_INT';
        }
        if (category === 'achievement') return c.code === 'ACHIEVEMENTS' || c.code === 'ADD_ACHIEV_COMBINED';
        if (category === 'video_presentation') return c.code === 'VIDEO';
        if (category === 'motivation') return c.code === 'MOTIVATION';
        if (category === 'recommendation') return c.code === 'RECOMMENDATION';
        if (category === 'language' || category === 'english') return c.code === 'ENGLISH';
        return false;
    });

    const isCompleted = (evaluations || []).some(e => 
        String(e.expert_id) === String(currentUser?.id || currentUser?._id) && 
        e.status === 'COMPLETED'
    );

    React.useEffect(() => {
        const scores = {};
        const comments = {};
        const aiCodes = new Set();

        // 1. AI draft scores as defaults
        (evaluations || []).forEach(e => {
            if (e.source_info === "AI Portfolio Scorer") {
                scores[e.category] = e.score;
                comments[e.category] = e.comment;
                aiCodes.add(e.category);
            }
        });

        // 2. Expert's own scores override AI defaults
        (evaluations || []).forEach(e => {
            if (String(e.expert_id) === String(currentUser?.id || currentUser?._id)) {
                scores[e.category] = e.score;
                comments[e.category] = e.comment;
            }
        });

        setLocalScores(scores);
        setLocalComments(comments);
        setAiSourcedCategories(aiCodes);
        setModifiedFromAI(new Set()); // reset on evaluations reload
    }, [evaluations, currentUser]);

    if ((!isExpert && !isAdmin) || relevantCriteria.length === 0) return null;

    const handleSave = (catCode) => {
        setIsSaving(true);
        
        // We save the entire set of evaluations just like the big form for consistency
        const scoresPayload = (criteria || []).map(c => {
            // For the specific category we are saving, use local state
            // For others, use what's already in evaluations or 0
            if (c.code === catCode) {
                return {
                    category: c.code,
                    score: (localScores[c.code] === "" || localScores[c.code] === undefined) ? 0 : localScores[c.code],
                    comment: localComments[c.code] || ""
                };
            }
            
            const existing = (evaluations || []).find(e => 
                e.category === c.code && 
                String(e.expert_id) === String(currentUser?.id || currentUser?._id)
            );
            
            return {
                category: c.code,
                score: localScores[c.code] !== undefined ? localScores[c.code] : (existing?.score || 0),
                comment: localComments[c.code] !== undefined ? localComments[c.code] : (existing?.comment || "")
            };
        });

        axios.put(`${config.manageApi}/v1/applicants/${applicantId}/evaluations`, {
            user_id: String(currentUser.id || currentUser._id),
            user_name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            user_role: currentUser.role,
            expert_id: String(currentUser.id || currentUser._id),
            scores: scoresPayload,
            complete: false // Saving from individual section is always a draft
        }).then(() => {
            alert("Оценка сохранена");
            setIsSaving(false);
            onRefreshEvaluations();
        }).catch(err => {
            console.error(err);
            alert("Ошибка при сохранении");
            setIsSaving(false);
        });
    };

    return (
        <Box mt={3} p={2} border={1} borderColor="primary.main" borderRadius={2} bgcolor="#fffaff">
            <Typography variant="h6" color="primary" gutterBottom>Оценки экспертов</Typography>
            
            {relevantCriteria.map(cat => (
                <Box key={cat.code} mb={3}>
                    {/* Admin/View-Only Results from all experts */}
                    {isAdmin && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">Результаты по критерию: {cat.title}</Typography>
                            <Grid container spacing={2}>
                                {[1, 2, 3].map(num => {
                                    const slot = (expertSlots || []).find(s => s.slot_number === num);
                                    const expertEval = (evaluations || []).find(e => 
                                        e.category === cat.code && 
                                        slot?.user_id && e.expert_id === slot.user_id
                                    );
                                    
                                    return (
                                        <Grid item xs={4} key={num}>
                                            <Paper sx={{ p: 1.5, height: '100%', borderLeft: 4, borderLeftColor: expertEval ? (expertEval.status === 'COMPLETED' ? '#4caf50' : '#ff9800') : '#e0e0e0' }}>
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                    Эксперт {num}: {slot?.first_name ? `${slot.first_name} ${slot.last_name || ""}` : "Не назначен"}
                                                </Typography>
                                                {expertEval ? (
                                                    <>
                                                        <Typography variant="h6" display="inline">
                                                            {expertEval.score === -1 ? "?" : expertEval.score}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ ml: 1 }}>из {cat.max_score}</Typography>
                                                        {expertEval.comment && (
                                                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#555' }}>
                                                                {expertEval.comment}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: expertEval.status === 'COMPLETED' ? 'success.main' : 'warning.main' }}>
                                                            {expertEval.status === 'COMPLETED' ? "Завершено" : "Черновик"}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Нет оценки</Typography>
                                                )}
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    )}

                    {/* Expert's own editing section */}
                    {isExpert && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="subtitle2" fontWeight="bold">Ваша оценка: {cat.title}</Typography>
                                <Box>
                                    <Typography variant="caption" sx={{ mr: 2 }}>Макс: {cat.max_score}</Typography>
                                    {isCompleted && (
                                        <Typography variant="caption" color="error" fontWeight="bold">
                                            Редактирование заблокировано (Оценка завершена)
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={2}>
                                    <Box>
                                        <TextField
                                            label="Балл"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            disabled={isCompleted || isSaving}
                                            value={localScores[cat.code] ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "") {
                                                    setLocalScores(prev => ({ ...prev, [cat.code]: "" }));
                                                    setModifiedFromAI(prev => new Set([...prev, cat.code]));
                                                    return;
                                                }
                                                const num = parseInt(val);
                                                if (!isNaN(num) && num <= cat.max_score) {
                                                    setLocalScores(prev => ({ ...prev, [cat.code]: num }));
                                                    setModifiedFromAI(prev => new Set([...prev, cat.code]));
                                                }
                                            }}
                                            inputProps={{ min: 0, max: cat.max_score }}
                                        />
                                        {aiSourcedCategories.has(cat.code) && !modifiedFromAI.has(cat.code) && (
                                            <Chip
                                                label="AI"
                                                icon={<SmartToyIcon />}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                                sx={{ mt: 0.5, height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }}
                                            />
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={8}>
                                    <TextField 
                                        label="Комментарий"
                                        size="small"
                                        fullWidth
                                        disabled={isCompleted || isSaving}
                                        value={localComments[cat.code] || ""}
                                        onChange={(e) => {
                                            setLocalComments(prev => ({ ...prev, [cat.code]: e.target.value }));
                                            setModifiedFromAI(prev => new Set([...prev, cat.code]));
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        fullWidth
                                        size="small"
                                        disabled={isCompleted || isSaving}
                                        onClick={() => handleSave(cat.code)}
                                    >
                                        Ок
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </Box>
            ))}
        </Box>
    );
}

import React from 'react';
import { Box, Button, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

const RecommendationSection = ({
    data,
    setData,
    isEditing,
    activeSubTab,
    setActiveDocumentId,
    handleDeleteDocument,
    handleSave,
    currentUser,
    applicantStatus
}) => {
    if (!Array.isArray(data)) return null;

    const currentEntry = (data.length > 0 && activeSubTab !== 'add') ? data[activeSubTab] : null;
    const isAI = currentEntry?.source === 'model';
    const canConfirm = isAI && (currentUser?.role === 'admin' || currentUser?.role === 'operator') && applicantStatus === 'verifying';

    return (
        <Box mt={1}>
            {isAI && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ 
                    backgroundColor: '#fff9c4', 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid #ffe082',
                }}>
                    <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                        ✨ Данные рекомендации извлечены ИИ. Пожалуйста, проверьте и подтвердите.
                    </Typography>
                    {canConfirm && (
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            startIcon={<DoneIcon />}
                            onClick={handleSave}
                        >
                            Подтвердить
                        </Button>
                    )}
                </Box>
            )}
            {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" color="primary">Рекомендация #{activeSubTab + 1}</Typography>
                        <div>
                            {data[activeSubTab].document_id && (
                                <>
                                    <Button size="small" variant="outlined" onClick={() => setActiveDocumentId(data[activeSubTab].document_id)} style={{ marginRight: 8 }}>
                                        Оригинал
                                    </Button>
                                    <IconButton size="small" color="error" onClick={() => handleDeleteDocument(data[activeSubTab].document_id)} title="Удалить документ">
                                        <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                </>
                            )}
                        </div>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField disabled={!isEditing} label="Автор (Имя)" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].author_name || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].author_name = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField disabled={!isEditing} label="Должность" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].author_position || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].author_position = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField disabled={!isEditing} label="Организация" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].author_institution || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].author_institution = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField disabled={!isEditing} label="Ключевые качества" fullWidth variant="outlined" size="small" multiline rows={2}
                                value={data[activeSubTab].key_strengths || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].key_strengths = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default RecommendationSection;

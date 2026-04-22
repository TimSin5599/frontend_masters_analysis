import React from 'react';
import { Box, Button, Grid, IconButton, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

const LanguageSection = ({
    data,
    setData,
    isEditing,
    setActiveDocumentId,
    handleDeleteDocument,
    handleSave,
    currentUser,
    applicantStatus
}) => {
    if (data === null || data === undefined) return null;

    const isAI = data.source === 'model';
    const canConfirm = isAI && (currentUser?.role === 'admin' || currentUser?.role === 'operator') && applicantStatus === 'verifying';

    return (
        <Box mt={4} sx={{ 
            backgroundColor: isAI ? '#fff9c4' : 'transparent', 
            p: isAI ? 2 : 0, 
            borderRadius: 2,
            border: isAI ? '1px solid #ffe082' : 'none',
            transition: 'all 0.3s ease'
        }}>
            {isAI && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                        ✨ Данные сертификата извлечены ИИ. Пожалуйста, проверьте и подтвердите.
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
            <Box display="flex" justifyContent="flex-end" mb={1}>
                {data.document_id && (
                    <>
                        <Button size="small" variant="outlined" onClick={() => setActiveDocumentId(data.document_id)} style={{ marginRight: 8 }}>
                            Оригинал
                        </Button>
                        <IconButton size="small" color="error" onClick={() => handleDeleteDocument(data.document_id)} title="Удалить документ">
                            <DeleteIcon fontSize="inherit" />
                        </IconButton>
                    </>
                )}
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Название экзамена" fullWidth variant="outlined" size="small"
                        value={data.exam_name || ""} onChange={e => setData({ ...data, exam_name: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Баллы" fullWidth variant="outlined" size="small"
                        value={data.score || ""} onChange={e => setData({ ...data, score: e.target.value })} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default LanguageSection;

import React from 'react';
import { Box, Button, Grid, IconButton, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

const MotivationSection = ({
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
    const canConfirm = isAI && (Array.isArray(currentUser?.roles) ? currentUser.roles.includes('expert') : currentUser?.role === 'expert') && applicantStatus === 'verifying';

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
                        ✨ Ключевые слова извлечены ИИ. Пожалуйста, проверьте и подтвердите.
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
                <Grid item xs={12}>
                    <TextField disabled={!isEditing} label="Ключевые элементы" fullWidth variant="outlined" size="small" multiline rows={15}
                        value={data.main_text || ""} onChange={e => setData({ ...data, main_text: e.target.value })} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default MotivationSection;

import React from 'react';
import { Box, Button, Grid, IconButton, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const LanguageSection = ({
    data,
    setData,
    isEditing,
    setActiveDocumentId,
    handleDeleteDocument
}) => {
    if (!data) return null;

    return (
        <Box mt={4}>
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

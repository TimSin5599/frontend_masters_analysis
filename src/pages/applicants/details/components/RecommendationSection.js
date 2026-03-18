import React from 'react';
import { Box, Button, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const RecommendationSection = ({
    data,
    setData,
    isEditing,
    activeSubTab,
    setActiveDocumentId,
    handleDeleteDocument
}) => {
    if (!Array.isArray(data)) return null;

    return (
        <Box mt={1}>
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

import React from 'react';
import { Box, Button, Grid, IconButton, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const MotivationSection = ({
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
                <Grid item xs={12}>
                    <TextField disabled={!isEditing} label="Ключевые элементы" fullWidth variant="outlined" size="small" multiline rows={15}
                        value={data.main_text || ""} onChange={e => setData({ ...data, main_text: e.target.value })} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default MotivationSection;

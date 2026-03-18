import { Box, Button, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDateForDisplay } from '../../../../utils/dateUtils';

const AchievementsSection = ({
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
                        <Typography variant="subtitle2" color="primary">Достижение #{activeSubTab + 1}</Typography>
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
                            <TextField disabled={!isEditing} label="Тип достижения" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].achievement_type ? data[activeSubTab].achievement_type.charAt(0).toUpperCase() + data[activeSubTab].achievement_type.slice(1) : ""}
                                onChange={e => {
                                    const val = e.target.value;
                                    const capitalized = val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : val;
                                    const newData = [...data];
                                    newData[activeSubTab].achievement_type = capitalized;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField disabled={!isEditing} label="Наименование достижения" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].achievement_title || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].achievement_title = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField disabled={!isEditing} label="Организация" fullWidth variant="outlined" size="small"
                                value={data[activeSubTab].company || ""}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].company = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField disabled={!isEditing} label="Дата вручения" fullWidth variant="outlined" size="small"
                                value={formatDateForDisplay(data[activeSubTab].date_received)}
                                onChange={e => {
                                    const newData = [...data];
                                    newData[activeSubTab].date_received = e.target.value;
                                    setData(newData);
                                }} />
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default AchievementsSection;

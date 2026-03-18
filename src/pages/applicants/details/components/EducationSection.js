import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import { formatDateForDisplay } from '../../../../utils/dateUtils';

const EducationSection = ({
    data,
    setData,
    isEditing,
    documents,
    activeDocumentId,
    setActiveDocumentId,
    handleDeleteDocument
}) => {
    if (!data) return null;
    const safeDocs = documents || [];

    const diplomaDoc = safeDocs.find(d => d.file_type === 'diploma');
    const transcriptDoc = safeDocs.find(d => d.file_type === 'transcript');

    return (
        <Box mt={1}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField disabled={!isEditing} label="Учебное заведение" fullWidth variant="outlined" size="small"
                        value={data.institution_name || ""} onChange={e => setData({ ...data, institution_name: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Степень" fullWidth variant="outlined" size="small"
                        value={data.degree_title || ""} onChange={e => setData({ ...data, degree_title: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Специальность" fullWidth variant="outlined" size="small"
                        value={data.major || ""} onChange={e => setData({ ...data, major: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Номер диплома" fullWidth variant="outlined" size="small"
                        value={data.diploma_serial_number || ""} onChange={e => setData({ ...data, diploma_serial_number: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Дата выдачи/окончания" fullWidth variant="outlined" size="small"
                        value={formatDateForDisplay(data.graduation_date)} 
                        onChange={e => setData({ ...data, graduation_date: e.target.value })} />
                </Grid>

                <Grid item xs={12}>
                    <Divider style={{ margin: '16px 0' }} />
                    <Typography variant="subtitle1" gutterBottom>Аналитика успеваемости (Выписка)</Typography>
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="CGPA" fullWidth variant="outlined" size="small"
                        value={data.cumulative_gpa || ""} onChange={e => setData({ ...data, cumulative_gpa: e.target.value })}
                        type="number" inputProps={{ step: "0.01" }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Итоговая оценка (A, A+, B...)" fullWidth variant="outlined" size="small"
                        value={data.cumulative_grade || ""} onChange={e => setData({ ...data, cumulative_grade: e.target.value })} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Максимум кредитов" fullWidth variant="outlined" size="small"
                        value={data.total_credits || ""} onChange={e => setData({ ...data, total_credits: e.target.value })}
                        type="number" inputProps={{ step: "0.1" }} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Полученные кредиты" fullWidth variant="outlined" size="small"
                        value={data.obtained_credits || ""} onChange={e => setData({ ...data, obtained_credits: e.target.value })}
                        type="number" inputProps={{ step: "0.1" }} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Всего семестров" fullWidth variant="outlined" size="small"
                        value={data.total_semesters || ""} onChange={e => setData({ ...data, total_semesters: e.target.value })}
                        type="number" />
                </Grid>
            </Grid>
        </Box>
    );
};

export default EducationSection;

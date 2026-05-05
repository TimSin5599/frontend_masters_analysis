import { Box, Button, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import { formatDateForDisplay } from '../../../../utils/dateUtils';

const AdditionalEducationSection = ({
    activeCategory,
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
    if (data === null || data === undefined) return null;

    const currentEntry = (Array.isArray(data) && data.length > 0 && activeSubTab !== 'add') ? data[activeSubTab] : null;
    const isAI = currentEntry?.source === 'model';
    const canConfirm = isAI && (Array.isArray(currentUser?.roles) ? currentUser.roles.includes('expert') : currentUser?.role === 'expert') && applicantStatus === 'verifying';

    const renderAIHeader = () => {
        if (!isAI) return null;
        return (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{
                backgroundColor: '#fff9c4',
                p: 2,
                borderRadius: 2,
                border: '1px solid #ffe082',
            }}>
                <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                    ✨ Данные извлечены ИИ. Пожалуйста, проверьте и подтвердите.
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
        );
    };

    // --- PROFESSIONAL DEVELOPMENT (Work Experience entries) ---
    if (activeCategory === "prof_development") {
        if (!Array.isArray(data)) return null;
        return (
            <Box mt={1}>
                {renderAIHeader()}
                {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                    <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" color="primary">
                                Развитие #{activeSubTab + 1} 
                                {data[activeSubTab].record_type && (
                                    <span style={{ marginLeft: 8, opacity: 0.7, fontSize: '0.85em', padding: '2px 8px', backgroundColor: '#e3f2fd', borderRadius: 4 }}>
                                        {data[activeSubTab].record_type === 'work' ? 'Работа' : 
                                         data[activeSubTab].record_type === 'internship' ? 'Стажировка' : 
                                         data[activeSubTab].record_type === 'training' ? 'Повышение квалификации' : data[activeSubTab].record_type}
                                    </span>
                                )}
                            </Typography>
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
                                <TextField disabled={!isEditing} label="Организация" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].company_name || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].company_name = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField disabled={!isEditing} label="Должность" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].position || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].position = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Город" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].city || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].city = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Страна" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].country || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].country = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Дата начала" fullWidth variant="outlined" size="small"
                                    value={formatDateForDisplay(data[activeSubTab].start_date)}
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].start_date = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Дата окончания" fullWidth variant="outlined" size="small"
                                    value={formatDateForDisplay(data[activeSubTab].end_date)}
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].end_date = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField disabled={!isEditing} label="Компетенции / Ключевые навыки" fullWidth multiline rows={2} variant="outlined" size="small"
                                    value={data[activeSubTab].competencies || ""}
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].competencies = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Box>
        );
    }

    // --- ADDITIONAL DIPLOMA ---
    if (activeCategory === "second_diploma") {
        if (!Array.isArray(data)) return null;
        return (
            <Box mt={1}>
                {renderAIHeader()}
                {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                    <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" color="primary">Дополнительный диплом #{activeSubTab + 1}</Typography>
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
                                <TextField disabled={!isEditing} label="Учебное заведение" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].institution_name || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].institution_name = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Степень/Специальность" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].degree_title || ""} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].degree_title = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField disabled={!isEditing} label="Дата окончания" fullWidth variant="outlined" size="small"
                                    value={formatDateForDisplay(data[activeSubTab].graduation_date)} 
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].graduation_date = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Box>
        );
    }

    // --- CERTIFICATION ---
    if (activeCategory === "certification") {
        if (!Array.isArray(data)) return null;
        return (
            <Box mt={1}>
                {renderAIHeader()}
                {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                    <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" color="primary">Сертификат #{activeSubTab + 1}</Typography>
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
                                <TextField disabled={!isEditing} label="Наименование" fullWidth variant="outlined" size="small"
                                    value={data[activeSubTab].achievement_title || ""}
                                    onChange={e => {
                                        const newData = [...data];
                                        newData[activeSubTab].achievement_title = e.target.value;
                                        setData(newData);
                                    }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField disabled={!isEditing} label="Дата вручения" fullWidth variant="outlined" size="small"
                                    placeholder="ДД.ММ.ГГГГ"
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
    }

    return null;
};

export default AdditionalEducationSection;

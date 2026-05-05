import { Box, Grid, TextField, Typography, Button } from "@mui/material";
import { formatDateForDisplay } from '../../../../utils/dateUtils';
import DoneIcon from '@mui/icons-material/Done';

const PersonalDataSection = ({
    data,
    setData,
    isEditing,
    documents,
    personalDataDocType,
    setPersonalDataDocType,
    setActiveDocumentId,
    handleDeleteDocument,
    handleSave,
    currentUser,
    applicantStatus
}) => {
    if (data === null || data === undefined) return null;
    const safeDocs = documents || [];

    const isAI = data.source === 'model';
    const canConfirm = isAI && (Array.isArray(currentUser?.roles) ? currentUser.roles.includes('expert') : currentUser?.role === 'expert') && applicantStatus === 'verifying';

    const passportDoc = safeDocs.find(d => d.file_type === 'passport');
    const resumeDoc = safeDocs.find(d => d.file_type === 'resume');

    return (
        <Box mt={1} sx={{
            backgroundColor: isAI ? '#fff9c4' : 'transparent',
            p: isAI ? 2 : 0,
            borderRadius: 2,
            border: isAI ? '1px solid #ffe082' : 'none',
            transition: 'all 0.3s ease'
        }}>
            {isAI && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                            Подтвердить всё
                        </Button>
                    )}
                </Box>
            )}
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Имя" fullWidth variant="outlined" size="small"
                        value={data.name || ""} onChange={e => setData({ ...data, name: e.target.value })} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Фамилия" fullWidth variant="outlined" size="small"
                        value={data.surname || ""} onChange={e => setData({ ...data, surname: e.target.value })} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Отчество" fullWidth variant="outlined" size="small"
                        value={data.patronymic || ""} onChange={e => setData({ ...data, patronymic: e.target.value })} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Гражданство" fullWidth variant="outlined" size="small"
                        value={data.nationality || ""} onChange={e => setData({ ...data, nationality: e.target.value })} />
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Пол" fullWidth variant="outlined" size="small"
                        value={data.gender || ""} onChange={e => setData({ ...data, gender: e.target.value })} 
                        placeholder="М / Ж"/>
                </Grid>
                <Grid item xs={4}>
                    <TextField disabled={!isEditing} label="Номер документа" fullWidth variant="outlined" size="small"
                        value={data.document_number || ""} onChange={e => setData({ ...data, document_number: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Дата рождения" fullWidth variant="outlined" size="small"
                        value={formatDateForDisplay(data.date_of_birth)}
                        onChange={e => setData({ ...data, date_of_birth: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    <TextField disabled={!isEditing} label="Email" fullWidth variant="outlined" size="small"
                        value={data.email || ""} onChange={e => setData({ ...data, email: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                    {(() => {
                        const phoneStr = data.phone || "";
                        const phones = phoneStr.split(',').map(p => p.trim());
                        
                        return (
                            <Box>
                                {phones.map((p, index) => (
                                    <TextField 
                                        key={index}
                                        disabled={!isEditing} 
                                        label={phones.length > 1 ? `Телефон ${index + 1}` : "Телефон"} 
                                        fullWidth 
                                        variant="outlined" 
                                        size="small"
                                        value={p} 
                                        sx={{ mb: (index < phones.length - 1 || isEditing) ? 1 : 0 }}
                                        onChange={e => {
                                            const newPhones = [...phones];
                                            newPhones[index] = e.target.value;
                                            setData({ ...data, phone: newPhones.join(', ') });
                                        }} 
                                    />
                                ))}
                                {isEditing && (
                                    <Typography 
                                        variant="caption" 
                                        color="primary" 
                                        sx={{ cursor: 'pointer', mt: -0.5, display: 'block', fontWeight: 500 }}
                                        onClick={() => setData({ ...data, phone: phoneStr + (phoneStr ? ", " : "") })}
                                    >
                                        + Добавить номер
                                    </Typography>
                                )}
                            </Box>
                        );
                    })()}
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                        Основная информация из резюме (опыт, достижения) автоматически распределяется по соответствующим разделам.
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PersonalDataSection;

import { 
    Box, 
    Button, 
    CircularProgress, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle, 
    Grid, 
    MenuItem, 
    TextField, 
    Typography, 
    Paper, 
    Divider, 
    IconButton, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Tooltip,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    Person as PersonIcon,
    HistoryEdu as HistoryEduIcon,
    School as SchoolIcon,
    FolderShared as FolderSharedIcon,
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageTitle from '../../components/PageTitle/PageTitle';
import Widget from '../../components/Widget/Widget';
import config from '../../config';

const DOCUMENT_CATEGORIES = [
    { 
        group: 'Персональные данные', 
        icon: <PersonIcon color="primary" />,
        items: [
            { key: 'passport', label: 'Паспорт', required: true },
            { key: 'resume', label: 'Резюме' },
        ]
    },
    { 
        group: 'Базовое образование', 
        icon: <SchoolIcon color="primary" />,
        items: [
            { key: 'diploma', label: 'Диплом', required: true },
            { key: 'transcript', label: 'Приложение к диплому' },
        ]
    },
    { 
        group: 'Дополнительное образование', 
        icon: <HistoryEduIcon color="primary" />,
        items: [
            { key: 'prof_development', label: 'Проф. развитие' },
            { key: 'second_diploma', label: 'Второй диплом' },
            { key: 'certification', label: 'Сертификация' },
        ]
    },
    { 
        group: 'Прочее', 
        icon: <FolderSharedIcon color="primary" />,
        items: [
            { key: 'achievement', label: 'Достижения' },
            { key: 'recommendation', label: 'Рекомендации' },
            { key: 'motivation', label: 'Мотивация' },
            { key: 'language', label: 'Сертификат АЯ' },
        ]
    },
];

const MULTIPLE_DOC_CATEGORIES = ['prof_development', 'second_diploma', 'certification', 'achievement', 'recommendation'];

const PROF_DEV_TYPES = [
    { key: 'work', label: 'Работа' },
    { key: 'internship', label: 'Стажировка' },
    { key: 'training', label: 'Повышение квалификации' },
];

export default function AddApplicant() {
    const history = useHistory();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedProgramId = queryParams.get('program_id');

    const [programs, setPrograms] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [totalUploads, setTotalUploads] = useState(0);
    const [files, setFiles] = useState({});

    // Meta for files (e.g. record_type for prof_development)
    // Keyed by category, then index for multiple categories
    const [fileMeta, setFileMeta] = useState({});

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        program_id: preselectedProgramId || ''
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

    const handleFileChange = (categoryKey, selectedFile) => {
        if (!selectedFile) return;

        if (categoryKey === 'prof_development') {
            setPendingFile(selectedFile);
            setTypeDialogOpen(true);
            return;
        }

        addFile(categoryKey, selectedFile);
    };

    const addFile = (categoryKey, file, meta = null) => {
        setFiles(prev => {
            if (MULTIPLE_DOC_CATEGORIES.includes(categoryKey)) {
                const existing = prev[categoryKey] || [];
                return { ...prev, [categoryKey]: [...existing, file] };
            } else {
                return { ...prev, [categoryKey]: file };
            }
        });

        if (meta) {
            setFileMeta(prev => {
                const categoryMeta = prev[categoryKey] || [];
                return { ...prev, [categoryKey]: [...categoryMeta, meta] };
            });
        }
    };

    const handleRemoveFile = (categoryKey, indexToRemove = null) => {
        setFiles(prev => {
            if (MULTIPLE_DOC_CATEGORIES.includes(categoryKey)) {
                const existing = prev[categoryKey] || [];
                const newArr = existing.filter((_, idx) => idx !== indexToRemove);
                return { ...prev, [categoryKey]: newArr.length > 0 ? newArr : null };
            } else {
                return { ...prev, [categoryKey]: null };
            }
        });

        if (indexToRemove !== null) {
            setFileMeta(prev => {
                const existing = prev[categoryKey] || [];
                const newArr = existing.filter((_, idx) => idx !== indexToRemove);
                return { ...prev, [categoryKey]: newArr.length > 0 ? newArr : null };
            });
        }
    };

    useEffect(() => {
        axios.get(`${config.manageApi}/v1/programs`)
            .then(res => {
                setPrograms(res.data);
                if (!preselectedProgramId && res.data && res.data.length > 0) {
                    setForm(prev => ({ ...prev, program_id: res.data[0].id }));
                }
            })
            .catch(err => console.error(err));
    }, [preselectedProgramId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const missingCritical = ['passport', 'diploma'].some(key => !files[key]);
        if (missingCritical) {
            setOpenDialog(true);
            return;
        }
        await processSubmit();
    };

    const handleConfirmSubmit = async () => {
        setOpenDialog(false);
        await processSubmit();
    };

    const processSubmit = async () => {
        try {
            setIsUploading(true);
            const payload = {
                ...form,
                program_id: Number(form.program_id)
            };
            const response = await axios.post(`${config.manageApi}/v1/applicants`, payload);
            const applicantId = response.data.id;

            const uploadQueue = [];
            Object.entries(files).forEach(([category, fileOrArr]) => {
                if (!fileOrArr) return;
                if (Array.isArray(fileOrArr)) {
                    fileOrArr.forEach((f, idx) => {
                        const meta = fileMeta[category] ? fileMeta[category][idx] : null;
                        uploadQueue.push({ category, file: f, meta });
                    });
                } else {
                    uploadQueue.push({ category, file: fileOrArr });
                }
            });

            setTotalUploads(uploadQueue.length);

            for (let i = 0; i < uploadQueue.length; i++) {
                const { category, file, meta } = uploadQueue[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);
                if (meta && meta.record_type) {
                    formData.append('doc_type', meta.record_type);
                }

                await axios.post(`${config.manageApi}/v1/applicants/${applicantId}/documents`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadProgress(i + 1);
            }

            setIsUploading(false);
            history.push(`/app/programs/${form.program_id}/applicants`);
        } catch (err) {
            console.error(err);
            alert("Ошибка при создании абитуриента или загрузке документов");
            setIsUploading(false);
        }
    };

    return (
        <Box p={2}>
            <PageTitle title="Добавить нового абитуриента" />
            
            <Grid container spacing={3}>
                {/* Form Section */}
                <Grid item xs={12} lg={5}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <PersonIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight={600}>Основная информация</Typography>
                        </Box>
                        
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Фамилия"
                                        variant="outlined"
                                        value={form.last_name}
                                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                                        required
                                        sx={{ bgcolor: 'white' }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Имя"
                                        variant="outlined"
                                        value={form.first_name}
                                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                                        required
                                        sx={{ bgcolor: 'white' }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Отчество"
                                        variant="outlined"
                                        value={form.patronymic}
                                        onChange={e => setForm({ ...form, patronymic: e.target.value })}
                                        sx={{ bgcolor: 'white' }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Программа обучения"
                                        value={form.program_id}
                                        onChange={e => setForm({ ...form, program_id: e.target.value })}
                                        required
                                        sx={{ bgcolor: 'white' }}
                                    >
                                        {programs.map(p => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.title} ({p.year})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                
                                <Grid item xs={12} mt={2}>
                                    <Divider sx={{ mb: 3 }} />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        fullWidth
                                        size="large"
                                        disabled={isUploading}
                                        sx={{ 
                                            py: 1.5, 
                                            borderRadius: 2,
                                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {isUploading ? (
                                            <Box display="flex" alignItems="center">
                                                <CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />
                                                <span>Создание...</span>
                                            </Box>
                                        ) : "Создать абитуриента и загрузить"}
                                    </Button>
                                    
                                    {isUploading && totalUploads > 0 && (
                                        <Box mt={3}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Загрузка файлов...
                                                </Typography>
                                                <Typography variant="caption" fontWeight={600}>
                                                    {uploadProgress} / {totalUploads}
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={(uploadProgress / totalUploads) * 100} 
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>

                {/* Documents Section */}
                <Grid item xs={12} lg={7}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight={600}>Пакет документов</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" mb={3}>
                            Загрузите файлы в формате PDF или изображения. Система автоматически распознает данные.
                        </Typography>

                        <Grid container spacing={3}>
                            {DOCUMENT_CATEGORIES.map((group, gIdx) => (
                                <Grid item xs={12} key={gIdx}>
                                    <Box mb={2}>
                                        <Box display="flex" alignItems="center" mb={1.5}>
                                            {group.icon}
                                            <Typography variant="subtitle1" fontWeight={600} ml={1}>
                                                {group.group}
                                            </Typography>
                                        </Box>
                                        
                                        <Grid container spacing={2}>
                                            {group.items.map((cat) => {
                                                const hasFiles = files[cat.key];
                                                return (
                                                    <Grid item xs={12} sm={hasFiles && !MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? 12 : 6} key={cat.key}>
                                                        <Paper 
                                                            variant="outlined" 
                                                            sx={{ 
                                                                p: 2, 
                                                                borderRadius: 2, 
                                                                transition: '0.2s',
                                                                '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(33, 150, 243, 0.02)' }
                                                            }}
                                                        >
                                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                <Box display="flex" alignItems="center">
                                                                    {hasFiles ? (
                                                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1 }} />
                                                                    ) : (
                                                                        <RadioButtonUncheckedIcon color="disabled" sx={{ fontSize: 20, mr: 1 }} />
                                                                    )}
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {cat.label} {cat.required && <Box component="span" color="error.main">*</Box>}
                                                                    </Typography>
                                                                </Box>
                                                                
                                                                <Button
                                                                    component="label"
                                                                    size="small"
                                                                    variant={hasFiles && !MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? "text" : "outlined"}
                                                                    disabled={isUploading}
                                                                    startIcon={MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? <AddIcon /> : null}
                                                                >
                                                                    {MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? "Добавить" : (hasFiles ? "Изменить" : "Выбрать")}
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        accept="application/pdf,image/*"
                                                                        onChange={(e) => {
                                                                            if (e.target.files && e.target.files[0]) {
                                                                                handleFileChange(cat.key, e.target.files[0]);
                                                                                e.target.value = null;
                                                                            }
                                                                        }}
                                                                    />
                                                                </Button>
                                                            </Box>

                                                            {/* File List for this category */}
                                                            {hasFiles && (
                                                                <Box mt={hasFiles && MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? 1 : 0.5}>
                                                                    {Array.isArray(hasFiles) ? (
                                                                        <List dense disablePadding>
                                                                            {hasFiles.map((f, idx) => (
                                                                                <ListItem 
                                                                                    key={idx} 
                                                                                    divider={idx !== hasFiles.length - 1}
                                                                                    secondaryAction={
                                                                                        <IconButton edge="end" size="small" onClick={() => handleRemoveFile(cat.key, idx)} disabled={isUploading}>
                                                                                            <DeleteIcon fontSize="small" color="error" />
                                                                                        </IconButton>
                                                                                    }
                                                                                    sx={{ px: 1, py: 0.5 }}
                                                                                >
                                                                                    <ListItemText 
                                                                                        primary={f.name} 
                                                                                        primaryTypographyProps={{ variant: 'caption', noWrap: true, sx: { maxWidth: '180px' } }}
                                                                                        secondary={cat.key === 'prof_development' && fileMeta[cat.key]?.[idx] ? 
                                                                                            PROF_DEV_TYPES.find(t => t.key === fileMeta[cat.key][idx].record_type)?.label : null
                                                                                        }
                                                                                    />
                                                                                </ListItem>
                                                                            ))}
                                                                        </List>
                                                                    ) : (
                                                                        <Box display="flex" alignItems="center" justifyContent="space-between" bgcolor="grey.50" p={1} borderRadius={1}>
                                                                            <Tooltip title={hasFiles.name}>
                                                                                <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: '80%' }}>
                                                                                    {hasFiles.name}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                            <IconButton size="small" onClick={() => handleRemoveFile(cat.key)} disabled={isUploading}>
                                                                                <DeleteIcon fontSize="small" color="error" />
                                                                            </IconButton>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Warning Dialog for missing documents */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon color="warning" sx={{ mr: 1 }} /> Внимание
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Вы не прикрепили критически важные документы (Паспорт или Диплом).
                        Вы уверены, что хотите продолжить создание абитуриента?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ textTransform: 'none' }}>
                        Вернуться к заполнению
                    </Button>
                    <Button onClick={handleConfirmSubmit} color="primary" variant="contained" sx={{ textTransform: 'none' }}>
                        Все равно продолжить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* record_type selection dialog for prof_development */}
            <Dialog open={typeDialogOpen} onClose={() => setTypeDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle>Тип записи</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Укажите тип документа для раздела «Проф. развитие»:
                    </DialogContentText>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                        {PROF_DEV_TYPES.map((type) => (
                            <Button 
                                key={type.key} 
                                variant="outlined" 
                                size="large"
                                fullWidth
                                onClick={() => {
                                    addFile('prof_development', pendingFile, { record_type: type.key });
                                    setTypeDialogOpen(false);
                                    setPendingFile(null);
                                }}
                                sx={{ textTransform: 'none', justifyContent: 'flex-start', py: 1.5 }}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setTypeDialogOpen(false); setPendingFile(null); }} color="inherit">
                        Отмена
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

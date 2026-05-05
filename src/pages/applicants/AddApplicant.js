import { 
    Box, 
    Button, 
    CircularProgress, 
    Grid, 
    MenuItem, 
    TextField, 
    Typography, 
    Paper, 
    Divider, 
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton
} from '@mui/material';
import {
    Person as PersonIcon,
    CreateNewFolder as FolderIcon,
    InsertDriveFile as FileIcon,
    Delete as DeleteIcon,
    VideoCameraFront as VideoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageTitle from '../../components/PageTitle/PageTitle';
import config from '../../config';
import { useUserState } from '../../context/UserContext';

export default function AddApplicant() {
    const history = useHistory();
    const location = useLocation();
    const { currentUser } = useUserState();
    const queryParams = new URLSearchParams(location.search);
    const preselectedProgramId = queryParams.get('program_id');

    const [programs, setPrograms] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [totalUploads, setTotalUploads] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        program_id: preselectedProgramId || '',
        video_url: ''
    });

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

    const handleFolderUpload = (e) => {
        const inputFiles = Array.from(e.target.files);
        if (inputFiles.length === 0) return;

        // Filter valid extensions
        const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const filesToUpload = inputFiles.filter(f => 
            validExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
        );

        if (filesToUpload.length === 0) {
            alert("В выбранной папке не найдено поддерживаемых файлов (.pdf, .jpg, .png)");
            return;
        }

        setSelectedFiles(prev => [...prev, ...filesToUpload]);
    };

    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            alert("Пожалуйста, выберите папку с документами для загрузки.");
            return;
        }

        try {
            setIsUploading(true);
            const payload = {
                ...form,
                program_id: Number(form.program_id)
            };
            
            // 1. Create applicant
            const response = await axios.post(`${config.manageApi}/v1/applicants`, payload);
            const applicantId = response.data.id;

            // 2. Save video URL if provided
            if (form.video_url) {
                const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : (currentUser?.role ? [currentUser.role] : []);
                const roleLabel = roles.map(r => ({ admin: 'админ', manager: 'менеджер', expert: 'эксперт' }[r] || r)).join(', ') || 'менеджер';
                await axios.patch(`${config.manageApi}/v1/applicants/${applicantId}/data?category=video_presentation`, {
                    video_url: form.video_url,
                    role: roleLabel,
                    first_name: currentUser?.first_name || currentUser?.firstName || '',
                    last_name: currentUser?.last_name || currentUser?.lastName || '',
                    patronymic: currentUser?.patronymic || ''
                });
            }

            // 3. Upload all files into "unknown" category for background classification
            setTotalUploads(selectedFiles.length);
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', 'unknown');

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
            <PageTitle title="Регистрация абитуриента и загрузка документов" />
            
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Form Section */}
                    <Grid item xs={12} lg={5}>
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, height: '100%' }}>
                            <Box display="flex" alignItems="center" mb={3}>
                                <PersonIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                                <Typography variant="h5" fontWeight={600}>Основная информация</Typography>
                            </Box>
                            
                            <Grid container spacing={3}>
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

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <VideoIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight={600}>Медиа</Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        label="Ссылка на видео-презентацию"
                                        placeholder="Например: https://youtube.com/..."
                                        variant="outlined"
                                        value={form.video_url}
                                        onChange={e => setForm({ ...form, video_url: e.target.value })}
                                        sx={{ bgcolor: 'white' }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Documents Upload Section */}
                    <Grid item xs={12} lg={7}>
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" mb={2}>
                                <FolderIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                                <Typography variant="h5" fontWeight={600}>Загрузка документов</Typography>
                            </Box>
                            
                            <Typography variant="body1" color="textSecondary" mb={4}>
                                Выберите папку, содержащую сканы документов абитуриента. 
                                Система автоматически сохранит файлы и в фоновом режиме распределит их по категориям.
                            </Typography>

                            <Box 
                                mb={4} 
                                p={4} 
                                sx={{ 
                                    border: '2px dashed', 
                                    borderColor: 'primary.main', 
                                    borderRadius: 3, 
                                    bgcolor: 'rgba(33, 150, 243, 0.05)', 
                                    textAlign: 'center',
                                    transition: '0.3s',
                                    '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    component="label"
                                    size="large"
                                    startIcon={<FolderIcon />}
                                    disabled={isUploading}
                                    sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem', fontWeight: 600 }}
                                >
                                    Выбрать папку с документами
                                    <input
                                        type="file"
                                        hidden
                                        webkitdirectory="true"
                                        directory="true"
                                        multiple
                                        onChange={handleFolderUpload}
                                    />
                                </Button>
                            </Box>

                            {selectedFiles.length > 0 && (
                                <Box flex={1} overflow="auto">
                                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                                        Выбрано файлов: {selectedFiles.length}
                                    </Typography>
                                    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                                        <List dense disablePadding>
                                            {selectedFiles.map((file, idx) => (
                                                <ListItem 
                                                    key={idx}
                                                    divider={idx !== selectedFiles.length - 1}
                                                    secondaryAction={
                                                        <IconButton edge="end" onClick={() => handleRemoveFile(idx)} disabled={isUploading}>
                                                            <DeleteIcon color="error" fontSize="small" />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <FileIcon color="action" fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary={file.name} 
                                                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} 
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                </Box>
                            )}

                            <Box mt="auto" pt={4}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    type="submit"
                                    fullWidth
                                    size="large"
                                    disabled={isUploading || selectedFiles.length === 0}
                                    sx={{ 
                                        py: 2, 
                                        borderRadius: 2,
                                        boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)',
                                        fontSize: '1.1rem',
                                        fontWeight: 700
                                    }}
                                >
                                    {isUploading ? (
                                        <Box display="flex" alignItems="center">
                                            <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
                                            <span>
                                                Загрузка... ({uploadProgress} / {totalUploads})
                                            </span>
                                        </Box>
                                    ) : "Создать абитуриента и начать обработку"}
                                </Button>
                                {isUploading && totalUploads > 0 && (
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={(uploadProgress / totalUploads) * 100} 
                                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                                    />
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
}

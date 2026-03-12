import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, MenuItem, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageTitle from '../../components/PageTitle/PageTitle';
import Widget from '../../components/Widget/Widget';
import config from '../../config';

const DOCUMENT_CATEGORIES = [
    { key: 'passport', label: 'Паспорт' },
    { key: 'diploma', label: 'Диплом (Основное)' },
    { key: 'transcript', label: 'Диплом (Выписка)' },
    { key: 'language', label: 'Сертификат АЯ' },
    { key: 'work', label: 'Опыт работы' },
    { key: 'recommendation', label: 'Рекомендации' },
    { key: 'achievement', label: 'Достижения' },
    { key: 'motivation', label: 'Мотивация' },
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

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        program_id: preselectedProgramId || ''
    });

    const [openDialog, setOpenDialog] = useState(false);

    const MULTIPLE_DOC_CATEGORIES = ['work', 'recommendation', 'achievement'];

    const handleFileChange = (categoryKey, selectedFile) => {
        if (!selectedFile) return;
        setFiles(prev => {
            if (MULTIPLE_DOC_CATEGORIES.includes(categoryKey)) {
                const existing = prev[categoryKey] || [];
                return { ...prev, [categoryKey]: [...existing, selectedFile] };
            } else {
                return { ...prev, [categoryKey]: selectedFile };
            }
        });
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

        // Define which categories are considered "required" to trigger the warning
        // Assuming all defined categories should have at least something if it's "all documents"
        const missingCategories = DOCUMENT_CATEGORIES.some(cat => {
            const fileData = files[cat.key];
            if (!fileData) return true;
            if (Array.isArray(fileData) && fileData.length === 0) return true;
            return false;
        });

        if (missingCategories) {
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

            // Gather files to upload
            const uploadQueue = [];

            Object.entries(files).forEach(([category, fileOrArr]) => {
                if (!fileOrArr) return;
                if (Array.isArray(fileOrArr)) {
                    fileOrArr.forEach(f => uploadQueue.push({ category, file: f }));
                } else {
                    uploadQueue.push({ category, file: fileOrArr });
                }
            });

            setTotalUploads(uploadQueue.length);

            for (let i = 0; i < uploadQueue.length; i++) {
                const { category, file } = uploadQueue[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);

                await axios.post(`${config.manageApi}/v1/applicants/${applicantId}/documents`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
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
        <>
            <PageTitle title="Добавить нового абитуриента" />
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Widget title="Информация об абитуриенте">
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Имя"
                                        value={form.first_name}
                                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Фамилия"
                                        value={form.last_name}
                                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Отчество"
                                        value={form.patronymic}
                                        onChange={e => setForm({ ...form, patronymic: e.target.value })}
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
                                    >
                                        {programs.map(p => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.title} ({p.year})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        fullWidth
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <CircularProgress size={24} color="inherit" /> : "Создать абитуриента и загрузить документы"}
                                    </Button>
                                    {isUploading && totalUploads > 0 && (
                                        <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: 8 }}>
                                            Загрузка документов: {uploadProgress} из {totalUploads}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </form>
                    </Widget>
                </Grid>

                {/* Upload Documents Section */}
                <Grid item xs={12} md={6}>
                    <Widget title="Пакет документов">
                        <Grid container spacing={2}>
                            {DOCUMENT_CATEGORIES.map((cat) => (
                                <Grid item xs={12} key={cat.key}>
                                    <Box display="flex" flexDirection="column" p={1} border={1} borderColor="grey.300" borderRadius={1}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Typography variant="body2" style={{ width: '40%' }}>
                                                {cat.label}
                                            </Typography>
                                            <Box display="flex" alignItems="center" flex={1} justifyContent="flex-end" overflow="hidden">
                                                {!MULTIPLE_DOC_CATEGORIES.includes(cat.key) && (
                                                    <Typography variant="caption" color="textSecondary" noWrap style={{ marginRight: 16, maxWidth: '150px' }}>
                                                        {files[cat.key] ? files[cat.key].name : "Файл не выбран"}
                                                    </Typography>
                                                )}
                                                <Button
                                                    variant={files[cat.key] && !MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? "outlined" : "contained"}
                                                    color={files[cat.key] && !MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? "success" : "secondary"}
                                                    component="label"
                                                    size="small"
                                                    disabled={isUploading}
                                                >
                                                    {MULTIPLE_DOC_CATEGORIES.includes(cat.key) ? "Добавить" : (files[cat.key] ? "Изменить" : "Загрузить")}
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
                                                {files[cat.key] && !MULTIPLE_DOC_CATEGORIES.includes(cat.key) && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveFile(cat.key)}
                                                        disabled={isUploading}
                                                        style={{ minWidth: '40px', marginLeft: 8 }}
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>

                                        {MULTIPLE_DOC_CATEGORIES.includes(cat.key) && files[cat.key] && files[cat.key].length > 0 && (
                                            <Box mt={1} pl={2} pr={2}>
                                                {files[cat.key].map((f, idx) => (
                                                    <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" mb={0.5} borderTop={1} borderColor="grey.200" pt={0.5}>
                                                        <Typography variant="caption" color="textSecondary" noWrap style={{ maxWidth: '80%' }}>
                                                            {idx + 1}. {f.name}
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveFile(cat.key, idx)}
                                                            disabled={isUploading}
                                                            style={{ minWidth: '24px', padding: '2px 4px' }}
                                                        >
                                                            ✕
                                                        </Button>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Widget>
                </Grid>
            </Grid>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
            >
                <DialogTitle>Внимание</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Вы уверены, что хотите добавить абитуриента с неполным пакетом документов?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Отмена
                    </Button>
                    <Button onClick={handleConfirmSubmit} color="primary" autoFocus>
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

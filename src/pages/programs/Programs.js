import {
    Alert, Box, Card, CardActionArea, CardContent, Checkbox, Chip,
    CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, FormControl, FormControlLabel, Grid, IconButton, InputLabel,
    MenuItem, Paper, Select, Snackbar, Tab, Tabs,
    TextField, ThemeProvider, Tooltip, Typography, createTheme
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { useEffect, useState } from "react";
import PageTitle from "../../components/PageTitle/PageTitle";
import { Button } from "../../components/Wrappers/Wrappers";
import config from "../../config";
import { useUserState } from "../../context/UserContext";
import { StatusChip, CustomFilterList, StatusLegend, statusMap } from "../applicants/components/StatusComponents";
import ApplicantTableFilter from "../applicants/components/ApplicantTableFilter";
import StatsPanel from "../dashboard/StatsPanel";

const SCHEME_LABELS = {
    default: 'Обычная',
    ieee: 'IEEE',
};

const TYPE_LABELS = {
    BASE: 'Базовый',
    BLOCKING: 'Блокирующий',
};

const DOC_TYPE_LABELS = {
    diploma: 'Диплом',
    transcript: 'Транскрипт',
    resume: 'Резюме',
    motivation: 'Мотивационное письмо',
    recommendation: 'Рекомендательное письмо',
    achievement: 'Достижение',
    certification: 'Сертификат',
    language: 'Языковой сертификат',
    video_presentation: 'Видео-презентация',
    second_diploma: 'Доп. диплом',
    prof_development: 'Проф. развитие',
};

const DOCUMENT_TYPE_OPTIONS = Object.keys(DOC_TYPE_LABELS);

export default function ProgramsPage({ defaultView }) {
    const { currentUser } = useUserState();
    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';
    const canManage = isAdmin || isManager;
    const currentYear = new Date().getFullYear();

    const [programs, setPrograms] = useState([]);
    const [view, setView] = useState(defaultView || "applicants");
    const [currentProgram, setCurrentProgram] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState(0); // 0=абитуриенты, 1=критерии, 2=эксперты, 3=статистика

    // Expert slots state
    const [expertSlots, setExpertSlots] = useState([]);
    const [allExperts, setAllExperts] = useState([]);

    // Criteria state
    const [criteria, setCriteria] = useState([]);
    const [criteriaLoading, setCriteriaLoading] = useState(false);
    const [criteriaDialog, setCriteriaDialog] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState(null);
    const [criteriaForm, setCriteriaForm] = useState({
        code: '', title: '', max_score: '', type: 'BASE', scheme: 'default',
        document_types: [], is_mandatory: false
    });
    const [schemeTab, setSchemeTab] = useState(0); // 0=Обычная, 1=IEEE

    // Create program dialog
    const [createDialog, setCreateDialog] = useState(false);
    const [newProgram, setNewProgram] = useState({ title: 'Системная и программная инженерия', year: currentYear, description: '' });

    // Complete program confirm
    const [completeDialog, setCompleteDialog] = useState(false);

    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (defaultView) {
            setView(defaultView === "current" ? "applicants" : "archive");
        }
    }, [defaultView]);

    const fetchPrograms = () => {
        axios.get(`${config.manageApi}/v1/programs`)
            .then(res => {
                const sorted = (res.data || []).sort((a, b) => b.year - a.year);
                setPrograms(sorted);
                if (defaultView === "current" || !defaultView) {
                    const current = sorted.find(p => p.year === currentYear) || sorted[0] || null;
                    setCurrentProgram(current);
                } else if (sorted.length > 0 && !currentProgram) {
                    setCurrentProgram(sorted[0]);
                }
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { fetchPrograms(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (currentProgram && view === "applicants") {
            setLoading(true);
            axios.get(`${config.manageApi}/v1/applicants?program_id=${currentProgram.id}`)
                .then(res => { setApplicants(res.data || []); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    }, [currentProgram, view]);

    const fetchCriteria = () => {
        setCriteriaLoading(true);
        axios.get(`${config.manageApi}/v1/criteria`)
            .then(res => { setCriteria(res.data || []); setCriteriaLoading(false); })
            .catch(() => setCriteriaLoading(false));
    };

    useEffect(() => {
        if (mainTab === 1) fetchCriteria();
        if (mainTab === 2 && currentProgram) {
            axios.get(`${config.manageApi}/v1/experts/slots?program_id=${currentProgram.id}`)
                .then(res => setExpertSlots(res.data || []))
                .catch(console.error);
            axios.get(`${config.manageApi}/v1/experts`)
                .then(res => setAllExperts(res.data || []))
                .catch(console.error);
        }
    }, [mainTab, currentProgram]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateProgram = () => {
        axios.post(`${config.manageApi}/v1/programs`, { ...newProgram, year: parseInt(newProgram.year) })
            .then(res => {
                setCreateDialog(false);
                fetchPrograms();
                setCurrentProgram(res.data);
                setView("applicants");
                setNotification({ message: 'Набор успешно создан', severity: 'success' });
            })
            .catch(err => setNotification({ message: err.response?.data?.error || 'Ошибка создания набора', severity: 'error' }));
    };

    const handleCompleteProgram = () => {
        axios.put(`${config.manageApi}/v1/programs/${currentProgram.id}`, { status: 'completed' })
            .then(() => {
                setCompleteDialog(false);
                setCurrentProgram(p => ({ ...p, status: 'completed' }));
                fetchPrograms();
                setNotification({ message: 'Набор отмечен как завершённый', severity: 'success' });
            })
            .catch(err => setNotification({ message: err.response?.data?.error || 'Ошибка', severity: 'error' }));
    };

    const openCriteriaDialog = (crit) => {
        if (crit) {
            setEditingCriteria(crit);
            setCriteriaForm({ ...crit, max_score: String(crit.max_score) });
        } else {
            const activeScheme = schemeTab === 0 ? 'default' : 'ieee';
            setEditingCriteria(null);
            setCriteriaForm({ code: '', title: '', max_score: '', type: 'BASE', scheme: activeScheme, document_types: [], is_mandatory: false });
        }
        setCriteriaDialog(true);
    };

    const handleSaveCriteria = () => {
        const payload = { ...criteriaForm, max_score: parseInt(criteriaForm.max_score) };
        const req = editingCriteria
            ? axios.put(`${config.manageApi}/v1/criteria/${editingCriteria.code}`, payload)
            : axios.post(`${config.manageApi}/v1/criteria`, payload);
        req.then(() => {
            setCriteriaDialog(false);
            fetchCriteria();
            setNotification({ message: 'Критерий сохранён', severity: 'success' });
        }).catch(err => setNotification({ message: err.response?.data?.error || 'Ошибка сохранения', severity: 'error' }));
    };

    const handleDeleteCriteria = (code) => {
        if (!window.confirm(`Удалить критерий "${code}"?`)) return;
        axios.delete(`${config.manageApi}/v1/criteria/${code}`)
            .then(() => { fetchCriteria(); setNotification({ message: 'Критерий удалён', severity: 'success' }); })
            .catch(err => setNotification({ message: err.response?.data?.error || 'Ошибка удаления', severity: 'error' }));
    };

    const toggleDocType = (dt) => {
        setCriteriaForm(prev => {
            const types = prev.document_types.includes(dt)
                ? prev.document_types.filter(t => t !== dt)
                : [...prev.document_types, dt];
            return { ...prev, document_types: types };
        });
    };

    const schemeCriteria = (scheme) => criteria.filter(c => c.scheme === scheme);

    const columns = [
        { name: "id", label: "ID", options: { display: false, filter: false } },
        { name: "place", label: "Место", options: { customBodyRender: (_, tm) => tm.rowIndex + 1, filter: false } },
        { name: "last_name", label: "Фамилия", options: { filter: false } },
        { name: "first_name", label: "Имя", options: { filter: false } },
        { name: "patronymic", label: "Отчество", options: { filter: false } },
        {
            name: "score", label: "Оценка",
            options: { customBodyRender: (v) => (v && v !== 0 && v !== "0.0") ? v : "-", filter: false }
        },
        {
            name: "status", label: "Статус",
            options: { filterOptions: { renderValue: (v) => statusMap[v]?.label || v }, customBodyRender: (v) => <StatusChip status={v} /> }
        },
        {
            name: "created_at", label: "Дата создания",
            options: {
                filter: false,
                customBodyRender: (value) => {
                    const d = new Date(value);
                    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(-2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                }
            }
        },
        {
            name: "actions", label: "Действия",
            options: {
                filter: false,
                customBodyRender: (_, tableMeta) => {
                    const id = tableMeta.rowData[0];
                    return (
                        <Button variant="outlined" size="small"
                            onClick={() => window.location.hash = `#/app/applicants/${id}?program_id=${currentProgram.id}`}>
                            Анализ
                        </Button>
                    );
                }
            }
        }
    ];

    const getMuiTheme = () => createTheme({
        components: {
            MUIDataTableFilter: { styleOverrides: { root: { padding: '16px', width: '350px' }, reset: { display: 'none' } } },
            MUIDataTableFilterList: { styleOverrides: { root: { marginBottom: '16px' } } }
        }
    });

    const hasCurrentYear = programs.some(p => p.year === currentYear);

    if (loading && programs.length === 0) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="50vh"><CircularProgress /></Box>;
    }

    return (
        <>
            <PageTitle
                title="Системная и программная инженерия"
                actions={
                    <Box display="flex" gap={1}>
                        {view === "applicants" && currentProgram && (
                            <Button variant="outlined" color="secondary"
                                onClick={() => window.location.hash = currentProgram
                                    ? `#/app/applicants/new?program_id=${currentProgram.id}`
                                    : "#/app/applicants/new"}>
                                Добавить абитуриента
                            </Button>
                        )}
                        {canManage && view === "applicants" && currentProgram?.status === 'active' && (
                            <Button variant="outlined" color="warning" startIcon={<CheckCircleOutlineIcon />}
                                onClick={() => setCompleteDialog(true)}>
                                Завершить набор
                            </Button>
                        )}
                        {isAdmin && view === "applicants" && !hasCurrentYear && (
                            <Button variant="contained" color="primary" onClick={() => setCreateDialog(true)}>
                                Создать набор {currentYear}
                            </Button>
                        )}
                    </Box>
                }
            />

            {view === "applicants" && currentProgram ? (
                <Box mt={2}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Typography variant="h5" color="textSecondary">
                            Приемная кампания {currentProgram.year}
                        </Typography>
                        <Chip
                            label={currentProgram.status === 'completed' ? 'Завершён' : 'Активен'}
                            color={currentProgram.status === 'completed' ? 'default' : 'success'}
                            size="small"
                        />
                    </Box>

                    <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Абитуриенты" />
                        <Tab label="Критерии оценивания" />
                        <Tab label="Эксперты" />
                        <Tab label="Статистика" />
                    </Tabs>

                    {mainTab === 0 && (
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <StatusLegend />
                                <ThemeProvider theme={getMuiTheme()}>
                                    <MUIDataTable
                                        title="Список абитуриентов"
                                        data={applicants}
                                        columns={columns}
                                        components={{ TableFilterList: CustomFilterList }}
                                        options={{
                                            filter: true, confirmFilters: true,
                                            customFilterDialogFooter: ApplicantTableFilter,
                                            filterType: "checkbox", selectableRows: 'none',
                                            onRowClick: (rowData) => {
                                                window.location.hash = `#/app/applicants/${rowData[0]}?program_id=${currentProgram.id}`;
                                            }
                                        }}
                                    />
                                </ThemeProvider>
                            </Grid>
                        </Grid>
                    )}

                    {mainTab === 2 && (
                        <Box>
                            <Typography variant="body2" color="textSecondary" mb={2}>
                                Назначьте до 3 экспертов для оценивания портфолио в этом наборе. Каждый слот — отдельный эксперт.
                            </Typography>
                            <Grid container spacing={2}>
                                {[1, 2, 3].map(slotNum => {
                                    const slot = expertSlots.find(s => s.slot_number === slotNum);
                                    const assignedId = slot?.user_id || "";
                                    return (
                                        <Grid item xs={12} md={4} key={slotNum}>
                                            <Paper variant="outlined" sx={{ p: 2 }}>
                                                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                                    Эксперт {slotNum}
                                                </Typography>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Выбрать эксперта</InputLabel>
                                                    <Select
                                                        value={assignedId}
                                                        label="Выбрать эксперта"
                                                        onChange={e => {
                                                            const userId = e.target.value;
                                                            axios.post(`${config.manageApi}/v1/experts/slots`, {
                                                                user_id: userId,
                                                                slot_number: slotNum,
                                                                program_id: currentProgram.id,
                                                                role: currentUser?.role || "admin",
                                                            })
                                                                .then(() => {
                                                                    setExpertSlots(prev => {
                                                                        const updated = prev.filter(s => s.slot_number !== slotNum);
                                                                        if (userId) updated.push({ slot_number: slotNum, user_id: userId, program_id: currentProgram.id });
                                                                        return updated;
                                                                    });
                                                                    setNotification({ message: `Слот ${slotNum} обновлён`, severity: 'success' });
                                                                })
                                                                .catch(err => setNotification({ message: err.response?.data?.error || 'Ошибка назначения', severity: 'error' }));
                                                        }}
                                                    >
                                                        <MenuItem value=""><em>— Не назначен —</em></MenuItem>
                                                        {allExperts.map(exp => (
                                                            <MenuItem key={exp.id || exp.user_id} value={exp.id || exp.user_id}>
                                                                {exp.last_name || exp.lastName || ""} {exp.first_name || exp.firstName || ""} {exp.patronymic || ""}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    )}

                    {mainTab === 3 && (
                        <StatsPanel programId={currentProgram.id} />
                    )}

                    {mainTab === 1 && (
                        <Box>
                            <Tabs value={schemeTab} onChange={(_, v) => setSchemeTab(v)} sx={{ mb: 2 }}>
                                <Tab label="Обычная схема" />
                                <Tab label="IEEE / Международная" />
                            </Tabs>

                            {isAdmin && (
                                <Box mb={2}>
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCriteriaDialog(null)}>
                                        Добавить критерий
                                    </Button>
                                </Box>
                            )}

                            {criteriaLoading ? <CircularProgress /> : (
                                <Grid container spacing={2}>
                                    {schemeCriteria(schemeTab === 0 ? 'default' : 'ieee').map(c => (
                                        <Grid item xs={12} md={6} key={c.code}>
                                            <Paper variant="outlined" sx={{ p: 2 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                    <Box flex={1}>
                                                        <Typography variant="subtitle1" fontWeight="bold">{c.title}</Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Код: {c.code} · Макс. баллов: {c.max_score} · Тип: {TYPE_LABELS[c.type] || c.type}
                                                        </Typography>
                                                        <Box mt={0.5} display="flex" gap={0.5} flexWrap="wrap">
                                                            {c.is_mandatory && <Chip label="Обязательный" size="small" color="error" />}
                                                            {(c.document_types || []).map(dt => (
                                                                <Chip key={dt} label={DOC_TYPE_LABELS[dt] || dt} size="small" variant="outlined" />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                    {isAdmin && (
                                                        <Box>
                                                            <Tooltip title="Редактировать">
                                                                <IconButton size="small" onClick={() => openCriteriaDialog(c)}><EditIcon fontSize="small" /></IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Удалить">
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteCriteria(c.code)}><DeleteIcon fontSize="small" /></IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                    {schemeCriteria(schemeTab === 0 ? 'default' : 'ieee').length === 0 && (
                                        <Grid item xs={12}>
                                            <Typography color="textSecondary" variant="body2">
                                                Критерии для схемы «{schemeTab === 0 ? 'Обычная' : 'IEEE'}» не добавлены.
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            ) : (
                <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5" color="textSecondary">Архив наборов</Typography>
                        {isAdmin && !hasCurrentYear && (
                            <Button variant="contained" color="primary" onClick={() => setCreateDialog(true)}>
                                Создать набор {currentYear}
                            </Button>
                        )}
                    </Box>
                    <Grid container spacing={4}>
                        {programs.map(program => (
                            <Grid item xs={12} md={4} key={program.id}>
                                <Card elevation={3} style={{ borderRadius: 15 }}>
                                    <CardActionArea onClick={() => { setCurrentProgram(program); setView("applicants"); }}>
                                        <CardContent style={{ height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                            <Box mb={1} bgcolor="primary.light" color="white" display="inline-block" p={1} borderRadius={2} alignSelf="center">
                                                <Typography variant="h6">{program.year}</Typography>
                                            </Box>
                                            <Typography variant="h5" color="primary">{program.title}</Typography>
                                            <Box mt={1}>
                                                <Chip label={program.status === 'completed' ? 'Завершён' : 'Активен'}
                                                    color={program.status === 'completed' ? 'default' : 'success'} size="small" />
                                            </Box>
                                            {program.description && (
                                                <Typography color="textSecondary" variant="body2" mt={1}>{program.description}</Typography>
                                            )}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Диалог создания набора */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать новый набор</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField label="Название программы" value={newProgram.title}
                            onChange={e => setNewProgram(p => ({ ...p, title: e.target.value }))} fullWidth />
                        <TextField label="Год" type="number" value={newProgram.year}
                            onChange={e => setNewProgram(p => ({ ...p, year: e.target.value }))} fullWidth />
                        <TextField label="Описание" value={newProgram.description} multiline rows={2}
                            onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))} fullWidth />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreateProgram}>Создать</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог завершения набора */}
            <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Завершить приёмную кампанию?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Кампания {currentProgram?.year} будет отмечена как завершённая. Это действие не влияет на данные абитуриентов.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompleteDialog(false)}>Отмена</Button>
                    <Button variant="contained" color="warning" onClick={handleCompleteProgram}>Завершить</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог создания/редактирования критерия */}
            <Dialog open={criteriaDialog} onClose={() => setCriteriaDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingCriteria ? 'Редактировать критерий' : 'Новый критерий'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        {!editingCriteria && (
                            <TextField label="Код (уникальный, напр. EDU_BASE)" value={criteriaForm.code}
                                onChange={e => setCriteriaForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} fullWidth />
                        )}
                        <TextField label="Название" value={criteriaForm.title}
                            onChange={e => setCriteriaForm(p => ({ ...p, title: e.target.value }))} fullWidth />
                        <TextField label="Макс. баллов" type="number" value={criteriaForm.max_score}
                            onChange={e => setCriteriaForm(p => ({ ...p, max_score: e.target.value }))} fullWidth />
                        <TextField label="Тип" select value={criteriaForm.type}
                            onChange={e => setCriteriaForm(p => ({ ...p, type: e.target.value }))}
                            SelectProps={{ native: true }} fullWidth>
                            <option value="BASE">Базовый</option>
                            <option value="BLOCKING">Блокирующий</option>
                        </TextField>
                        <TextField label="Схема" select value={criteriaForm.scheme}
                            onChange={e => setCriteriaForm(p => ({ ...p, scheme: e.target.value }))}
                            SelectProps={{ native: true }} fullWidth>
                            <option value="default">Обычная</option>
                            <option value="ieee">IEEE</option>
                        </TextField>
                        <FormControlLabel
                            control={<Checkbox checked={criteriaForm.is_mandatory}
                                onChange={e => setCriteriaForm(p => ({ ...p, is_mandatory: e.target.checked }))} />}
                            label="Обязательный документ (блокирует передачу на проверку)"
                        />
                        <Divider />
                        <Box>
                            <Typography variant="body2" mb={1} color="textSecondary">Связанные типы документов:</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {DOCUMENT_TYPE_OPTIONS.map(dt => (
                                    <Chip key={dt} label={DOC_TYPE_LABELS[dt]} size="small"
                                        color={criteriaForm.document_types.includes(dt) ? 'primary' : 'default'}
                                        onClick={() => toggleDocType(dt)}
                                        clickable
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCriteriaDialog(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleSaveCriteria}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(notification)} autoHideDuration={5000}
                onClose={() => setNotification(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {notification && (
                    <Alert onClose={() => setNotification(null)} severity={notification.severity} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </>
    );
}

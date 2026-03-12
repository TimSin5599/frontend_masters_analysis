import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, LinearProgress, Paper, Tab, Tabs, TextField, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import config from "../../../config";

// components
import PageTitle from "../../../components/PageTitle/PageTitle";

export default function ApplicantDetails() {
    const theme = useTheme();
    const { id } = useParams();
    const location = useLocation();

    // Parse query params to find program_id if available
    const queryParams = new URLSearchParams(location.search);
    const programId = queryParams.get("program_id") || queryParams.get("?program_id");
    const [applicantName, setApplicantName] = useState(`Абитуриент #${id}`);
    const [activeCategory, setActiveCategory] = useState("passport");
    const [activeMainTab, setActiveMainTab] = useState("info");
    const [activeDocumentId, setActiveDocumentId] = useState(null);
    const [processingState, setProcessingState] = useState({});
    const [evaluations, setEvaluations] = useState([]);
    const [expertSlots, setExpertSlots] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [viewMode, setViewMode] = useState("form"); // "form" or "json"

    const updateProcessingState = (category, status, progressVal) => {
        setProcessingState(prev => {
            const current = prev[category] || {};
            const newProgress = typeof progressVal === 'function' ? progressVal(current.progress || 0) : (progressVal !== undefined ? progressVal : current.progress);
            return {
                ...prev,
                [category]: {
                    status: status !== undefined ? status : current.status,
                    progress: newProgress
                }
            };
        });
    };

    const processingStatus = processingState[activeCategory]?.status || null;
    const progress = processingState[activeCategory]?.progress || 0;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [rescanDialogOpen, setRescanDialogOpen] = useState(false);

    // Sub-tab for multi-document categories (work, recommendation, achievement)
    const [activeSubTab, setActiveSubTab] = useState(0);
    const [hoveredTab, setHoveredTab] = useState(null);

    // Reset sub-tab and view mode when category changes
    useEffect(() => {
        setActiveSubTab(0);
        setViewMode("form");
    }, [activeCategory]);

    // WebSocket Connection Handling
    useEffect(() => {
        let socket;
        let reconnectTimeout;

        const connectWebSocket = () => {
            const wsUrl = config.manageApi.replace('http', 'ws') + `/v1/applicants/${id}/ws`;
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                const msgData = JSON.parse(event.data);
                console.log("WebSocket event:", msgData);

                const isRelatedCategory = msgData.category === activeCategory ||
                    (msgData.category === 'transcript' && activeCategory === 'diploma') ||
                    (msgData.category === 'diploma' && activeCategory === 'transcript');

                if (msgData.category) {
                    if (msgData.status === 'completed') {
                        updateProcessingState(msgData.category, 'completed', 100);
                        if (isRelatedCategory) fetchData(); // Refresh the data for this category
                    } else if (msgData.status === 'failed') {
                        updateProcessingState(msgData.category, 'failed');
                        alert(`Ошибка обработки: ${msgData.error || "Неизвестная ошибка"}`);
                        setTimeout(() => updateProcessingState(msgData.category, null), 3000);
                    } else {
                        updateProcessingState(msgData.category, 'processing', msgData.progress || 0);
                    }
                }
            };

            socket.onerror = (error) => console.error("WebSocket error:", error);

            socket.onclose = () => {
                console.log("WebSocket connection closed for applicant", id);
                // Try to reconnect in 3 seconds
                reconnectTimeout = setTimeout(() => {
                    console.log("Attempting WebSocket reconnection...");
                    connectWebSocket();
                }, 3000);
            };
        };

        connectWebSocket();

        return () => {
            clearTimeout(reconnectTimeout);
            if (socket && socket.readyState === 1) { // 1 is OPEN
                socket.close();
            }
        };
    }, [id, activeCategory]);

    // Smart Progress Bar Logic - Now partially driven by WebSockets
    useEffect(() => {
        let interval;
        // If processing and we need simulated progress (e.g. from upload click)
        if (processingStatus === 'processing') {
            interval = setInterval(() => {
                updateProcessingState(activeCategory, undefined, prev => {
                    // If we receive a higher real progress value from WebSocket, don't overwrite it
                    // but if it's still small, animate it.
                    if (prev < 15) return prev + 5;
                    if (prev < 30) return prev + 2;
                    if (prev < 90) return prev + 0.5;
                    return prev;
                });
            }, 1000);
        } else if (processingStatus === 'completed') {
            updateProcessingState(activeCategory, undefined, 100);
            const timer = setTimeout(() => {
                updateProcessingState(activeCategory, null, 0);
            }, 3000);
            return () => clearTimeout(timer);
        } else if (!processingStatus) {
            updateProcessingState(activeCategory, undefined, 0);
        }
        return () => clearInterval(interval);
    }, [processingStatus, activeCategory]);

    // Fetch initial name from passport data
    useEffect(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=passport`)
            .then(res => {
                if (res.data && res.data.name && res.data.surname) {
                    setApplicantName(`${res.data.name} ${res.data.surname}`);
                }
            })
            .catch(console.error);
        
        // Fetch evaluations
        fetchEvaluations();
        
        // Fetch expert slots
        axios.get(`${config.manageApi}/v1/experts/slots`)
            .then(res => setExpertSlots(res.data))
            .catch(console.error);

        // Get current user from local storage
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }, [id]);

    const fetchEvaluations = () => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/evaluations`)
            .then(res => setEvaluations(res.data))
            .catch(console.error);
    };

    const fetchData = () => {
        setLoading(true);
        setActiveDocumentId(null); // Reset document view when category changes
        setIsEditing(false); // Reset editing state
        axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=${activeCategory}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setData(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, [id, activeCategory]);




    const handleSave = () => {
        let userMeta = {};
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userMeta = {
                    role: userObj.role === 'admin' ? 'админ' : 'оператор',
                    first_name: userObj.firstName || "",
                    last_name: userObj.lastName || "",
                    patronymic: userObj.patronymic || ""
                };
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }

        const payload = Array.isArray(data) 
            ? { records: data, ...userMeta }
            : { ...data, ...userMeta };

        axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=${activeCategory}`, payload)
            .then(() => {
                alert("Данные успешно сохранены");
                setIsEditing(false);
            })
            .catch(err => {
                console.error(err);
                alert("Ошибка при сохранении данных");
            });
    };

    const handleRescan = () => {
        setRescanDialogOpen(true);
    };

    const confirmRescan = () => {
        setRescanDialogOpen(false);
        console.log("RESCAN CONFIRMED. docId before:", activeDocumentId, "data:", data, "activeCategory:", activeCategory);

        let docId = activeDocumentId;
        // If not explicitly selected, try to find from data for single-record categories
        if (!docId && data && !Array.isArray(data) && data.document_id) {
            docId = data.document_id;
        }

        console.log("Selected docId for rescan:", docId);

        updateProcessingState(activeCategory, 'processing', 0); // Show bar immediately

        // Strategy 1: If we have a specific document ID, use it
        if (docId) {
            console.log(`Triggering Strategy 1: /v1/documents/${docId}/reprocess`);
            axios.post(`${config.manageApi}/v1/documents/${docId}/reprocess`)
                .then(() => {
                    console.log("Rescan Strategy 1 triggered successfully");
                    // WebSocket will handle status updates automatically
                })
                .catch(err => {
                    console.error("Error in Rescan Strategy 1:", err);
                    alert("Ошибка при запуске повторного сканирования (ID)");
                    updateProcessingState(activeCategory, null);
                });
        }
        // Strategy 2: Fallback to reprocessing latest document by category
        else {
            console.log(`Triggering Strategy 2: /v1/applicants/${id}/documents/reprocess?category=${activeCategory}`);
            axios.post(`${config.manageApi}/v1/applicants/${id}/documents/reprocess?category=${activeCategory}`)
                .then((res) => {
                    console.log("Rescan Strategy 2 triggered successfully");
                    alert("Процесс запущен. Ожидание обновлений...");
                    // WebSocket will handle status updates automatically
                })
                .catch(err => {
                    console.error("Error in Rescan Strategy 2:", err);
                    alert("Не удалось определить документ для сканирования.");
                    updateProcessingState(activeCategory, null);
                });
        }
    };

    const handleDelete = (itemId) => {
        if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
            axios.delete(`${config.manageApi}/v1/applicants/${id}/data/${activeCategory}/${itemId}`)
                .then(() => {
                    setActiveSubTab(0);
                    fetchData(); // Refresh list
                })
                .catch(err => {
                    console.error(err);
                    alert("Ошибка при удалении");
                });
        }
    };

    const handleDeleteApplicant = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDeleteApplicant = () => {
        axios.delete(`${config.manageApi}/v1/applicants/${id}`)
            .then(() => {
                alert("Абитуриент успешно удален");
                setDeleteDialogOpen(false);
                if (programId) {
                    window.location.hash = `#/app/programs/${programId}/applicants`;
                } else {
                    window.location.hash = "#/app/applicants";
                }
            })
            .catch(err => {
                console.error("Error deleting applicant:", err);
                alert("Ошибка при удалении абитуриента");
                setDeleteDialogOpen(false);
            });
    };



    const isDiplomaGroup = activeCategory === 'diploma' || activeCategory === 'transcript';

    return (
        <>
            <PageTitle
                title={`Анализ абитуриента: ${applicantName}`}
                dense
                actions={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteApplicant}
                    >
                        Удалить абитуриента
                    </Button>
                }
            />
            <Box mb={1} borderBottom={1} borderColor="divider">
                <Tabs
                    value={activeMainTab}
                    onChange={(e, val) => setActiveMainTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="primary"
                    indicatorColor="secondary"
                >
                    <Tab label="Информация" value="info" />
                    <Tab label="Оценки экспертов" value="evaluations" />
                </Tabs>
            </Box>
            <Grid container spacing={2} style={{ height: "calc(100vh - 200px)" }}>
                {/* Left Side: Document Viewer */}
                <Grid item xs={6}>
                    <Paper elevation={3} style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <Box p={2} bgcolor="primary.main" color="white" display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Оригинал документа</Typography>
                        </Box>
                        <iframe
                            id="doc-viewer-iframe"
                            src={activeDocumentId
                                ? `${config.manageApi}/v1/documents/${activeDocumentId}/view#view=FitV`
                                : `${config.manageApi}/v1/applicants/${id}/documents/view?category=${activeCategory}#view=FitV`}
                            width="100%"
                            height="100%"
                            title="Document Viewer"
                            style={{ border: "none", flexGrow: 1 }}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={6}>
                    <Paper elevation={3} style={{ height: "100%", display: "flex", flexDirection: "column" }}>

                        {activeMainTab === 'info' ? (
                            <>
                                <Box p={1} borderBottom={1} borderColor="divider">
                                    <Tabs value={activeCategory === 'transcript' ? 'diploma' : activeCategory} onChange={(e, val) => setActiveCategory(val)} variant="scrollable" scrollButtons="auto">
                                        <Tab label="Паспорт" value="passport" />
                                        <Tab label="Диплом" value="diploma" />
                                        <Tab label="Опыт работы" value="work" />
                                        <Tab label="Рекомендации" value="recommendation" />
                                        <Tab label="Достижения" value="achievement" />
                                        <Tab label="Сертификат АЯ" value="language" />
                                        <Tab label="Мотивация" value="motivation" />
                                    </Tabs>
                                </Box>
                                <Box p={3} flexGrow={1} overflow="auto">
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography color="textSecondary" variant="caption">
                                            Источник: {(() => {
                                                const currentData = Array.isArray(data) ? data[activeSubTab] : data;
                                                const source = currentData?.source || (activeCategory === 'transcript' ? "" : "ИИ");
                                                if (!source) return "-";
                                                if (source === "model" || source === "ИИ") return "ИИ";
                                                return source; // Already formatted as "role (name)" from backend
                                            })()}
                                        </Typography>
                                        <Tooltip title={viewMode === "json" ? "Показать форму" : "Посмотреть JSON"}>
                                            <IconButton size="small" onClick={() => setViewMode(viewMode === "json" ? "form" : "json")}>
                                                <CodeIcon fontSize="small" color={viewMode === "json" ? "primary" : "inherit"} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>



                                    {/* PROGRESS BAR */}
                                    {processingStatus && (
                                        <Box mt={2} mb={4} p={2} component={Paper} variant="outlined" style={{ backgroundColor: '#fafafa' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                {[
                                                    { label: "Загрузка", min: 0, max: 15 },
                                                    { label: "Подготовка", min: 15, max: 30 },
                                                    { label: "ИИ анализ (1-2 мин)", min: 30, max: 90 },
                                                    { label: "Завершение", min: 90, max: 100 }
                                                ].map((stage, idx) => {
                                                    const isActive = progress >= stage.min && (progress < stage.max || (stage.max === 100 && progress === 100));
                                                    const isDone = progress >= stage.max;
                                                    return (
                                                        <Typography
                                                            key={idx}
                                                            variant="caption"
                                                            style={{
                                                                fontWeight: isActive ? 700 : 400,
                                                                color: isActive ? theme.palette.primary.main : isDone ? theme.palette.success.main : '#999',
                                                                transition: 'all 0.3s'
                                                            }}
                                                        >
                                                            {stage.label}
                                                        </Typography>
                                                    );
                                                })}
                                            </Box>
                                            <Box display="flex" alignItems="center">
                                                <Box width="100%" mr={1}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={progress}
                                                        color={processingStatus === 'completed' ? 'success' : 'primary'}
                                                    />
                                                </Box>
                                                <Box minWidth={35}>
                                                    <Typography variant="body2" color="textSecondary">{`${Math.round(progress)}%`}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* JSON VIEW MODE */}
                                    {viewMode === "json" ? (
                                        <Box mt={2}>
                                            <Paper variant="outlined" style={{ padding: 16, backgroundColor: '#f5f5f5', overflow: 'auto', position: 'relative' }}>
                                                <Button 
                                                    size="small" 
                                                    style={{ position: 'absolute', top: 8, right: 8 }}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                                                        alert("JSON скопирован");
                                                    }}
                                                >
                                                    Копировать
                                                </Button>
                                                <pre style={{ margin: 0, fontSize: '12px' }}>
                                                    {JSON.stringify(data, null, 2)}
                                                </pre>
                                            </Paper>
                                        </Box>
                                    ) : (
                                        <>
                                            {/* EXPERT EVALUATION FORM (INJECTED IN INFO TAB) */}
                                            {data && !loading && (
                                                <ExpertScoreSection 
                                                    key={activeCategory}
                                                    applicantId={id}
                                                    category={activeCategory}
                                                    currentUser={currentUser}
                                                    expertSlots={expertSlots}
                                                    evaluations={evaluations}
                                                    onSaved={fetchEvaluations}
                                                />
                                            )}

                                    {/* GENERIC LOADING/EMPTY STATE */}
                                    {loading && <Typography mt={4}>Загрузка данных...</Typography>}
                                    {!data && !loading && activeCategory !== 'work' && activeCategory !== 'recommendation' && activeCategory !== 'achievement' && activeCategory !== 'language' && activeCategory !== 'motivation' && (
                                        <Box mt={4}>
                                            <Typography color="error">Данные для этой категории еще не извлечены.</Typography>
                                        </Box>
                                    )}
                                    {(!data || data.length === 0) && !loading && (activeCategory === 'work' || activeCategory === 'recommendation' || activeCategory === 'achievement') && (
                                        <Box mt={4}>
                                            <Typography color="textSecondary">Нет записей. Загрузите документ для добавления.</Typography>
                                        </Box>
                                    )}

                                    {/* PASSPORT */}
                                    {activeCategory === "passport" && data && (
                                        <Box mt={4}>
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
                                                    <TextField disabled={!isEditing} label="Отчество*" fullWidth variant="outlined" size="small"
                                                        value={data.patronymic || ""} onChange={e => setData({ ...data, patronymic: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Номер документа" fullWidth variant="outlined" size="small"
                                                        value={data.document_number || ""} onChange={e => setData({ ...data, document_number: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Гражданство" fullWidth variant="outlined" size="small"
                                                        value={data.nationality || ""} onChange={e => setData({ ...data, nationality: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Дата рождения" fullWidth variant="outlined" size="small"
                                                        value={data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString('ru-RU') : ""}
                                                        onChange={e => setData({ ...data, date_of_birth: e.target.value })} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* DIPLOMA & TRANSCRIPT (Merged Group) */}
                                    {isDiplomaGroup && (
                                        <Box mt={2}>
                                            {/* Sub-Switch for Diploma/Transcript */}
                                            <Box display="flex" justifyContent="center" mb={2}>
                                                <Button
                                                    variant={activeCategory === 'diploma' ? 'contained' : 'outlined'}
                                                    onClick={() => setActiveCategory('diploma')}
                                                    style={{ marginRight: 10 }}
                                                >
                                                    Основное
                                                </Button>
                                                <Button
                                                    variant={activeCategory === 'transcript' ? 'contained' : 'outlined'}
                                                    onClick={() => setActiveCategory('transcript')}
                                                >
                                                    Выписка
                                                </Button>
                                            </Box>

                                            {activeCategory === 'diploma' && data && (
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
                                                </Grid>
                                            )}

                                            {activeCategory === "transcript" && data && (
                                                <Box mt={2}>
                                                    <Typography variant="h6" gutterBottom>Аналитика успеваемости (Выписка)</Typography>
                                                    <Grid container spacing={2}>
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
                                            )}
                                        </Box>
                                    )}


                                    {/* WORK EXPERIENCE (TABS) */}
                                    {activeCategory === "work" && (
                                        <Box mt={2}>
                                            <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                                <Tabs
                                                    value={activeSubTab}
                                                    onChange={(e, val) => {
                                                        if (val === 'add') {
                                                            document.getElementById('upload-document-button').click();
                                                        } else {
                                                            setActiveSubTab(val);
                                                            if (data[val] && data[val].document_id) {
                                                                setActiveDocumentId(data[val].document_id);
                                                            }
                                                        }
                                                    }}
                                                    variant="scrollable"
                                                    scrollButtons="auto"
                                                    style={{ minHeight: '48px' }}
                                                >
                                                    {Array.isArray(data) && data.map((item, index) => (
                                                        <Tab key={index} label={
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                {`Место работы #${index + 1}`}
                                                                {activeSubTab === index && (
                                                                    <IconButton
                                                                        size="small"
                                                                        component="span"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(item.id);
                                                                        }}
                                                                        style={{ marginLeft: 8, padding: 2 }}
                                                                    >
                                                                        <CloseIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </div>
                                                        } value={index} />
                                                    ))}
                                                    <Tab icon={<AddIcon />} label="Добавить" value="add" style={{ minHeight: '48px', flexDirection: 'row', gap: '8px' }} />
                                                </Tabs>
                                            </Box>

                                            {Array.isArray(data) && data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                                                <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="subtitle2" color="primary">Место работы #{activeSubTab + 1}</Typography>
                                                        <div>
                                                            {data[activeSubTab].document_id && (
                                                                <Button size="small" variant="outlined" onClick={() => setActiveDocumentId(data[activeSubTab].document_id)} style={{ marginRight: 8 }}>
                                                                    Оригинал
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </Box>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <TextField disabled={!isEditing} label="Компания" fullWidth variant="outlined" size="small"
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
                                                    </Grid>
                                                </Paper>
                                            )}
                                        </Box>
                                    )}

                                    {/* RECOMMENDATIONS (TABS) */}
                                    {activeCategory === "recommendation" && Array.isArray(data) && (
                                        <Box mt={2}>
                                            <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                                <Tabs
                                                    value={activeSubTab}
                                                    onChange={(e, val) => {
                                                        if (val === 'add') {
                                                            document.getElementById('upload-document-button').click();
                                                        } else {
                                                            setActiveSubTab(val);
                                                            if (data[val] && data[val].document_id) {
                                                                setActiveDocumentId(data[val].document_id);
                                                            }
                                                        }
                                                    }}
                                                    variant="scrollable"
                                                    scrollButtons="auto"
                                                    style={{ minHeight: '48px' }}
                                                >
                                                    {data.map((item, index) => (
                                                        <Tab key={index} label={
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                {`Рекомендация #${index + 1}`}
                                                                {activeSubTab === index && (
                                                                    <IconButton
                                                                        size="small"
                                                                        component="span"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(item.id);
                                                                        }}
                                                                        style={{ marginLeft: 8, padding: 2 }}
                                                                    >
                                                                        <CloseIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </div>
                                                        } value={index} />
                                                    ))}
                                                    <Tab icon={<AddIcon />} label="Добавить" value="add" style={{ minHeight: '48px', flexDirection: 'row', gap: '8px' }} />
                                                </Tabs>
                                            </Box>

                                            {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                                                <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="subtitle2" color="primary">Рекомендация #{activeSubTab + 1}</Typography>
                                                        <div>
                                                            {data[activeSubTab].document_id && (
                                                                <Button size="small" variant="outlined" onClick={() => setActiveDocumentId(data[activeSubTab].document_id)} style={{ marginRight: 8 }}>
                                                                    Оригинал
                                                                </Button>
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
                                    )}

                                    {/* ACHIEVEMENTS (TABS) */}
                                    {activeCategory === "achievement" && Array.isArray(data) && (
                                        <Box mt={2}>
                                            <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                                <Tabs
                                                    value={activeSubTab}
                                                    onChange={(e, val) => {
                                                        if (val === 'add') {
                                                            document.getElementById('upload-document-button').click();
                                                        } else {
                                                            setActiveSubTab(val);
                                                            if (data[val] && data[val].document_id) {
                                                                setActiveDocumentId(data[val].document_id);
                                                            }
                                                        }
                                                    }}
                                                    variant="scrollable"
                                                    scrollButtons="auto"
                                                    style={{ minHeight: '48px' }}
                                                >
                                                    {data.map((item, index) => (
                                                        <Tab key={index} label={
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                {`Достижение #${index + 1}`}
                                                                {activeSubTab === index && (
                                                                    <IconButton
                                                                        size="small"
                                                                        component="span"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(item.id);
                                                                        }}
                                                                        style={{ marginLeft: 8, padding: 2 }}
                                                                    >
                                                                        <CloseIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </div>
                                                        } value={index} />
                                                    ))}
                                                    <Tab icon={<AddIcon />} label="Добавить" value="add" style={{ minHeight: '48px', flexDirection: 'row', gap: '8px' }} />
                                                </Tabs>
                                            </Box>

                                            {data.length > 0 && activeSubTab !== 'add' && data[activeSubTab] && (
                                                <Paper variant="outlined" style={{ padding: 10, marginBottom: 10 }}>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="subtitle2" color="primary">Достижение #{activeSubTab + 1}</Typography>
                                                        <div>
                                                            {data[activeSubTab].document_id && (
                                                                <Button size="small" variant="outlined" onClick={() => setActiveDocumentId(data[activeSubTab].document_id)} style={{ marginRight: 8 }}>
                                                                    Оригинал
                                                                </Button>
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
                                                                value={data[activeSubTab].date_received ? new Date(data[activeSubTab].date_received).toLocaleDateString('ru-RU') : ""}
                                                                onChange={e => {
                                                                    const newData = [...data];
                                                                    // Ideally an ISO date picker, but keeping structure per existing layout
                                                                    newData[activeSubTab].date_received = e.target.value;
                                                                    setData(newData);
                                                                }} />
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            )}
                                        </Box>
                                    )}

                                    {/* LANGUAGE CERTIFICATE */}
                                    {activeCategory === "language" && (
                                        <Box mt={4}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Название экзамена" fullWidth variant="outlined" size="small"
                                                        value={(data && data.exam_name) || ""} onChange={e => setData({ ...data, exam_name: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Баллы" fullWidth variant="outlined" size="small"
                                                        value={(data && data.score) || ""} onChange={e => setData({ ...data, score: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField disabled={!isEditing} label="Уровень английского" fullWidth variant="outlined" size="small"
                                                        value={(data && data.english_level) || ""} onChange={e => setData({ ...data, english_level: e.target.value })} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}



                                    {/* MOTIVATION */}
                                    {activeCategory === "motivation" && (
                                        <Box mt={4}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <TextField disabled={!isEditing} label="Ключевые элементы" fullWidth variant="outlined" size="small" multiline rows={15}
                                                        value={(data && data.main_text) || ""} onChange={e => setData({ ...data, main_text: e.target.value })} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}



                                    <Box mt={6} display="flex" justifyContent="flex-end" alignItems="center">
                                        <Box flexGrow={1}>
                                            <input
                                                accept="application/pdf,image/*"
                                                style={{ display: 'none' }}
                                                id="upload-document-button"
                                                type="file"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const file = e.target.files[0];
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        formData.append('category', activeCategory);

                                                        updateProcessingState(activeCategory, 'processing', 0);

                                                        axios.post(`${config.manageApi}/v1/applicants/${id}/documents`, formData, {
                                                            headers: {
                                                                'Content-Type': 'multipart/form-data'
                                                            }
                                                        })
                                                            .then((res) => {
                                                                alert("Документ загружен и поставлен в очередь.");
                                                                console.log("Document uploaded to minio & rabbitmq:", res.data);
                                                                // We don't fetch data yet. WebSocket will tell us when done.
                                                            })
                                                            .catch(err => {
                                                                console.error(err);
                                                                alert("Ошибка при загрузке документа");
                                                                updateProcessingState(activeCategory, null);
                                                            });
                                                    }
                                                }}
                                            />
                                            {/* For empty data views involving these multi-doc categories, we show the add button */}
                                            {(!data || data.length === 0) && (activeCategory === 'work' || activeCategory === 'recommendation' || activeCategory === 'achievement') && (
                                                <label htmlFor="upload-document-button">
                                                    <Button variant="outlined" component="span" size="medium" style={{ marginRight: 10 }}>
                                                        Загрузить первый документ
                                                    </Button>
                                                </label>
                                            )}

                                            {/* We hide the "Upload new document" general button for these categories since they have a "Add" tab now *unless* it's empty */}
                                            {activeCategory !== 'work' && activeCategory !== 'recommendation' && activeCategory !== 'achievement' && (
                                                <label htmlFor="upload-document-button">
                                                    <Button variant="outlined" component="span" size="medium" style={{ marginRight: 10 }}>
                                                        Загрузить новый документ
                                                    </Button>
                                                </label>
                                            )}
                                        </Box>
                                        <Button variant="outlined" color="primary" onClick={handleRescan} style={{ marginRight: 10 }}>Повторить сканирование</Button>
                                        {!isEditing ? (
                                            <Button variant="contained" color="primary" onClick={() => setIsEditing(true)}>Изменить</Button>
                                        ) : (
                                            <>
                                                <Button variant="outlined" color="secondary" onClick={() => setIsEditing(false)} style={{ marginRight: 10 }}>Отменить</Button>
                                                <Button variant="contained" color="success" onClick={handleSave}>Сохранить</Button>
                                            </>
                                        )}
                                    </Box>
                                </>
                            )}
                            </Box>
                        </>
                        ) : (
                            <ExpertEvaluationsTab 
                                evaluations={evaluations}
                                expertSlots={expertSlots}
                                currentUser={currentUser}
                                categories={[
                                    { id: 'passport', label: 'Паспорт' },
                                    { id: 'diploma', label: 'Диплом' },
                                    { id: 'transcript', label: 'Транскрипт' },
                                    { id: 'work', label: 'Опыт работы' },
                                    { id: 'recommendation', label: 'Рекомендации' },
                                    { id: 'achievement', label: 'Достижения' },
                                    { id: 'language', label: 'Сертификат АЯ' },
                                    { id: 'motivation', label: 'Мотивация' }
                                ]}
                            />
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Confirmation Dialog for Deleting Applicant */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Удаление абитуриента</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Вы уверены, что хотите полностью удалить этого абитуриента из системы? Это действие необратимо и удалит все данные из базы данных и хранилища файлов.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
                    <Button onClick={confirmDeleteApplicant} color="error" autoFocus variant="contained">
                        Да, удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Rescan */}
            <Dialog
                open={rescanDialogOpen}
                onClose={() => setRescanDialogOpen(false)}
            >
                <DialogTitle>Повторное сканирование</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Запустить повторное извлечение данных документом через ИИ? Текущие извлеченные или ручные данные будут перезаписаны свежим результатом сканирования.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRescanDialogOpen(false)}>Отмена</Button>
                    <Button onClick={confirmRescan} color="primary" autoFocus variant="contained">
                        Запустить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ----------------------------------------------------------------------
// NEW COMPONENTS FOR EXPERT EVALUATION
// ----------------------------------------------------------------------

function ExpertScoreSection({ applicantId, category, currentUser, expertSlots, evaluations, onSaved }) {
    const theme = useTheme();
    
    // Find if current user is an assigned expert
    const mySlot = expertSlots.find(s => s.user_id === currentUser?.id);
    const isAdmin = currentUser?.role === 'admin';
    const isExpert = currentUser?.role === 'expert' || currentUser?.role === 'observer';
    
    // If not admin and not expert, don't show the form
    if (!isAdmin && !isExpert) return null;

    // We can show the scores of all experts for this category here too?
    // Requirement says: "в каждой категории... выставить оценку... комментарии"
    // So if I am Expert 1, I see my fields. If I am Admin, maybe I see all fields or specific override?
    // Let's show a small form for "My Evaluation".
    
    const myEval = evaluations.find(e => e.category === category && e.expert_id === (mySlot ? mySlot.user_id : null));
    // If admin is viewing, who do they edit? 
    // Requirement: "администратор может изменить любую оценку"
    // For now, let's keep it simple: if expert, they see their slot.
    // If admin, maybe they see slots they want to override?
    
    return (
        <Box mt={4} p={2} bgcolor="#f8f9fa" borderRadius={1} border={1} borderColor="divider">
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">Экспертная оценка категории</Typography>
            
            {!mySlot && (
                <Typography variant="body2" color="textSecondary" mb={2}>
                    {isAdmin 
                        ? 'Эксперты еще не назначены. Перейдите во вкладку "Оценки экспертов", чтобы закрепить за системой экспертов.' 
                        : 'Вы еще не назначены на роль эксперта для этого абитуриента. Попросите администратора добавить ваш ID в один из слотов экспертов.'}
                </Typography>
            )}

            <Grid container spacing={2} alignItems="flex-end">
                {expertSlots.map(slot => {
                    const isMySlot = mySlot && mySlot.slot_number === slot.slot_number;
                    const canEdit = isMySlot || isAdmin;
                    const evalData = evaluations.find(e => e.category === category && e.expert_id === slot.user_id);
                    
                    return (
                        <Grid item xs={12} key={slot.slot_number}>
                            <Paper variant="outlined" style={{ padding: 12, borderLeft: `4px solid ${isMySlot ? theme.palette.primary.main : '#ccc'}` }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Эксперт {slot.slot_number}: {slot.user_name}
                                </Typography>
                                
                                <Grid container spacing={1} mt={0.5}>
                                    <Grid item xs={2}>
                                        <TextField 
                                            label="Оценка" 
                                            type="number" 
                                            size="small" 
                                            fullWidth
                                            disabled={!canEdit}
                                            defaultValue={evalData?.score || 0}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val !== (evalData?.score || 0)) {
                                                    saveEval(slot.user_id, val, evalData?.comment || "");
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={10}>
                                        <TextField 
                                            label="Комментарий эксперта" 
                                            size="small" 
                                            fullWidth
                                            disabled={!canEdit}
                                            defaultValue={evalData?.comment || ""}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== (evalData?.comment || "")) {
                                                    saveEval(slot.user_id, evalData?.score || 0, val);
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                                {evalData?.is_admin_override && (
                                    <Typography variant="caption" color="error" style={{ fontStyle: 'italic', marginTop: 4, display: 'block' }}>
                                        Переопределено: {evalData.source_info}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );

    function saveEval(targetExpertId, score, comment) {
        axios.post(`${config.manageApi}/v1/applicants/${applicantId}/evaluations`, {
            expert_id: targetExpertId,
            category: category,
            score: score,
            comment: comment,
            user_id: currentUser.id,
            user_name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
            user_role: currentUser.role
        }).then(() => {
            onSaved();
        }).catch(err => {
            console.error(err);
            alert("Ошибка при сохранении оценки");
        });
    }
}

function ExpertEvaluationsTab({ evaluations, expertSlots, categories, currentUser }) {
    return (
        <Box p={3} flexGrow={1} overflow="auto">
            <Typography variant="h5" gutterBottom>Сводная таблица оценок</Typography>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Категория</th>
                        {[1, 2, 3].map(i => {
                            const slot = expertSlots.find(s => s.slot_number === i);
                            return (
                                <th key={i} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                    Эксперт {i} {slot ? `(${slot.user_name})` : '(не назначен)'}
                                </th>
                            );
                        })}
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Итого</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => {
                        let total = 0;
                        let count = 0;
                        return (
                            <tr key={cat.id}>
                                <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>{cat.label}</td>
                                {[1, 2, 3].map(i => {
                                    const slot = expertSlots.find(s => s.slot_number === i);
                                    const evalData = evaluations.find(e => e.category === cat.id && e.expert_id === slot?.user_id);
                                    if (evalData) {
                                        total += evalData.score;
                                        count++;
                                    }
                                    return (
                                        <td key={i} style={{ border: '1px solid #ddd', padding: '12px' }}>
                                            {evalData ? (
                                                <Box>
                                                    <Typography variant="body1" fontWeight="bold" align="center">{evalData.score}</Typography>
                                                    {evalData.comment && (
                                                        <Typography variant="caption" color="textSecondary" style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 150 }}>
                                                            "{evalData.comment}"
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="textSecondary" align="center">-</Typography>
                                            )}
                                        </td>
                                    );
                                })}
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                                    <Typography variant="h6">{count > 0 ? (total / count).toFixed(1) : '-'}</Typography>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Admin Slot Management moved to User Management page */}
        </Box>
    );
}

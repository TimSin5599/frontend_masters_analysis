import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import PendingIcon from '@mui/icons-material/Pending';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, LinearProgress, Paper, Snackbar, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import config from "../../../config";

// components
import PageTitle from "../../../components/PageTitle/PageTitle";
import AchievementsSection from "./components/AchievementsSection";
import AdditionalEducationSection from "./components/AdditionalEducationSection";
import EducationSection from "./components/EducationSection";
import { ExpertEvaluationsTab, ExpertScoreSection } from "./components/ExpertEvaluations";
import LanguageSection from "./components/LanguageSection";
import MotivationSection from "./components/MotivationSection";
import PersonalDataSection from "./components/PersonalDataSection";
import RecommendationSection from "./components/RecommendationSection";
import VideoSection from "./components/VideoSection";
import DocumentsSection from "./components/DocumentsSection";

// hook
import { useApplicantDetails } from "./hooks/useApplicantDetails";
import { getToken } from "../../../utils/tokenManager";

export default function ApplicantDetails() {
    const { id } = useParams();
    const location = useLocation();
    const history = useHistory();

    // Parse query params to find program_id if available
    const queryParams = new URLSearchParams(location.search);
    const programId = queryParams.get("program_id") || queryParams.get("?program_id");

    const [activeCategory, setActiveCategory] = useState("personal_data");
    const [activeMainTab, setActiveMainTab] = useState("info");
    const [viewMode, setViewMode] = useState("form"); // "form" or "json"

    const {
        applicantName,
        data, setData,
        loading,
        isEditing, setIsEditing,
        activeSubTab, setActiveSubTab,
        activeDocumentId, setActiveDocumentId,
        documents,
        personalDataDocType, setPersonalDataDocType,
        processingStatus, progress,
        uploadTypeDialogOpen, setUploadTypeDialogOpen,
        pendingFile, setPendingFile,
        evaluations, fetchEvaluations,
        expertSlots,
        currentUser,
        handleSave,
        handleDelete,
        handleDeleteDocument,
        uploadDocumentWithData,
        confirmRescan,
        criteria,
        allExperts,
        fetchExpertSlots,
        applicantStatus,
        transferToExperts,
        handleSaveCategory,
        notification, setNotification,
        scoringScheme,
        updateScoringScheme,
    } = useApplicantDetails(id, activeCategory, programId);

    const statusMap = {
        "uploaded": { label: "Создан", color: "default" },
        "processing": { label: "Анализ", color: "info" },
        "verifying": { label: "Проверка", color: "warning" },
        "assessed": { label: "Оценивание", color: "secondary" },
        "completed": { label: "Оценено", color: "success" }
    };

    const currentStatus = statusMap[applicantStatus] || { label: applicantStatus, color: 'default' };

    const categoryToCriteriaCodes = {
        'diploma': ['EDU_BASE'],
        'transcript': ['EDU_BASE'],
        'prof_development': ['EDU_ADD', 'ADD_ACHIEV_COMBINED'],
        'second_diploma': ['EDU_ADD', 'ADD_ACHIEV_COMBINED'],
        'certification': ['EDU_ADD', 'ADD_ACHIEV_COMBINED'],
        'achievement': ['ACHIEVEMENTS', 'IEEE_INT', 'ADD_ACHIEV_COMBINED'],
        'recommendation': ['RECOMMENDATION'],
        'motivation': ['MOTIVATION'],
        'language': ['ENGLISH'],
        'video_presentation': ['VIDEO']
    };

    const potentialCodes = categoryToCriteriaCodes[activeCategory] || [];
    const matchedCriteria = (criteria || []).find(c => potentialCodes.includes(c.code));

    const categoryDocTypes = {
        'personal_data': ['passport', 'resume'],
        'diploma': ['diploma', 'transcript'],
        'additional_edu': ['second_diploma', 'prof_development', 'certification'],
        'achievement': ['achievement'],
        'motivation': ['motivation'],
        'recommendation': ['recommendation'],
        'language': ['language'],
        'video_presentation': ['video_presentation'],
    };

    const IN_FLIGHT_STATUSES = new Set(['pending', 'classifying', 'classified', 'extracting', 'processing']);
    const ERROR_STATUSES = new Set(['classification_failed', 'extraction_failed', 'failed']);

    const isProcessingCategory = (catKey) => {
        const types = categoryDocTypes[catKey] || [];
        return (documents || []).some(d => types.includes(d.file_type) && IN_FLIGHT_STATUSES.has(d.status));
    };

    const isErrorCategory = (catKey) => {
        const types = categoryDocTypes[catKey] || [];
        return (documents || []).some(d => types.includes(d.file_type) && ERROR_STATUSES.has(d.status));
    };

    const activeCatKey = ['second_diploma', 'prof_development', 'certification'].includes(activeCategory)
        ? 'additional_edu'
        : activeCategory;
    const activeCategoryIsProcessing = isProcessingCategory(activeCatKey);

    const handleDeleteApplicant = () => {
        if (window.confirm("Вы уверены, что хотите полностью удалить этого абитуриента?")) {
            axios.delete(`${config.manageApi}/v1/applicants/${id}`)
                .then(() => {
                    alert("Абитуриент успешно удален");
                    window.location.hash = programId ? `#/app/programs/${programId}/applicants` : "#/app/applicants";
                })
                .catch(err => {
                    console.error("Error deleting applicant:", err);
                    alert("Ошибка при удалении абитуриента");
                });
        }
    };

    return (
        <>
            <PageTitle
                title={`Анализ абитуриента: ${applicantName}`}
                dense
                actions={
                    <Box display="flex" gap={1} alignItems="center">
                        <Chip 
                            label={currentStatus.label} 
                            color={currentStatus.color} 
                            sx={{ fontWeight: 'bold', mr: 2 }} 
                        />
                        
                        {applicantStatus === 'verifying' && (currentUser?.role === 'admin' || currentUser?.role === 'operator') && (
                            <Button variant="contained" color="success" onClick={transferToExperts}>
                                Передать экспертам
                            </Button>
                        )}

                        <Button variant="contained" color="error" onClick={handleDeleteApplicant}>
                            Удалить абитуриента
                        </Button>
                    </Box>
                }
            />
            <Box mb={1} borderBottom={1} borderColor="divider">
                <Tabs
                    value={activeMainTab}
                    onChange={(e, val) => setActiveMainTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Информация" value="info" />
                    <Tab
                        label={
                            (documents || []).some(d => d.status === 'classification_failed' || d.file_type === 'unknown')
                            ? <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Документы ⚠</span>
                            : (documents || []).some(d => ERROR_STATUSES.has(d.status))
                            ? <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Документы ✗</span>
                            : (documents || []).some(d => IN_FLIGHT_STATUSES.has(d.status))
                            ? <span style={{ color: '#f57f17', fontWeight: 'bold' }}>Документы ●</span>
                            : "Документы"
                        }
                        value="unknown"
                    />
                    {expertSlots.some(s => String(s.user_id) === String(currentUser?.id || currentUser?._id)) && (
                        <Tab label="Оценка эксперта" value="evaluation_form" />
                    )}
                    <Tab label="Сводная таблица" value="evaluation_summary" />
                </Tabs>
            </Box>
            <Grid container spacing={2} style={{ height: "calc(100vh - 200px)" }}>
                {/* Left Side: Document Viewer - Hidden when in evaluation tabs */}
                {activeMainTab === 'info' && (
                    <Grid item xs={6}>
                        <Paper elevation={3} style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            <Box p={1.5} bgcolor="primary.main" color="white">
                                <Typography variant="h6">Оригинал документа</Typography>
                            </Box>
                            <iframe
                                key={activeDocumentId || activeCategory}
                                src={activeDocumentId
                                    ? `${config.manageApi}/v1/documents/${activeDocumentId}/view?token=${getToken()}#view=FitV`
                                    : `${config.manageApi}/v1/applicants/${id}/documents/view?category=${activeCategory === 'personal_data' ? personalDataDocType : activeCategory}${activeCategory === 'personal_data' ? `&doc_type=${personalDataDocType}` : ''}&token=${getToken()}#view=FitV`}
                                width="100%"
                                height="100%"
                                title="Document Viewer"
                                style={{ border: "none", flexGrow: 1 }}
                            />
                        </Paper>
                    </Grid>
                )}

                <Grid item xs={activeMainTab === 'info' ? 6 : 12} sx={{ height: '100%' }}>
                    <Paper elevation={3} style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {activeMainTab === 'info' && (
                            <>
                                <Box p={1} borderBottom={1} borderColor="divider">
                                    <Tabs
                                        value={
                                            activeCategory === 'transcript' ? 'diploma' :
                                                ['second_diploma', 'prof_development', 'certification'].includes(activeCategory) ? 'additional_edu' :
                                                    activeCategory
                                        }
                                        onChange={(e, val) => setActiveCategory(val === 'additional_edu' ? 'prof_development' : val)}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                    >
                                        {['personal_data', 'diploma', 'additional_edu', 'achievement', 'motivation', 'recommendation', 'video_presentation', 'language'].map((catKey) => {
                                            const labels = {
                                                personal_data: 'Персональные данные',
                                                diploma: 'Баз. образование',
                                                additional_edu: 'Доп. образование',
                                                achievement: 'Личные достижения',
                                                motivation: 'Мотивация',
                                                recommendation: 'Рекомендации',
                                                video_presentation: 'Вид. презентация',
                                                language: 'Сертификат АЯ',
                                            };
                                            const proc = isProcessingCategory(catKey);
                                            const err  = isErrorCategory(catKey);
                                            return (
                                                <Tab
                                                    key={catKey}
                                                    value={catKey}
                                                    label={
                                                        proc ? <span style={{ color: '#f57f17', fontWeight: 600 }}>{labels[catKey]} ●</span>
                                                        : err  ? <span style={{ color: '#d32f2f', fontWeight: 600 }}>{labels[catKey]} ✗</span>
                                                        : labels[catKey]
                                                    }
                                                />
                                            );
                                        })}
                                    </Tabs>
                                </Box>

                                <Box p={3} flexGrow={1} overflow="auto">
                                    {/* Sub-tabs Type Row (Categories like Passport/Resume or Diploma/Transcript) */}
                                    {activeCategory === 'personal_data' && (
                                        <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
                                                Просмотр PDF:
                                            </Typography>
                                            <Tabs
                                                value={personalDataDocType}
                                                onChange={(e, val) => {
                                                    setPersonalDataDocType(val);
                                                    const safeDocs = documents || [];
                                                    const doc = val === 'passport' ? safeDocs.find(d => d.file_type === 'passport') : safeDocs.find(d => d.file_type === 'resume');
                                                    setActiveDocumentId(doc ? doc.id : null);
                                                }}
                                            >
                                                <Tab label="Паспорт" value="passport" />
                                                <Tab label="Резюме" value="resume" />
                                            </Tabs>
                                        </Box>
                                    )}

                                    {['diploma', 'transcript'].includes(activeCategory) && (
                                        <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
                                                Просмотр PDF:
                                            </Typography>
                                            <Tabs
                                                value={['diploma', 'transcript'].includes(activeCategory) ? activeCategory : 'diploma'}
                                                onChange={(e, val) => {
                                                    setActiveCategory(val);
                                                    const safeDocs = documents || [];
                                                    const doc = val === 'transcript' ? safeDocs.find(d => d.file_type === 'transcript') : safeDocs.find(d => d.file_type === 'diploma');
                                                    setActiveDocumentId(doc ? doc.id : null);
                                                }}
                                            >
                                                <Tab label="Диплом" value="diploma" />
                                                <Tab label="Приложение к диплому" value="transcript" />
                                            </Tabs>
                                        </Box>
                                    )}

                                    {['second_diploma', 'prof_development', 'certification'].includes(activeCategory) && (
                                        <Box borderBottom={1} borderColor="divider" mb={2} display="flex" justifyContent="center">
                                            <Tabs value={activeCategory} onChange={(e, val) => setActiveCategory(val)} centered>
                                                <Tab label="Второй диплом" value="second_diploma" />
                                                <Tab label="Проф. развитие" value="prof_development" />
                                                <Tab label="Сертификация" value="certification" />
                                            </Tabs>
                                        </Box>
                                    )}

                                    {/* Record-level Tabs Row (for categories with multiple entries) */}
                                    {['prof_development', 'second_diploma', 'certification', 'achievement', 'recommendation'].includes(activeCategory) && (
                                        <Box borderBottom={1} borderColor="divider" mb={2} display="flex" alignItems="center">
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
                                                Просмотр PDF:
                                            </Typography>
                                            <Tabs
                                                value={activeSubTab}
                                                onChange={(e, val) => {
                                                    if (val === 'add') {
                                                        const btn = document.getElementById('upload-document-button');
                                                        if (btn) btn.click();
                                                    } else {
                                                        setActiveSubTab(val);
                                                        if (Array.isArray(data) && data[val] && data[val].document_id) {
                                                            setActiveDocumentId(data[val].document_id);
                                                        }
                                                    }
                                                }}
                                                variant="scrollable"
                                                scrollButtons="auto"
                                            >
                                                {(Array.isArray(data) ? data : []).map((item, index) => (
                                                    <Tab key={index} label={
                                                        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', position: 'relative', paddingRight: '20px' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                {activeCategory === 'achievement' ? `Достижение` :
                                                                    activeCategory === 'recommendation' ? `Рекомендация` :
                                                                        activeCategory === 'prof_development' ? 'Развитие' :
                                                                            activeCategory === 'second_diploma' ? 'Диплом' :
                                                                                activeCategory === 'certification' ? 'Сертификат' : 'Запись'}
                                                                {` #${index + 1}`}
                                                            </span>
                                                            {item.record_type && (['prof_development', 'second_diploma', 'certification'].includes(activeCategory)) && (
                                                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                                                    {item.record_type === 'work' ? 'Работа' :
                                                                        item.record_type === 'internship' ? 'Стажировка' :
                                                                            item.record_type === 'training' ? 'Повышение квалификац.' : item.record_type}
                                                                </span>
                                                            )}
                                                            {activeSubTab === index && (
                                                                <IconButton
                                                                    size="small"
                                                                    component="span"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(item.id);
                                                                    }}
                                                                    style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', padding: 2 }}
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
                                    )}

                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography color="textSecondary" variant="caption">
                                            Источник: {(() => {
                                                const currentData = Array.isArray(data) ? data[activeSubTab] : data;
                                                return currentData?.source || (activeCategory === 'transcript' ? "" : "ИИ");
                                            })()}
                                        </Typography>
                                        <Tooltip title={viewMode === "json" ? "Показать форму" : "Посмотреть JSON"}>
                                            <IconButton size="small" onClick={() => setViewMode(viewMode === "json" ? "form" : "json")}>
                                                <CodeIcon fontSize="small" color={viewMode === "json" ? "primary" : "inherit"} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {activeCategoryIsProcessing && !processingStatus && (
                                        <Box mb={2} p={1.5} display="flex" alignItems="center" gap={1} sx={{ bgcolor: 'rgba(249,168,37,0.1)', border: '1px solid #f9a825', borderRadius: 1 }}>
                                            <PendingIcon sx={{ color: '#f9a825', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: '#f57f17', fontWeight: 500 }}>
                                                Документ находится в обработке ИИ — статус: <strong>Анализ</strong>. Данные появятся автоматически после завершения.
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Banner: extraction failed — suggest manual input */}
                                    {!activeCategoryIsProcessing && isErrorCategory(activeCatKey) && activeCategory !== 'unknown' && (
                                        <Box mb={2} p={1.5} display="flex" alignItems="center" justifyContent="space-between" gap={1}
                                            sx={{ bgcolor: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.35)', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 500 }}>
                                                ИИ не смог обработать документ. Вы можете ввести данные вручную — нажмите «Редактировать».
                                            </Typography>
                                            {!isEditing && (
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    sx={{ flexShrink: 0 }}
                                                    onClick={() => {
                                                        if (!data || Object.keys(data).length === 0) {
                                                            setData({});
                                                        }
                                                        setIsEditing(true);
                                                    }}
                                                >
                                                    Редактировать
                                                </Button>
                                            )}
                                        </Box>
                                    )}

                                    {loading ? (
                                        <Typography>Загрузка данных...</Typography>
                                    ) : viewMode === "json" && activeCategory !== "unknown" ? (
                                        <pre style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
                                            {JSON.stringify(data, null, 2)}
                                        </pre>
                                    ) : (
                                        <>
                                            {activeCategory === "personal_data" && (
                                                <PersonalDataSection
                                                    data={data} setData={setData} isEditing={isEditing}
                                                    documents={documents}
                                                    personalDataDocType={personalDataDocType}
                                                    setPersonalDataDocType={setPersonalDataDocType}
                                                    setActiveDocumentId={setActiveDocumentId}
                                                    handleDeleteDocument={handleDeleteDocument}
                                                    handleSave={handleSave}
                                                    currentUser={currentUser}
                                                    applicantStatus={applicantStatus}
                                                />
                                            )}
                                            {["diploma", "transcript"].includes(activeCategory) && (
                                                <>
                                                    <EducationSection
                                                        activeCategory={activeCategory} data={data} setData={setData} isEditing={isEditing}
                                                        documents={documents}
                                                        activeDocumentId={activeDocumentId}
                                                        setActiveDocumentId={setActiveDocumentId}
                                                        handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {["prof_development", "second_diploma", "certification"].includes(activeCategory) && (
                                                <>
                                                    <AdditionalEducationSection
                                                        activeCategory={activeCategory} data={data} setData={setData} isEditing={isEditing}
                                                        activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                        setActiveDocumentId={setActiveDocumentId}
                                                        handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {activeCategory === "achievement" && (
                                                <>
                                                    <AchievementsSection
                                                        data={data} setData={setData} isEditing={isEditing}
                                                        activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                        setActiveDocumentId={setActiveDocumentId}
                                                        handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {activeCategory === "recommendation" && (
                                                <>
                                                    <RecommendationSection
                                                        data={data} setData={setData} isEditing={isEditing}
                                                        activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                        setActiveDocumentId={setActiveDocumentId}
                                                        handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {activeCategory === "motivation" && (
                                                <>
                                                    <MotivationSection
                                                        data={data} setData={setData} isEditing={isEditing}
                                                        setActiveDocumentId={setActiveDocumentId} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {activeCategory === "language" && (
                                                <>
                                                    <LanguageSection
                                                        data={data} setData={setData} isEditing={isEditing}
                                                        setActiveDocumentId={setActiveDocumentId} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}
                                            {activeCategory === "video_presentation" && (
                                                <>
                                                    <VideoSection
                                                        data={data} setData={setData} isEditing={isEditing}
                                                        setActiveDocumentId={setActiveDocumentId} handleDeleteDocument={handleDeleteDocument}
                                                        handleSave={handleSave}
                                                        currentUser={currentUser}
                                                        applicantStatus={applicantStatus}
                                                    />
                                                    <ExpertScoreSection 
                                                        applicantId={id} category={activeCategory} evaluations={evaluations} 
                                                        expertSlots={expertSlots} currentUser={currentUser} 
                                                        onRefreshEvaluations={fetchEvaluations} criteria={criteria}
                                                    />
                                                </>
                                            )}

                                        </>
                                    )}
                                </Box>

                                <Divider />
                                <Box p={2} display="flex" justifyContent={(['personal_data', 'diploma', 'transcript', 'achievement', 'recommendation'].includes(activeCategory)) && !isEditing ? "space-between" : "flex-end"} alignItems="center">
                                    {(['personal_data', 'diploma', 'transcript', 'achievement', 'recommendation'].includes(activeCategory)) && !isEditing && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => {
                                                if (activeDocumentId) handleDeleteDocument(activeDocumentId);
                                                else alert("Нет активного документа для удаления");
                                            }}
                                        >
                                            Удалить документ и данные
                                        </Button>
                                    )}
                                    <Box display="flex" gap={1}>
                                        {isEditing ? (
                                            <>
                                                <Button onClick={() => setIsEditing(false)}>Отмена</Button>
                                                <Button variant="contained" color="secondary" onClick={handleSave}>Сохранить</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="outlined" onClick={() => confirmRescan()}>Повторить сканирование</Button>
                                                {(currentUser?.role !== 'operator' || applicantStatus === 'verifying') && (
                                                    <Button variant="contained" color="primary" onClick={() => setIsEditing(true)}>Редактировать</Button>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </>
                        )}

                        {activeMainTab === 'unknown' && (
                            <Box flexGrow={1} overflow="hidden" display="flex" sx={{ minHeight: 0 }}>
                                <DocumentsSection
                                    documents={documents}
                                    handleSaveCategory={handleSaveCategory}
                                    handleDeleteDocument={handleDeleteDocument}
                                    confirmRescan={confirmRescan}
                                    setActiveDocumentId={setActiveDocumentId}
                                    getDocumentUrl={(docId) => `${config.manageApi}/v1/documents/${docId}/view?token=${getToken()}#view=FitV`}
                                    onManualEntry={(docId) =>
                                        history.push(`/app/applicants/${id}/documents/${docId}/manual-entry${programId ? `?program_id=${programId}` : ""}`)
                                    }
                                />
                            </Box>
                        )}

                        {activeMainTab === 'evaluation_form' && (
                            <ExpertEvaluationsTab
                                applicantId={id}
                                evaluations={evaluations}
                                expertSlots={expertSlots}
                                categories={criteria}
                                currentUser={currentUser}
                                allExperts={allExperts}
                                onRefreshSlots={fetchExpertSlots}
                                onRefreshEvaluations={fetchEvaluations}
                                mode="form"
                            />
                        )}

                        {activeMainTab === 'evaluation_summary' && (
                            <ExpertEvaluationsTab
                                applicantId={id}
                                evaluations={evaluations}
                                expertSlots={expertSlots}
                                categories={criteria}
                                currentUser={currentUser}
                                allExperts={allExperts}
                                onRefreshSlots={fetchExpertSlots}
                                onRefreshEvaluations={fetchEvaluations}
                                mode="summary"
                                scoringScheme={scoringScheme}
                                onChangeScheme={updateScoringScheme}
                            />
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Hidden Input for Document Upload */}
            <input
                type="file"
                id="upload-document-button"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (activeCategory === 'prof_development') {
                            setPendingFile(file);
                            setUploadTypeDialogOpen(true);
                        } else if (activeCategory === 'personal_data') {
                            // Use the currently selected tab (passport/resume) as the doc_type
                            uploadDocumentWithData(file, personalDataDocType);
                        } else {
                            uploadDocumentWithData(file);
                        }
                    }
                    // Reset input so searching for the same file again works
                    e.target.value = '';
                }}
            />

            <Dialog open={uploadTypeDialogOpen} onClose={() => setUploadTypeDialogOpen(false)}>
                <DialogTitle>Тип документа</DialogTitle>
                <DialogContent>
                    <DialogContentText>Выберите тип записи для проф. развития:</DialogContentText>
                    <Box mt={2} display="flex" flexDirection="column" gap={1}>
                        <Button variant="outlined" onClick={() => { uploadDocumentWithData(pendingFile, 'work'); setUploadTypeDialogOpen(false); }}>Работа</Button>
                        <Button variant="outlined" onClick={() => { uploadDocumentWithData(pendingFile, 'internship'); setUploadTypeDialogOpen(false); }}>Стажировка</Button>
                        <Button variant="outlined" onClick={() => { uploadDocumentWithData(pendingFile, 'training'); setUploadTypeDialogOpen(false); }}>Повышение квалификации</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadTypeDialogOpen(false)}>Отмена</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={Boolean(notification)}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {notification && (
                    <Alert onClose={() => setNotification(null)} severity={notification.severity} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                )}
            </Snackbar>
        </>
    );
}

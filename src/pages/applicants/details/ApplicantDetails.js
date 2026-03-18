import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, LinearProgress, Paper, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
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

// hook
import { useApplicantDetails } from "./hooks/useApplicantDetails";

export default function ApplicantDetails() {
    const theme = useTheme();
    const { id } = useParams();
    const location = useLocation();

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
        fetchData,
        fetchDocuments
    } = useApplicantDetails(id, activeCategory);

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
                    <Button variant="contained" color="error" onClick={handleDeleteApplicant}>
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
                >
                    <Tab label="Информация" value="info" />
                    <Tab label="Оценки экспертов" value="evaluations" />
                </Tabs>
            </Box>
            <Grid container spacing={2} style={{ height: "calc(100vh - 200px)" }}>
                {/* Left Side: Document Viewer */}
                <Grid item xs={6}>
                    <Paper elevation={3} style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <Box p={1.5} bgcolor="primary.main" color="white" display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Оригинал документа</Typography>
                            <Button 
                                variant="contained" 
                                color="secondary" 
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    const docExists = activeDocumentId && (documents || []).some(d => d.id === activeDocumentId);
                                    if (docExists) {
                                        handleDeleteDocument(activeDocumentId).then(() => {
                                            const btn = document.getElementById('upload-document-button');
                                            if (btn) btn.click();
                                        }).catch(() => {}); // Do nothing on cancel/error
                                    } else {
                                        const btn = document.getElementById('upload-document-button');
                                        if (btn) btn.click();
                                    }
                                }}
                            >
                                {activeDocumentId && (documents || []).some(d => d.id === activeDocumentId) ? "Заменить" : "Загрузить"}
                            </Button>
                        </Box>
                        <iframe
                            key={activeDocumentId || activeCategory}
                            src={activeDocumentId
                                ? `${config.manageApi}/v1/documents/${activeDocumentId}/view#view=FitV`
                                : `${config.manageApi}/v1/applicants/${id}/documents/view?category=${activeCategory === 'personal_data' ? personalDataDocType : activeCategory}${activeCategory === 'personal_data' ? `&doc_type=${personalDataDocType}` : ''}#view=FitV`}
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
                                        <Tab label="Персональные данные" value="personal_data" />
                                        <Tab label="Баз. образование" value="diploma" />
                                        <Tab label="Доп. образование" value="additional_edu" />
                                        <Tab label="Личные достижения" value="achievement" />
                                        <Tab label="Мотивация" value="motivation" />
                                        <Tab label="Рекомендации" value="recommendation" />
                                        <Tab label="Сертификат АЯ" value="language" />
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
                                                value={activeDocumentId === (documents || []).find(d => d.file_type === 'transcript')?.id ? 'transcript' : 'diploma'}
                                                onChange={(e, val) => {
                                                    const safeDocs = documents || [];
                                                    const doc = val === 'transcript' ? safeDocs.find(d => d.file_type === 'transcript') : safeDocs.find(d => d.file_type === 'diploma');
                                                    if (doc) setActiveDocumentId(doc.id);
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

                                    {processingStatus && (
                                        <Box mt={2} mb={4} p={2} component={Paper} variant="outlined" style={{ backgroundColor: '#fafafa' }}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                {["Загрузка", "Подготовка", "ИИ анализ (1-2 мин)", "Завершение"].map((label, idx) => (
                                                    <Typography key={idx} variant="caption" style={{ fontWeight: progress >= (idx * 25) ? 700 : 400 }}>
                                                        {label}
                                                    </Typography>
                                                ))}
                                            </Box>
                                            <LinearProgress variant="determinate" value={progress} color={processingStatus === 'completed' ? 'success' : 'primary'} />
                                        </Box>
                                    )}

                                    {loading ? (
                                        <Typography>Загрузка данных...</Typography>
                                    ) : viewMode === "json" ? (
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
                                                />
                                            )}
                                            {["diploma", "transcript"].includes(activeCategory) && (
                                                <EducationSection
                                                    activeCategory={activeCategory} data={data} setData={setData} isEditing={isEditing}
                                                    documents={documents}
                                                    activeDocumentId={activeDocumentId}
                                                    setActiveDocumentId={setActiveDocumentId}
                                                    handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}
                                            {["prof_development", "second_diploma", "certification"].includes(activeCategory) && (
                                                <AdditionalEducationSection
                                                    activeCategory={activeCategory} data={data} setData={setData} isEditing={isEditing}
                                                    activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                    setActiveDocumentId={setActiveDocumentId}
                                                    handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}
                                            {activeCategory === "achievement" && (
                                                <AchievementsSection
                                                    data={data} setData={setData} isEditing={isEditing}
                                                    activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                    setActiveDocumentId={setActiveDocumentId}
                                                    handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}
                                            {activeCategory === "recommendation" && (
                                                <RecommendationSection
                                                    data={data} setData={setData} isEditing={isEditing}
                                                    activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
                                                    setActiveDocumentId={setActiveDocumentId}
                                                    handleDelete={handleDelete} handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}
                                            {activeCategory === "motivation" && (
                                                <MotivationSection
                                                    data={data} setData={setData} isEditing={isEditing}
                                                    setActiveDocumentId={setActiveDocumentId} handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}
                                            {activeCategory === "language" && (
                                                <LanguageSection
                                                    data={data} setData={setData} isEditing={isEditing}
                                                    setActiveDocumentId={setActiveDocumentId} handleDeleteDocument={handleDeleteDocument}
                                                />
                                            )}

                                            <ExpertScoreSection
                                                applicantId={id} category={activeCategory}
                                                currentUser={currentUser} expertSlots={expertSlots}
                                                evaluations={evaluations} onSaved={fetchEvaluations}
                                            />
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
                                                <Button variant="contained" color="primary" onClick={() => setIsEditing(true)}>Редактировать</Button>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <ExpertEvaluationsTab
                                evaluations={evaluations} expertSlots={expertSlots}
                                categories={[
                                    { id: 'personal_data', label: 'Персональные данные' },
                                    { id: 'diploma', label: 'Базовое образование' },
                                    { id: 'achievement', label: 'Личные достижения' },
                                    { id: 'prof_development', label: 'Проф. развитие' },
                                    { id: 'recommendation', label: 'Рекомендации' },
                                    { id: 'motivation', label: 'Мотивация' },
                                    { id: 'language', label: 'Сертификат АЯ' }
                                ]}
                                currentUser={currentUser}
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
        </>
    );
}

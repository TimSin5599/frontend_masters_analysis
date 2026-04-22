import {
    Box, Button, CircularProgress, Divider, Grid, IconButton,
    Paper, Tab, Tabs, TextField, Typography, Alert
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import config from "../../../../config";
import { getToken } from "../../../../utils/tokenManager";
import { useUserState } from "../../../../context/UserContext";

// ── Field helpers ─────────────────────────────────────────────────────────────

function TextField2({ label, value, onChange, xs = 6, type = "text", multiline = false, rows = 3 }) {
    return (
        <Grid item xs={xs}>
            <TextField
                label={label}
                fullWidth
                variant="outlined"
                size="small"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                type={type}
                multiline={multiline}
                rows={multiline ? rows : undefined}
            />
        </Grid>
    );
}

// ── Per-category form panels ──────────────────────────────────────────────────

function PassportForm({ data, setData }) {
    const s = (key) => (val) => setData({ ...data, [key]: val });
    return (
        <Grid container spacing={2}>
            <TextField2 label="Имя"          xs={4} value={data.name}            onChange={s("name")} />
            <TextField2 label="Фамилия"      xs={4} value={data.surname}         onChange={s("surname")} />
            <TextField2 label="Отчество"     xs={4} value={data.patronymic}      onChange={s("patronymic")} />
            <TextField2 label="Гражданство"  xs={4} value={data.nationality}     onChange={s("nationality")} />
            <TextField2 label="Пол"          xs={4} value={data.gender}          onChange={s("gender")} />
            <TextField2 label="Номер документа" xs={4} value={data.document_number} onChange={s("document_number")} />
            <TextField2 label="Дата рождения"   xs={6} value={data.date_of_birth}   onChange={s("date_of_birth")} />
            <TextField2 label="Email"           xs={6} value={data.email}           onChange={s("email")} />
            <TextField2 label="Телефон"         xs={6} value={data.phone}           onChange={s("phone")} />
        </Grid>
    );
}

function DiplomaForm({ data, setData }) {
    const s = (key) => (val) => setData({ ...data, [key]: val });
    return (
        <Grid container spacing={2}>
            <TextField2 label="Учебное заведение"         xs={12} value={data.institution_name}     onChange={s("institution_name")} />
            <TextField2 label="Степень"                   xs={6}  value={data.degree_title}          onChange={s("degree_title")} />
            <TextField2 label="Специальность"             xs={6}  value={data.major}                 onChange={s("major")} />
            <TextField2 label="Номер диплома"             xs={6}  value={data.diploma_serial_number} onChange={s("diploma_serial_number")} />
            <TextField2 label="Дата выдачи"               xs={6}  value={data.graduation_date}       onChange={s("graduation_date")} />
            <Grid item xs={12}><Divider /></Grid>
            <Grid item xs={12}><Typography variant="subtitle2">Успеваемость (Выписка)</Typography></Grid>
            <TextField2 label="CGPA"              xs={4} type="number" value={data.cumulative_gpa}   onChange={s("cumulative_gpa")} />
            <TextField2 label="Итоговая оценка"  xs={4}              value={data.cumulative_grade}   onChange={s("cumulative_grade")} />
            <TextField2 label="Всего семестров"  xs={4} type="number" value={data.total_semesters}   onChange={s("total_semesters")} />
            <TextField2 label="Макс. кредитов"   xs={6} type="number" value={data.total_credits}     onChange={s("total_credits")} />
            <TextField2 label="Полученные кредиты" xs={6} type="number" value={data.obtained_credits} onChange={s("obtained_credits")} />
        </Grid>
    );
}

function ListForm({ data, setData, renderRow, emptyRow }) {
    const addRow = () => setData([...data, { ...emptyRow }]);
    const removeRow = (idx) => setData(data.filter((_, i) => i !== idx));
    const updateRow = (idx, patch) => {
        const next = [...data];
        next[idx] = { ...next[idx], ...patch };
        setData(next);
    };

    return (
        <Box>
            {data.map((row, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, position: "relative" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle2" color="primary">Запись #{idx + 1}</Typography>
                        <IconButton size="small" color="error" onClick={() => removeRow(idx)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    {renderRow(row, (patch) => updateRow(idx, patch))}
                </Paper>
            ))}
            <Button startIcon={<AddIcon />} onClick={addRow} variant="outlined" size="small">
                Добавить запись
            </Button>
        </Box>
    );
}

function WorkForm({ data, setData }) {
    return (
        <ListForm
            data={data}
            setData={setData}
            emptyRow={{ company_name: "", position: "", city: "", country: "", start_date: "", end_date: "" }}
            renderRow={(row, update) => (
                <Grid container spacing={2}>
                    <TextField2 label="Организация"   xs={12} value={row.company_name} onChange={v => update({ company_name: v })} />
                    <TextField2 label="Должность"     xs={12} value={row.position}     onChange={v => update({ position: v })} />
                    <TextField2 label="Город"         xs={6}  value={row.city}         onChange={v => update({ city: v })} />
                    <TextField2 label="Страна"        xs={6}  value={row.country}      onChange={v => update({ country: v })} />
                    <TextField2 label="Дата начала"   xs={6}  value={row.start_date}   onChange={v => update({ start_date: v })} />
                    <TextField2 label="Дата окончания" xs={6} value={row.end_date}     onChange={v => update({ end_date: v })} />
                </Grid>
            )}
        />
    );
}

function AchievementForm({ data, setData }) {
    return (
        <ListForm
            data={data}
            setData={setData}
            emptyRow={{ achievement_type: "", achievement_title: "", date_received: "" }}
            renderRow={(row, update) => (
                <Grid container spacing={2}>
                    <TextField2 label="Тип достижения"         xs={12} value={row.achievement_type}  onChange={v => update({ achievement_type: v })} />
                    <TextField2 label="Наименование"           xs={12} value={row.achievement_title} onChange={v => update({ achievement_title: v })} />
                    <TextField2 label="Дата вручения"          xs={6}  value={row.date_received}     onChange={v => update({ date_received: v })} />
                </Grid>
            )}
        />
    );
}

function SimpleForm({ data, setData }) {
    const s = (key) => (val) => setData({ ...data, [key]: val });
    return (
        <Grid container spacing={2}>
            <TextField2 label="Наименование / Название" xs={12} value={data.title}       onChange={s("title")} />
            <TextField2 label="Организация / Источник" xs={12}  value={data.institution}  onChange={s("institution")} />
            <TextField2 label="Дата"                   xs={6}   value={data.date}         onChange={s("date")} />
            <TextField2 label="Описание"               xs={12}  multiline value={data.description} onChange={s("description")} />
        </Grid>
    );
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
    passport:         "Паспорт / Личные данные",
    resume:           "Резюме",
    diploma:          "Диплом",
    transcript:       "Выписка из диплома",
    work:             "Трудовая деятельность",
    achievement:      "Достижение",
    certification:    "Сертификация",
    second_diploma:   "Второй диплом",
    recommendation:   "Рекомендация",
    motivation:       "Мотивация",
    language:         "Сертификат языка",
    prof_development: "Проф. развитие",
    unknown:          "Документ",
};

const ARRAY_CATEGORIES = new Set(["work", "achievement", "certification", "prof_development", "second_diploma", "recommendation"]);

// ── Main component ────────────────────────────────────────────────────────────

export default function ManualEntryPage() {
    const { id, docId } = useParams();
    const history = useHistory();
    const { search } = useLocation();
    const { currentUser } = useUserState();
    const programId = new URLSearchParams(search).get("program_id") || "";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [fileType, setFileType] = useState(null);

    // Form state per category
    const [passportData, setPassportData] = useState({});
    const [diplomaData, setDiplomaData] = useState({});
    const [workData, setWorkData] = useState([]);
    const [achievementData, setAchievementData] = useState([]);

    // Active tab for resume multi-form
    const [resumeTab, setResumeTab] = useState(0);

    // ── On mount: load document + existing data ───────────────────────────────
    useEffect(() => {
        setLoading(true);
        setError(null);

        axios.get(`${config.manageApi}/v1/applicants/${id}/documents`)
            .then(res => {
                const docs = res.data || [];
                const doc = docs.find(d => String(d.id) === String(docId));
                if (!doc) {
                    setError("Документ не найден.");
                    setLoading(false);
                    return;
                }
                const ft = doc.file_type || "unknown";
                setFileType(ft);
                return loadCategoryData(ft);
            })
            .catch(err => {
                console.error(err);
                setError("Не удалось загрузить данные документа.");
                setLoading(false);
            });
    }, [id, docId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadCategoryData = async (ft) => {
        try {
            if (ft === "resume") {
                const [ppRes, workRes, achRes, dipRes] = await Promise.allSettled([
                    axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=passport`),
                    axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=work`),
                    axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=achievement`),
                    axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=diploma`),
                ]);
                setPassportData(ppRes.status === "fulfilled" ? (ppRes.value.data || {}) : {});
                setWorkData(workRes.status === "fulfilled" ? (workRes.value.data?.records || workRes.value.data || []) : []);
                setAchievementData(achRes.status === "fulfilled" ? (achRes.value.data?.records || achRes.value.data || []) : []);
                setDiplomaData(dipRes.status === "fulfilled" ? (dipRes.value.data || {}) : {});
            } else {
                const res = await axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=${ft}`);
                const d = res.data;
                if (ARRAY_CATEGORIES.has(ft)) {
                    const arr = Array.isArray(d) ? d : (d?.records || []);
                    if (ft === "work") setWorkData(arr);
                    else if (ft === "achievement") setAchievementData(arr);
                    else setWorkData(arr); // generic fallback stored in workData
                } else if (ft === "passport") {
                    setPassportData(d || {});
                } else if (ft === "diploma" || ft === "transcript") {
                    setDiplomaData(d || {});
                } else {
                    setPassportData(d || {}); // generic scalar stored in passportData
                }
            }
        } catch (err) {
            console.error("Failed to pre-fill data:", err);
            // Non-fatal: form starts empty
        }
        setLoading(false);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        // Build user metadata for source attribution
        let userMeta = {};
        if (currentUser) {
            let roleLabel = "оператор";
            if (currentUser.role === "admin")   roleLabel = "админ";
            if (currentUser.role === "manager") roleLabel = "менеджер";
            if (currentUser.role === "expert")  roleLabel = "эксперт";
            userMeta = {
                role:       roleLabel,
                first_name: currentUser.firstName  || "",
                last_name:  currentUser.lastName   || "",
                patronymic: currentUser.patronymic || "",
            };
        }

        try {
            const patchData = (category, payload) =>
                axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=${category}`, { ...payload, ...userMeta });

            if (fileType === "resume") {
                await patchData("passport",    passportData);
                await patchData("work",        { records: workData });
                await patchData("achievement", { records: achievementData });
                await patchData("diploma",     diplomaData);
                await patchData("transcript",  diplomaData);
            } else if (fileType === "passport") {
                await patchData("passport", passportData);
            } else if (fileType === "diploma" || fileType === "transcript") {
                await patchData("diploma",    diplomaData);
                await patchData("transcript", diplomaData);
            } else if (ARRAY_CATEGORIES.has(fileType)) {
                const arr = fileType === "work" ? workData : fileType === "achievement" ? achievementData : workData;
                await patchData(fileType, { records: arr });
            } else {
                await patchData(fileType, passportData);
            }

            // Mark document as completed
            await axios.patch(`${config.manageApi}/v1/documents/${docId}/status`, { status: "completed" });

            setSuccess(true);
            setTimeout(() => {
                const dest = programId
                    ? `/app/applicants/${id}?program_id=${programId}`
                    : `/app/applicants/${id}`;
                history.push(dest);
            }, 1200);
        } catch (err) {
            console.error(err);
            setError("Ошибка при сохранении данных. Проверьте введённые значения.");
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const categoryLabel = CATEGORY_LABELS[fileType] || fileType;

    const renderFormBody = () => {
        if (fileType === "resume") {
            return (
                <Box>
                    <Tabs value={resumeTab} onChange={(_, v) => setResumeTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
                        <Tab label="Личные данные" />
                        <Tab label="Опыт работы" />
                        <Tab label="Достижения" />
                        <Tab label="Образование" />
                    </Tabs>
                    {resumeTab === 0 && <PassportForm    data={passportData}    setData={setPassportData} />}
                    {resumeTab === 1 && <WorkForm        data={workData}        setData={setWorkData} />}
                    {resumeTab === 2 && <AchievementForm data={achievementData} setData={setAchievementData} />}
                    {resumeTab === 3 && <DiplomaForm     data={diplomaData}     setData={setDiplomaData} />}
                </Box>
            );
        }
        if (fileType === "passport") {
            return <PassportForm data={passportData} setData={setPassportData} />;
        }
        if (fileType === "diploma" || fileType === "transcript") {
            return <DiplomaForm data={diplomaData} setData={setDiplomaData} />;
        }
        if (fileType === "work" || fileType === "prof_development") {
            return <WorkForm data={workData} setData={setWorkData} />;
        }
        if (fileType === "achievement" || fileType === "certification") {
            return <AchievementForm data={achievementData} setData={setAchievementData} />;
        }
        return <SimpleForm data={passportData} setData={setPassportData} />;
    };

    return (
        <Box display="flex" flexDirection="column" sx={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
            {/* Top header bar */}
            <Box
                display="flex" alignItems="center" gap={2} px={2} py={1}
                sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0, bgcolor: "background.paper" }}
            >
                <IconButton onClick={() => history.goBack()} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Box flex={1}>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        Ручной ввод данных
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Категория: <strong>{categoryLabel}</strong> · Документ #{docId}
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || success}
                    >
                        {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                    <Button variant="outlined" onClick={() => history.goBack()} disabled={saving}>
                        Отмена
                    </Button>
                </Box>
            </Box>

            {/* Split pane */}
            <Box display="flex" flex={1} sx={{ minHeight: 0, overflow: "hidden" }}>
                {/* Left: PDF viewer */}
                <Box sx={{
                    width: "50%",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderRight: 1,
                    borderColor: "divider",
                }}>
                    <Box px={2} py={1} bgcolor="primary.main" color="white" sx={{ flexShrink: 0 }}>
                        <Typography variant="subtitle2">Оригинал документа</Typography>
                    </Box>
                    <iframe
                        key={docId}
                        src={`${config.manageApi}/v1/documents/${docId}/view?token=${getToken()}#view=FitV`}
                        style={{ border: "none", flexGrow: 1, width: "100%", display: "block" }}
                        title="Document Viewer"
                    />
                </Box>

                {/* Right: form */}
                <Box sx={{ flex: 1, overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                    {error   && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">Данные сохранены. Перенаправление...</Alert>}

                    <Alert severity="info" sx={{ flexShrink: 0 }}>
                        ИИ не смог автоматически извлечь данные из этого документа. Заполните форму вручную
                        и нажмите «Сохранить». После сохранения документ будет отмечен как завершённым.
                    </Alert>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        {renderFormBody()}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

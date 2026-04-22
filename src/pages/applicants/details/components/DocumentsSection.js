import {
    Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem,
    Select, Typography, IconButton, Chip, Tooltip
} from "@mui/material";
import { useState, useEffect } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import EditNoteIcon from '@mui/icons-material/EditNote';

// ── Status helpers ────────────────────────────────────────────────────────────

/** Statuses that are still in-flight (spinner / yellow) */
const IN_FLIGHT = new Set(['pending', 'classifying', 'classified', 'extracting', 'processing']);

/** Statuses that represent a recoverable error */
const ERROR_STATUSES = new Set(['classification_failed', 'extraction_failed', 'failed']);

const STATUS_META = {
    pending:               { label: 'Ожидание',              color: '#f9a825', icon: 'pending' },
    classifying:           { label: 'Классификация...',      color: '#f9a825', icon: 'pending' },
    classified:            { label: 'Классифицирован',       color: '#1565c0', icon: 'classified' },
    extracting:            { label: 'Извлечение...',         color: '#f9a825', icon: 'pending' },
    completed:             { label: 'Проанализирован',       color: 'success', icon: 'ok' },
    classification_failed: { label: 'Ошибка классификации',  color: 'error',   icon: 'error' },
    extraction_failed:     { label: 'Ошибка извлечения',     color: 'error',   icon: 'error' },
    failed:                { label: 'Ошибка',                color: 'error',   icon: 'error' },
    processing:            { label: 'Анализ',                color: '#f9a825', icon: 'pending' },
};

const CATEGORY_LABELS = {
    passport:         'Паспорт',
    resume:           'Резюме',
    diploma:          'Диплом',
    work:             'Трудовая деятельность',
    transcript:       'Приложение к диплому',
    second_diploma:   'Второй диплом',
    certification:    'Сертификация',
    achievement:      'Достижение',
    recommendation:   'Рекомендация',
    motivation:       'Мотивация',
    language:         'Сертификат АЯ',
    prof_development: 'Проф. развитие',
    unknown:          'Нераспознано',
};

const CATEGORY_OPTIONS = [
    'passport', 'resume', 'diploma', 'transcript', 'second_diploma',
    'prof_development', 'work', 'certification', 'achievement',
    'recommendation', 'motivation', 'language',
];

// ── Section definitions ────────────────────────────────────────────────────────

const SECTIONS = [
    {
        key:      'errors',
        label:    'Ошибки',
        statuses: new Set(['extraction_failed', 'classification_failed', 'failed']),
        color:    '#d32f2f',
    },
    {
        key:      'processing',
        label:    'Обработка',
        statuses: new Set(['classifying', 'extracting', 'classified']),
        color:    '#1565c0',
    },
    {
        key:      'waiting',
        label:    'Ожидание',
        statuses: new Set(['pending', 'processing']),
        color:    '#e65100',
    },
    {
        key:      'completed',
        label:    'Завершено',
        statuses: new Set(['completed']),
        color:    '#2e7d32',
    },
];

function StatusIcon({ doc }) {
    const meta = STATUS_META[doc.status] || STATUS_META.pending;

    if (meta.icon === 'ok') {
        return <Tooltip title="Проанализирован"><CheckCircleIcon color="success" /></Tooltip>;
    }
    if (meta.icon === 'classified') {
        return <Tooltip title="Классифицирован, ожидает извлечения"><CheckCircleIcon sx={{ color: '#1565c0' }} /></Tooltip>;
    }
    if (meta.icon === 'error') {
        const tip = doc.status === 'classification_failed'
            ? 'Классификация не удалась — выберите категорию вручную'
            : doc.status === 'extraction_failed' || doc.status === 'failed'
                ? 'Извлечение данных не удалось — введите данные вручную'
                : 'Ошибка обработки';
        return <Tooltip title={tip}><ErrorIcon color="error" /></Tooltip>;
    }
    return <Tooltip title={meta.label}><PendingIcon sx={{ color: '#f9a825' }} /></Tooltip>;
}

function StatusChip({ doc }) {
    const isInFlight = IN_FLIGHT.has(doc.status);
    const isError    = ERROR_STATUSES.has(doc.status);
    const meta       = STATUS_META[doc.status];

    const label = isInFlight
        ? (meta?.label || 'Анализ')
        : (meta?.label || CATEGORY_LABELS[doc.file_type] || doc.file_type);

    return (
        <Chip
            label={label}
            size="small"
            color={isError ? 'error' : 'default'}
            variant="outlined"
            sx={{
                maxWidth: 196,
                ...(isInFlight && { borderColor: '#f9a825', color: '#f57f17' }),
                ...(doc.status === 'classified' && { borderColor: '#1565c0', color: '#1565c0' }),
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
            }}
        />
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentsSection({
    documents,
    handleSaveCategory,
    handleDeleteDocument,
    confirmRescan,
    setActiveDocumentId,
    getDocumentUrl,
    onManualEntry,
}) {
    const [selectedCategories, setSelectedCategories] = useState({});
    const [editingDocs, setEditingDocs] = useState({});
    const [previewDocId, setPreviewDocId] = useState(null);

    useEffect(() => {
        const initial = {};
        (documents || []).forEach(doc => { initial[doc.id] = doc.file_type; });
        setSelectedCategories(prev => ({ ...initial, ...prev }));
    }, [documents]);

    useEffect(() => {
        (documents || []).forEach(doc => {
            if (doc.status === 'classification_failed') {
                setEditingDocs(prev => prev[doc.id] ? prev : { ...prev, [doc.id]: true });
            }
        });
    }, [documents]);

    const startEditing  = (docId) => setEditingDocs(prev => ({ ...prev, [docId]: true }));
    const cancelEditing = (docId, originalType) => {
        setSelectedCategories(prev => ({ ...prev, [docId]: originalType }));
        setEditingDocs(prev => ({ ...prev, [docId]: false }));
    };
    const confirmSave = (docId) => {
        handleSaveCategory(docId, selectedCategories[docId]);
        setEditingDocs(prev => ({ ...prev, [docId]: false }));
    };

    const handleDocClick = (docId) => {
        setPreviewDocId(docId);
        setActiveDocumentId(docId);
    };

    const allDocs = documents || [];

    if (allDocs.length === 0) {
        return (
            <Box p={3} textAlign="center" width="100%">
                <Typography variant="body1" color="textSecondary">Документы еще не загружены.</Typography>
            </Box>
        );
    }

    const renderDocCard = (doc) => {
        const isInFlight             = IN_FLIGHT.has(doc.status);
        const isClassificationFailed = doc.status === 'classification_failed';
        const isExtractionFailed     = doc.status === 'extraction_failed' || doc.status === 'failed';
        const isEditing              = !!editingDocs[doc.id];

        const borderColor = previewDocId === doc.id
            ? 'primary.main'
            : isClassificationFailed || isExtractionFailed
                ? 'error.light'
                : isInFlight
                    ? '#f9a825'
                    : 'divider';
        const bgcolor = isClassificationFailed || isExtractionFailed
            ? 'rgba(211,47,47,0.04)'
            : isInFlight
                ? 'rgba(249,168,37,0.06)'
                : previewDocId === doc.id
                    ? 'rgba(25,118,210,0.04)'
                    : 'inherit';

        return (
            <Card
                key={doc.id}
                variant="outlined"
                sx={{ '&:hover': { borderColor: 'primary.main' }, borderColor, bgcolor, transition: 'all 0.2s' }}
            >
                <CardContent sx={{ pb: '16px !important' }}>

                    {/* ── Classification-failed banner ── */}
                    {isClassificationFailed && (
                        <Box mb={1.5} p={1} sx={{ bgcolor: 'rgba(211,47,47,0.08)', borderRadius: 1, border: '1px solid rgba(211,47,47,0.3)' }}>
                            <Typography variant="caption" color="error.dark" fontWeight={600}>
                                ИИ не смог классифицировать документ. Выберите категорию из списка ниже и нажмите ✓ для запуска извлечения данных.
                            </Typography>
                        </Box>
                    )}

                    {/* ── Extraction-failed banner ── */}
                    {isExtractionFailed && (
                        <Box mb={1.5} p={1} sx={{ bgcolor: 'rgba(211,47,47,0.08)', borderRadius: 1, border: '1px solid rgba(211,47,47,0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditNoteIcon color="error" fontSize="small" sx={{ flexShrink: 0 }} />
                            <Typography variant="caption" color="error.dark" fontWeight={600}>
                                ИИ не смог извлечь данные из «<strong>{CATEGORY_LABELS[doc.file_type] || doc.file_type}</strong>».
                            </Typography>
                        </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={1.5}>

                        {/* Status icon */}
                        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            <StatusIcon doc={doc} />
                        </Box>

                        {/* Filename + date */}
                        <Box
                            sx={{ flex: '1 1 0', minWidth: 0, cursor: 'pointer' }}
                            onClick={() => handleDocClick(doc.id)}
                        >
                            <Tooltip title={doc.file_name} placement="top-start">
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                                >
                                    {doc.file_name}
                                </Typography>
                            </Tooltip>
                            <Typography variant="caption" color="textSecondary" noWrap>
                                {new Date(doc.uploaded_at).toLocaleString()}
                            </Typography>
                        </Box>

                        {/* Category chip or select */}
                        <Box sx={{ flexShrink: 0, width: 200 }}>
                            {isEditing ? (
                                <FormControl size="small" fullWidth disabled={isInFlight}>
                                    <InputLabel>Категория</InputLabel>
                                    <Select
                                        value={selectedCategories[doc.id] || ''}
                                        label="Категория"
                                        onChange={e => setSelectedCategories(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                        autoFocus
                                    >
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <MenuItem key={opt} value={opt}>{CATEGORY_LABELS[opt]}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Box display="flex" justifyContent="center">
                                    <StatusChip doc={doc} />
                                </Box>
                            )}
                        </Box>

                        {/* Manual entry button for extraction_failed */}
                        {isExtractionFailed && !isEditing && onManualEntry && (
                            <Tooltip title="Ввести данные вручную">
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    startIcon={<EditNoteIcon />}
                                    onClick={() => onManualEntry(doc.id)}
                                    sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                                >
                                    Ввести вручную
                                </Button>
                            </Tooltip>
                        )}

                        {/* Action buttons */}
                        {isEditing ? (
                            <>
                                <Tooltip title="Сохранить и запустить извлечение">
                                    <span>
                                        <IconButton
                                            color="success"
                                            size="small"
                                            disabled={isInFlight || !selectedCategories[doc.id] || selectedCategories[doc.id] === 'unknown'}
                                            onClick={() => confirmSave(doc.id)}
                                            sx={{ flexShrink: 0 }}
                                        >
                                            <CheckIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Отмена">
                                    <IconButton size="small" onClick={() => cancelEditing(doc.id, doc.file_type)} sx={{ flexShrink: 0 }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={isInFlight}
                                onClick={() => startEditing(doc.id)}
                                sx={{ flexShrink: 0, width: 100, whiteSpace: 'nowrap' }}
                            >
                                Изменить
                            </Button>
                        )}

                        {/* Reprocess */}
                        <Tooltip title="Повторная обработка">
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={isInFlight}
                                    onClick={() => confirmRescan(doc.id)}
                                    sx={{ flexShrink: 0 }}
                                >
                                    <ReplayIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>

                        {/* Delete */}
                        <IconButton onClick={() => handleDeleteDocument(doc.id)} color="error" size="small" sx={{ flexShrink: 0 }}>
                            <DeleteIcon />
                        </IconButton>

                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box display="flex" width="100%" height="100%" overflow="hidden" sx={{ minHeight: 0 }}>

            {/* Left: PDF preview */}
            <Box sx={{
                width: '45%',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid',
                borderColor: 'divider',
                minHeight: 0,
            }}>
                <Box px={2} py={1.5} bgcolor="primary.main" color="white" sx={{ flexShrink: 0 }}>
                    <Typography variant="h6" fontSize={15}>Просмотр документа</Typography>
                </Box>
                {previewDocId && getDocumentUrl ? (
                    <iframe
                        key={previewDocId}
                        src={getDocumentUrl(previewDocId)}
                        style={{ border: 'none', flexGrow: 1, width: '100%', display: 'block' }}
                        title="Document Preview"
                    />
                ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" flexGrow={1}>
                        <Typography variant="body2" color="textSecondary">
                            Выберите документ из списка для просмотра
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Right: document sections */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {SECTIONS.map(section => {
                        const sectionDocs = allDocs.filter(d => section.statuses.has(d.status));
                        if (sectionDocs.length === 0) return null;

                        return (
                            <Box key={section.key}>
                                {/* Section header */}
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1.5}
                                    mb={1.5}
                                    pl={1.5}
                                    sx={{
                                        borderLeft: `4px solid ${section.color}`,
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight={700} color={section.color}>
                                        {section.label}
                                    </Typography>
                                    <Chip
                                        label={sectionDocs.length}
                                        size="small"
                                        sx={{
                                            bgcolor: section.color,
                                            color: '#fff',
                                            fontWeight: 700,
                                            height: 20,
                                            '& .MuiChip-label': { px: 1 },
                                        }}
                                    />
                                </Box>

                                {/* Cards */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {sectionDocs.map(renderDocCard)}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

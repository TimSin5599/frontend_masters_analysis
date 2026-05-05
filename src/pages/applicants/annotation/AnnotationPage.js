import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { Box, Button, CircularProgress, Divider, LinearProgress, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import config from '../../../config';
import PageTitle from '../../../components/PageTitle/PageTitle';
import { getToken } from '../../../utils/tokenManager';

export default function AnnotationPage() {
    const { id } = useParams();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const programId = queryParams.get('program_id') || queryParams.get('?program_id');

    const [annotation, setAnnotation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generated, setGenerated] = useState(false);
    const [copied, setCopied] = useState(false);

    const esRef = useRef(null);
    // Tracks whether a final result (done/error) was already received.
    // Prevents onerror (fired by EventSource on connection-close) from
    // overwriting a successfully received annotation.
    const completedRef = useRef(false);

    const closeStream = () => {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }
    };

    useEffect(() => () => closeStream(), []);

    const handleGenerate = () => {
        closeStream();
        completedRef.current = false;
        setLoading(true);
        setError('');
        setAnnotation('');
        setGenerated(false);

        const regenerate = generated ? '&regenerate=true' : '';
        const url = `${config.manageApi}/v1/applicants/${id}/annotation/stream?token=${getToken()}${regenerate}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.addEventListener('done', (e) => {
            // Mark completed first so that the onerror handler (fired by
            // EventSource when the server closes the connection) is a no-op.
            completedRef.current = true;
            closeStream();
            try {
                const data = JSON.parse(e.data);
                setAnnotation(data.annotation || '');
                setGenerated(true);
            } catch {
                setError('Не удалось обработать ответ сервера');
            }
            setLoading(false);
        });

        // Server-sent event: error (AI job failed).
        // Named "annotation_error" to avoid collision with the built-in
        // EventSource connection-level error event.
        es.addEventListener('annotation_error', (e) => {
            completedRef.current = true;
            closeStream();
            try {
                const data = JSON.parse(e.data);
                setError(data.error || 'Ошибка генерации аннотации');
            } catch {
                setError('Ошибка генерации аннотации');
            }
            setLoading(false);
        });

        // Built-in EventSource error — fires on connection-level problems AND
        // when the server closes the connection normally (after "done").
        // We only act if the result hasn't been received yet; otherwise the
        // EventSource auto-reconnect will retrieve the cached result from the server.
        es.onerror = () => {
            if (completedRef.current) return;

            // EventSource readyState CLOSED means the server rejected the request
            // outright (e.g. 401, network unreachable) — no point waiting.
            if (es.readyState === EventSource.CLOSED) {
                closeStream();
                setError('Ошибка соединения с сервером');
                setLoading(false);
            }
            // readyState CONNECTING means EventSource is auto-reconnecting —
            // let it retry; the server will return the cached result if ready.
        };
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(annotation).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleBack = () => {
        const backUrl = programId
            ? `#/app/programs/${programId}/applicants`
            : '#/app/applicants';
        window.location.hash = backUrl;
    };

    return (
        <>
            <PageTitle
                title="Аннотация абитуриента"
                dense
                actions={
                    <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={handleBack}>
                        Назад к списку
                    </Button>
                }
            />

            <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto', mt: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <AutoAwesomeIcon color="primary" />
                    <Typography variant="h6">AI-аннотация</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mb={3}>
                    Нажмите кнопку ниже, чтобы сформировать краткую аннотацию по данному абитуриенту
                    на основе всех извлечённых данных.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                    onClick={handleGenerate}
                    disabled={loading}
                    sx={{ mb: 2 }}
                >
                    {loading ? 'Генерация...' : generated ? 'Сформировать заново' : 'Сформировать аннотацию'}
                </Button>

                {loading && (
                    <Box mb={2}>
                        <LinearProgress />
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            AI обрабатывает данные абитуриента, это может занять около минуты…
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Box mb={2} p={1.5} sx={{ bgcolor: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.35)', borderRadius: 1 }}>
                        <Typography variant="body2" color="error">{error}</Typography>
                    </Box>
                )}

                {annotation && (
                    <>
                        <Divider sx={{ mb: 2 }} />
                        <Box display="flex" justifyContent="flex-end" mb={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={copied ? <DoneIcon /> : <ContentCopyIcon />}
                                onClick={handleCopy}
                                color={copied ? 'success' : 'primary'}
                            >
                                {copied ? 'Скопировано' : 'Копировать'}
                            </Button>
                        </Box>
                        <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                            <Typography variant="body1">{annotation}</Typography>
                        </Box>
                    </>
                )}
            </Paper>
        </>
    );
}

import React from 'react';
import { Box, Typography, Paper, Button, TextField } from "@mui/material";
import MovieIcon from '@mui/icons-material/Movie';
import DoneIcon from '@mui/icons-material/Done';

export default function VideoSection({
    data,
    setData,
    isEditing,
    handleSave,
    currentUser,
    applicantStatus
}) {
    const isAI = data?.source === 'model';
    const canConfirm = isAI && (currentUser?.role === 'admin' || currentUser?.role === 'operator') && applicantStatus === 'verifying';

    return (
        <Box sx={{
            backgroundColor: isAI ? '#fff9c4' : 'transparent',
            p: isAI ? 2 : 0,
            borderRadius: 2,
            border: isAI ? '1px solid #ffe082' : 'none',
            transition: 'all 0.3s ease',
            mt: 2
        }}>
            {isAI && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                        ✨ Ссылка извлечена ИИ. Пожалуйста, проверьте и подтвердите.
                    </Typography>
                    {canConfirm && (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<DoneIcon />}
                            onClick={handleSave}
                        >
                            Подтвердить
                        </Button>
                    )}
                </Box>
            )}
            <Typography variant="h6" gutterBottom>Видео-самопредставление</Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                {isEditing ? (
                    <Box maxWidth={600}>
                        <TextField
                            label="Ссылка на видео (YouTube / Drive / Yandex)"
                            fullWidth
                            variant="outlined"
                            placeholder="https://..."
                            value={data?.video_url || ''}
                            onChange={(e) => setData({ ...data, video_url: e.target.value })}
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                            Вставьте ссылку на видео-презентацию. Видео будет открываться во внешней вкладке.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ py: 1 }}>
                        {data?.video_url ? (
                            <Box display="flex" alignItems="center" gap={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    href={data.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<MovieIcon />}
                                >
                                    Посмотреть видео
                                </Button>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}
                                    title={data.video_url}
                                >
                                    {data.video_url}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <MovieIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                <Typography variant="body2" color="textSecondary">
                                    Ссылка на видео ещё не добавлена.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

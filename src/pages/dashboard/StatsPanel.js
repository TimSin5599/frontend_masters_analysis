import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  Grade as GradeIcon,
  School as SchoolIcon,
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/styles';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Widget from '../../components/Widget';
import { Typography } from '../../components/Wrappers';
import config from '../../config';

const DOC_TYPE_LABELS = {
  passport: 'Паспорт',
  diploma: 'Диплом',
  transcript: 'Транскрипт',
  resume: 'Резюме',
  motivation: 'Мотив. письмо',
  recommendation: 'Рекомендация',
  achievement: 'Достижение',
  certification: 'Сертификат',
  language: 'Языковой серт.',
  video_presentation: 'Видео',
  second_diploma: 'Доп. диплом',
  prof_development: 'Проф. развитие',
  internship: 'Стажировка',
  training: 'Тренинг',
  unknown: 'Неклассифицирован',
};

function KpiCard({ title, subtitle, value, icon: Icon, color }) {
  const theme = useTheme();
  const iconColor = color || theme.palette.primary.main;
  return (
    <Widget title={title} upperTitle style={{ height: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h2" weight="medium" style={{ color: iconColor }}>
            {value != null ? value : '—'}
          </Typography>
          <Typography color="text" colorBrightness="hint" variant="caption">
            {subtitle}
          </Typography>
        </Box>
        {Icon && (
          <Icon style={{ fontSize: 40, color: iconColor, opacity: 0.5 }} />
        )}
      </Box>
    </Widget>
  );
}

function formatMinutes(decimalMinutes) {
  const total = Math.round(parseFloat(decimalMinutes) * 60);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m} мин ${String(s).padStart(2, '0')} сек`;
}

export default function StatsPanel({ programId = 0 }) {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [dynamics, setDynamics] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    axios
      .get(`${config.statsApi}/v1/stats/overview?program_id=${programId}`)
      .then(res => {
        setStats(res.data);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, [programId]);

  useEffect(() => {
    axios
      .get(
        `${config.statsApi}/v1/stats/dynamics?period=${period}&program_id=${programId}`,
      )
      .then(res => setDynamics(res.data || []))
      .catch(() => setDynamics([]));
  }, [period, programId]);

  if (loadingStats) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  const s = stats || {};

  return (
    <Grid container spacing={3}>
      {/* Row 1 — 5 pipeline KPI cards */}
      <Grid item xs={12} sm={6} lg={2.4}>
        <KpiCard
          title="Входной поток"
          subtitle="Всего абитуриентов"
          value={s.total_applicants ?? 0}
          icon={SchoolIcon}
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={2.4}>
        <KpiCard
          title="ИИ система"
          subtitle="Файлов в обработке"
          value={s.ai_processing ?? 0}
          icon={SmartToyIcon}
          color={theme.palette.secondary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={2.4}>
        <KpiCard
          title="Проверка"
          subtitle="Ожидают верификации"
          value={s.verifying ?? 0}
          icon={VisibilityIcon}
          color={theme.palette.warning.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={2.4}>
        <KpiCard
          title="Оценивание"
          subtitle="У экспертов"
          value={s.assessing ?? 0}
          icon={AssignmentIcon}
          color="#0070f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={2.4}>
        <KpiCard
          title="Завершено"
          subtitle="Оценено экспертами"
          value={s.evaluated ?? 0}
          icon={CheckCircleIcon}
          color={theme.palette.success.main}
        />
      </Grid>

      {/* Row 2 — scores column (left) + dynamics chart (right) */}
      <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
        <Box display="flex" flexDirection="column" gap={3} width="100%">
          <Box flex={1}>
            <KpiCard
              title="Средний балл"
              subtitle="По завершённым оценкам"
              value={
                s.avg_score != null && s.avg_score !== 0
                  ? parseFloat(s.avg_score).toFixed(1)
                  : '—'
              }
              icon={GradeIcon}
              color="#21AE8C"
            />
          </Box>
          <Box flex={1}>
            <KpiCard
              title="Лучший результат"
              subtitle="Максимальный балл"
              value={
                s.max_score != null && s.max_score !== 0
                  ? parseFloat(s.max_score).toFixed(1)
                  : '—'
              }
              icon={EmojiEventsIcon}
              color="#f7b731"
            />
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} md={9} sx={{ display: 'flex', minWidth: 0 }}>
        <Box sx={{ width: '100%', minWidth: 0 }}>
        <Widget
          sx={{ width: '100%' }}
          header={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <Box>
                <Typography
                  variant="h6"
                  color="text"
                  weight="medium"
                  colorBrightness="secondary"
                >
                  Динамика обработки портфолио
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                {/* Legend dots */}
                {[
                  { color: theme.palette.primary.main, label: 'Подано' },
                  { color: theme.palette.warning.main, label: 'Проверка' },
                  { color: theme.palette.secondary.main, label: 'Оценивание' },
                  { color: theme.palette.success.main, label: 'Оценено' },
                ].map(item => (
                  <Box key={item.label} display="flex" alignItems="center" gap={0.5}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: item.color,
                      }}
                    />
                    <Typography variant="caption" color="text" colorBrightness="hint">
                      {item.label}
                    </Typography>
                  </Box>
                ))}
                <Select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  input={
                    <OutlinedInput
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0,0,0,0.23)',
                        },
                        '& .MuiSelect-select': { py: '8px', pr: '28px' },
                      }}
                    />
                  }
                  autoWidth
                >
                  <MenuItem value="daily">По дням</MenuItem>
                  <MenuItem value="weekly">По неделям</MenuItem>
                  <MenuItem value="monthly">По месяцам</MenuItem>
                </Select>
              </Box>
            </Box>
          }
        >
          {dynamics.length === 0 ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height={320}
            >
              <Typography color="text" colorBrightness="hint" variant="body2">
                Нет данных за выбранный период
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={dynamics}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="20%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme.palette.text.hint + '80', fontSize: 12 }}
                  stroke={theme.palette.text.hint + '80'}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: theme.palette.text.hint + '80', fontSize: 12 }}
                  stroke={theme.palette.text.hint + '80'}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar
                  dataKey="submitted"
                  name="Подано"
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  dataKey="verifying"
                  name="Проверка"
                  fill={theme.palette.warning.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  dataKey="assessing"
                  name="Оценивание"
                  fill={theme.palette.secondary.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  dataKey="evaluated"
                  name="Оценено"
                  fill={theme.palette.success.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Widget>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Widget title="Ошибки ИИ по категориям документов" upperTitle>
          {!s.ai_errors_by_category || s.ai_errors_by_category.length === 0 ? (
            <Typography color="text" colorBrightness="hint" variant="body2">
              Ошибок не обнаружено
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Тип документа</TableCell>
                  <TableCell align="right">Ошибок</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {s.ai_errors_by_category.map(row => (
                  <TableRow key={row.category}>
                    <TableCell>
                      {DOC_TYPE_LABELS[row.category] || row.category}
                    </TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Widget>
      </Grid>

      <Grid item xs={12} md={6}>
        <Widget title="Среднее время обработки документа" upperTitle>
          {!s.doc_processing_by_day ||
          s.doc_processing_by_day.length === 0 ? (
            <Typography color="text" colorBrightness="hint" variant="body2">
              Нет данных (появятся после обработки документов)
            </Typography>
          ) : (
            <Box sx={{ overflowY: 'auto', maxHeight: 240 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Среднее время</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s.doc_processing_by_day.map(row => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">
                        {formatMinutes(row.avg_minutes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Widget>
      </Grid>
    </Grid>
  );
}
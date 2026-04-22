import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import config from '../../config';
import StatsPanel from './StatsPanel';

export default function Dashboard() {
  const [currentProgramId, setCurrentProgramId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    axios
      .get(`${config.manageApi}/v1/programs`)
      .then(res => {
        const programs = res.data || [];
        const current =
          programs.find(p => p.year === currentYear && p.status === 'active') ||
          programs.find(p => p.status === 'active') ||
          programs.sort((a, b) => b.year - a.year)[0];
        setCurrentProgramId(current?.id ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setCurrentProgramId(0);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return <StatsPanel programId={currentProgramId ?? 0} />;
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Sparkle } from 'phosphor-react';
import { useColors } from '../context/ThemeContext';
import { HOME_ROUTE_BY_ROL } from '../utils/constants';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const colors = useColors();

  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    const rol   = localStorage.getItem('sm_rol');

    // Animate progress bar then redirect
    const steps = 30;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress((step / steps) * 100);
      if (step >= steps) {
        clearInterval(interval);
        if (token && rol && HOME_ROUTE_BY_ROL[rol]) {
          navigate(HOME_ROUTE_BY_ROL[rol], { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    }, 50); // 50ms × 30 = 1.5s total

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <Box sx={{
      height: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #09090f 0%, #0f1629 50%, #09090f 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <Box sx={{
        position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
        animation: 'blobPulse 3s ease-in-out infinite alternate',
        '@keyframes blobPulse': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.1)' } },
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Box sx={{
        width: 96, height: 96, borderRadius: '24px', mb: 3,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 16px 40px rgba(99,102,241,0.5)',
        animation: 'logoIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
        '@keyframes logoIn': {
          from: { transform: 'scale(0) rotate(-180deg)', opacity: 0 },
          to:   { transform: 'scale(1) rotate(0deg)', opacity: 1 },
        },
      }}>
        <Sparkle size={40} weight="duotone" color="#fff" />
      </Box>

      <Typography sx={{
        fontSize: 30, fontWeight: 800, color: '#f1f5f9',
        letterSpacing: '-0.04em', mb: 0.5,
        animation: 'fadeUp 0.5s ease-out 0.3s both',
        '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }}>
        Store Management
      </Typography>
      <Typography sx={{
        fontSize: 14, color: '#475569',
        animation: 'fadeUp 0.5s ease-out 0.45s both',
      }}>
        Gestión de Inventario y Abastecimiento
      </Typography>

      {/* Progress bar */}
      <Box sx={{
        width: 200, height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)',
        mt: 6, overflow: 'hidden',
        animation: 'fadeUp 0.5s ease-out 0.6s both',
      }}>
        <Box sx={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
          borderRadius: 99,
          transition: 'width 0.05s linear',
          boxShadow: '0 0 12px rgba(99,102,241,0.6)',
        }} />
      </Box>
      <Typography sx={{ fontSize: 11, color: '#334155', mt: 1.5 }}>
        Cargando sistema…
      </Typography>
    </Box>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { ArrowRight, Sparkle } from 'phosphor-react';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { simAuth } from '../lib/localApi';
import { HOME_ROUTE_BY_ROL, MOCK_USERS, ROLE_LABELS } from '../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colors = useColors();
  const { login } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    const rol = localStorage.getItem('sm_rol');
    if (token && rol && HOME_ROUTE_BY_ROL[rol]) {
      navigate(HOME_ROUTE_BY_ROL[rol], { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 4500);
    return () => clearTimeout(timer);
  }, [error]);

  const doLogin = async (cc) => {
    setLoading(true);
    setError('');

    try {
      const res = await simAuth.login(cc.trim());
      login({
        token: res.token,
        nombre: res.nombre,
        rol: res.rol,
        cedula: res.cedula,
        operarioId: res.operarioId,
      });
      navigate(HOME_ROUTE_BY_ROL[res.rol] || '/supervisor', { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (!status) {
        setError('Servidor no disponible.');
      } else if (status === 404 || status === 401) {
        setError('Cedula no encontrada. Verifica el numero ingresado.');
      } else {
        setError(`Error del servidor (${status}). Intenta de nuevo.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const ROL_COLOR = {
    SUPERVISOR_INVENTARIO: '#8b5cf6',
    ASESOR_COMERCIAL: '#f59e0b',
    OPERARIO_RECEPCION: '#ef4444',
    OPERARIO_PICKING: '#3b82f6',
    OPERARIO_DESPACHO: '#10b981',
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #09090f 0%, #0f1629 50%, #09090f 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {[
        { top: '-15%', right: '-8%', color: 'rgba(99,102,241,0.25)', size: '55%' },
        { bottom: '-10%', left: '-8%', color: 'rgba(16,185,129,0.18)', size: '45%' },
        { top: '40%', left: '30%', color: 'rgba(245,158,11,0.10)', size: '30%' },
      ].map((blob, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            top: blob.top,
            right: blob.right,
            bottom: blob.bottom,
            left: blob.left,
            animation: `blobPulse ${3 + index}s ease-in-out infinite alternate`,
            '@keyframes blobPulse': {
              from: { transform: 'scale(1)' },
              to: { transform: 'scale(1.08)' },
            },
          }}
        />
      ))}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 820,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            flexShrink: 0,
            p: { xs: 3, sm: '36px 40px' },
            background: 'rgba(17,24,39,0.85)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            animation: 'cardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
            '@keyframes cardIn': {
              from: { opacity: 0, transform: 'translateY(24px) scale(0.97)' },
              to: { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(99,102,241,0.5)',
              }}
            >
              <Sparkle size={28} weight="duotone" color="#fff" />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Store Management
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#64748b', mt: 0.75 }}>
              Sistema de Gestion de Inventario
            </Typography>
          </Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (cedula.trim()) doLogin(cedula);
            }}
          >
            <TextField
              fullWidth
              label="Numero de cedula"
              placeholder="Ej: 33333333"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
                '& input': { color: '#f1f5f9' },
                '& .MuiInputLabel-root': { color: '#64748b' },
              }}
            />
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                  '& .MuiAlert-icon': { color: '#ef4444' },
                }}
              >
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !cedula.trim()}
              endIcon={!loading && <ArrowRight size={18} weight="bold" />}
              sx={{
                height: 48,
                borderRadius: '12px',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  boxShadow: '0 6px 24px rgba(99,102,241,0.55)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': { background: 'rgba(99,102,241,0.3)', boxShadow: 'none' },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Iniciar Sesion'}
            </Button>
          </form>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: '24px 26px',
            background: 'rgba(17,24,39,0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '20px',
            animation: 'cardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
            Acceso rapido - Mocks backend
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {MOCK_USERS.map((user) => (
              <Box
                key={user.cedula}
                onClick={() => doLogin(user.cedula)}
                sx={{
                  p: '10px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    background: `${ROL_COLOR[user.rol]}12`,
                    borderColor: `${ROL_COLOR[user.rol]}40`,
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: `${ROL_COLOR[user.rol]}18`,
                    border: `1.5px solid ${ROL_COLOR[user.rol]}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: ROL_COLOR[user.rol] }}>
                    {user.nombre.charAt(0)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>
                    {user.nombre}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: ROL_COLOR[user.rol], fontWeight: 500 }}>
                    {ROLE_LABELS[user.rol]}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                  {user.cedula}
                </Typography>
                <ArrowRight size={13} color="#475569" weight="bold" />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import { Box } from '@mui/material';
import { Sun, Moon } from 'phosphor-react';
import { useThemeMode, useColors } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const colors = useColors();

  return (
    <Box
      onClick={toggleMode}
      title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      sx={{
        width: 36, height: 36, borderRadius: '10px',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)'
          : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        '&:hover': {
          transform: 'rotate(20deg) scale(1.1)',
          boxShadow: mode === 'dark'
            ? '0 0 14px rgba(59,130,246,0.35)'
            : '0 0 14px rgba(245,158,11,0.35)',
          borderColor: mode === 'dark' ? 'rgba(59,130,246,0.5)' : 'rgba(245,158,11,0.5)',
        },
      }}>
      {mode === 'dark'
        ? <Sun  size={16} weight="duotone" color="#f59e0b" />
        : <Moon size={16} weight="duotone" color="#6366f1" />
      }
    </Box>
  );
}
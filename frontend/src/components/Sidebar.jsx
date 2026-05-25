import { useState, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Tooltip, Badge } from '@mui/material';
import {
  ChartBar, Package, ShoppingCart, UsersThree, Truck,
  Buildings, ClockCounterClockwise, Warning, FileText,
  Bag, SignOut, CaretLeft, CaretRight, User,
} from 'phosphor-react';
import ThemeToggle from './ThemeToggle';
import { useColors } from '../context/ThemeContext';
import { ROLE_LABELS } from '../utils/constants';

const MENU_ITEMS = {
  OPERARIO_PICKING: [
    { label: 'Mis Pedidos', path: '/picking', Icon: Bag },
  ],
  OPERARIO_DESPACHO: [
    { label: 'Mis Pedidos', path: '/despacho', Icon: Truck },
  ],
  OPERARIO_RECEPCION: [
    { label: 'Gestión Recepción', path: '/recepcion', Icon: Buildings },
  ],
  SUPERVISOR_INVENTARIO: [
    { label: 'Dashboard',    path: '/supervisor',             Icon: ChartBar              },
    { label: 'Asignación',   path: '/supervisor/asignacion',  Icon: UsersThree            },
    { label: 'Manifiestos',  path: '/supervisor/manifiestos', Icon: FileText              },
    { label: 'Catálogo SKU', path: '/supervisor/catalogo',    Icon: Package               },
    { label: 'Inventario',   path: '/supervisor/inventario',  Icon: Buildings             },
    { label: 'Movimientos',  path: '/supervisor/movimientos', Icon: ClockCounterClockwise },
    { label: 'Excepciones',  path: '/supervisor/excepciones', Icon: Warning               },
  ],
  ASESOR_COMERCIAL: [
    { label: 'Catálogo',    path: '/asesor/catalogo', Icon: Package      },
    { label: 'Mi Carrito',  path: '/asesor/carrito',  Icon: ShoppingCart, cartBadge: true },
    { label: 'Mis Pedidos', path: '/asesor/pedidos',  Icon: Bag          },
  ],
};

const ROL_ACCENT = {
  SUPERVISOR_INVENTARIO: '#8B5CF6',
  ASESOR_COMERCIAL:      '#F59E0B',
  OPERARIO_RECEPCION:    '#EF4444',
  OPERARIO_PICKING:      '#3B82F6',
  OPERARIO_DESPACHO:     '#10B981',
};

function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [carritoCount, setCarritoCount] = useState(0);
  const colors = useColors();

  const nombre = localStorage.getItem('sm_user') || '—';
  const rol    = localStorage.getItem('sm_rol')  || '';
  const items  = MENU_ITEMS[rol] || [];
  const accent = ROL_ACCENT[rol] || '#6366f1';

  const updateCount = () => {
    try {
      const c = JSON.parse(localStorage.getItem('sm_carrito') || '[]');
      setCarritoCount(Array.isArray(c) ? c.reduce((s, i) => s + i.qty, 0) : 0);
    } catch { setCarritoCount(0); }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('sm_cart_updated', updateCount);
    return () => window.removeEventListener('sm_cart_updated', updateCount);
  }, []);

  const handleLogout = () => {
    ['sm_token', 'sm_user', 'sm_rol', 'sm_cedula', 'sm_operario_id'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{
      width: collapsed ? 72 : 256,
      height: '100vh',
      background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
      zIndex: 100,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '35%',
        background: `radial-gradient(ellipse at top left, ${accent}15 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      {/* ── HEADER ── */}
      <Box sx={{
        position: 'relative', zIndex: 1,
        p: collapsed ? '18px 10px' : '16px 18px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 68,
        gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '11px', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}bb 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${accent}45`,
          }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>SM</Typography>
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 14, whiteSpace: 'nowrap', lineHeight: 1.25 }}>
                Store Management
              </Typography>
              <Typography sx={{ fontSize: 10, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                Sistema de Inventario
              </Typography>
            </Box>
          )}
        </Box>

        <Tooltip title={collapsed ? 'Expandir' : 'Colapsar'} placement="right">
          <Box
            onClick={() => setCollapsed(c => !c)}
            sx={{
              width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
              background: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { background: `${accent}20`, borderColor: `${accent}60` },
            }}>
            {collapsed
              ? <CaretRight size={12} color={colors.textSecondary} weight="bold" />
              : <CaretLeft  size={12} color={colors.textSecondary} weight="bold" />
            }
          </Box>
        </Tooltip>
      </Box>

      {/* ── NAV ITEMS ── */}
      <Box sx={{
        flex: 1,
        py: 1.5,
        overflow: 'auto',
        position: 'relative', zIndex: 1,
        '&::-webkit-scrollbar': { width: '3px' },
        '&::-webkit-scrollbar-thumb': { background: `${accent}30`, borderRadius: '4px' },
      }}>
        {!collapsed && (
          <Typography sx={{
            px: 2.5, mb: 0.75, fontSize: 9.5, fontWeight: 700,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Menú
          </Typography>
        )}

        {items.map(({ label, path, Icon, cartBadge }, idx) => {
          const active = isActive(path);
          const badgeCount = cartBadge ? carritoCount : 0;
          return (
            <Tooltip key={path} title={collapsed ? label : ''} placement="right">
              <Box
                onClick={() => navigate(path)}
                sx={{
                  mx: 1.25, my: 0.35,
                  px: collapsed ? 0 : 1.5,
                  py: 1,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  background: active ? `${accent}18` : 'transparent',
                  border: `1px solid ${active ? accent + '35' : 'transparent'}`,
                  transition: 'all 0.18s ease',
                  animation: `navItemIn 0.3s ease-out ${idx * 0.04}s both`,
                  '@keyframes navItemIn': {
                    from: { opacity: 0, transform: 'translateX(-8px)' },
                    to:   { opacity: 1, transform: 'translateX(0)' },
                  },
                  '&:hover': {
                    background: active ? `${accent}22` : `${colors.border}60`,
                    transform: active ? 'none' : 'translateX(2px)',
                  },
                }}>
                {active && (
                  <Box sx={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: '0 3px 3px 0', background: accent, boxShadow: `0 0 6px ${accent}` }} />
                )}
                <Badge badgeContent={badgeCount || null} sx={{ '& .MuiBadge-badge': { fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, padding: '0 4px', background: accent, color: '#fff' } }}>
                  <Icon size={19} weight={active ? 'duotone' : 'regular'} color={active ? accent : colors.textSecondary} style={{ flexShrink: 0 }} />
                </Badge>
                {!collapsed && (
                  <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 450, color: active ? colors.text : colors.textSecondary, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                    {label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{
        p: collapsed ? '10px 8px' : '10px 14px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        gap: 0.75,
        position: 'relative', zIndex: 1,
      }}>
        {!collapsed && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden', minWidth: 0 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `${accent}18`,
              border: `2px solid ${accent}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={15} weight="duotone" color={accent} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: colors.text, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nombre}
              </Typography>
              <Typography sx={{ color: colors.textSecondary, fontSize: 9.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ROLE_LABELS[rol] || rol}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <ThemeToggle />
          <Tooltip title="Cerrar sesión" placement={collapsed ? 'right' : 'top'}>
            <Box
              onClick={handleLogout}
              sx={{
                width: 34, height: 34, borderRadius: '9px',
                background: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)' },
              }}>
              <SignOut size={15} weight="bold" color={colors.textSecondary} />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
export default memo(Sidebar);

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  Package, ArrowUp, ArrowDown, Warning,
  ClockCounterClockwise, ArrowRight, TrendUp,
  Fire, CheckCircle, ArrowCircleDown, ArrowCircleUp, Lock, ArrowsCounterClockwise,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha, formatRelativo, diasHastaVencer, colorVencimiento, formatFechaHora } from '../../utils/formatters';

/* ── small reusable components ─────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, color, sub, loading }) {
  const colors = useColors();
  return (
    <Box sx={{
      p: '20px 22px',
      borderRadius: '16px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.25s ease',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 28px ${color}20` },
      '&::before': {
        content: '""', position: 'absolute',
        top: 0, right: 0, width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} weight="duotone" color={color} />
        </Box>
        {sub && (
          <Typography sx={{ fontSize: 11, color: colors.textSecondary, fontWeight: 500 }}>{sub}</Typography>
        )}
      </Box>
      {loading
        ? <CircularProgress size={20} sx={{ color }} />
        : <Typography sx={{ fontSize: 30, fontWeight: 800, color: colors.text, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {value != null ? value : 0}
          </Typography>
      }
      <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, mt: 0.75, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}

function SectionTitle({ children }) {
  const colors = useColors();
  return (
    <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text, mb: 1.5, letterSpacing: '-0.01em' }}>
      {children}
    </Typography>
  );
}

/* ── Tipo movimiento config ─────────────────────────────────────────────── */
// Valores exactos del enum TipoMovimiento del backend
const MOV_CONFIG = {
  ENTRADA:          { label: 'Entrada',          color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   Icon: ArrowCircleDown },
  COMPROMISO:       { label: 'Compromiso',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  Icon: Lock },
  PICKING:          { label: 'Picking',          color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  Icon: ArrowsCounterClockwise },
  SALIDA:           { label: 'Salida',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: ArrowCircleUp },
  BAJA_AVERIA:      { label: 'Baja Avería',      color: '#f97316', bg: 'rgba(249,115,22,0.1)',  Icon: ArrowCircleUp },
  BAJA_VENCIMIENTO: { label: 'Baja Vencimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   Icon: ArrowCircleUp },
  FALTANTE:         { label: 'Faltante',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: ArrowsCounterClockwise },
  REASIGNACION:     { label: 'Reasignación',     color: '#64748b', bg: 'rgba(100,116,135,0.1)', Icon: ArrowsCounterClockwise },
};

/* ── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const colors = useColors();

  const [resumen, setResumen]             = useState(null);
  const [lotesCriticos, setLotesCriticos] = useState([]);
  const [movimientos, setMovimientos]     = useState([]);
  const [pedidos, setPedidos]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Carga independiente: un fallo parcial no bloquea las demás secciones
    const safe = (promise, fallback) => promise.catch(() => fallback);

    Promise.all([
      safe(api.inventario.getResumen(),       null),
      safe(api.inventario.getLotesCriticos(30), []),
      safe(api.inventario.getMovimientos({}),   []),
      safe(api.pedidos.listar({ estado: 'COMPROMETIDO' }), { content: [] }),
    ]).then(([res, lotes, movs, ped]) => {
      if (cancelled) return;
      // Resumen: si backend no responde, mostrar zeros
      setResumen(res ?? { totalSkus: 0, totalLotes: 0, pedidosActivos: 0, excepcionesAbiertas: 0 });
      setLotesCriticos(Array.isArray(lotes) ? lotes.slice(0, 6) : []);
      setMovimientos(Array.isArray(movs) ? movs.slice(0, 8) : []);
      setPedidos(Array.isArray(ped?.content) ? ped.content.slice(0, 5) : (Array.isArray(ped) ? ped.slice(0, 5) : []));
      // Solo mostrar error si todo falló
      if (!res && (!lotes || !lotes.length) && (!movs || !movs.length)) {
        setError('Backend no disponible — mostrando valores en cero');
      } else {
        setError(null);
      }
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return (
    <Box sx={{
      animation: 'dashIn 0.4s ease-out both',
      '@keyframes dashIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Dashboard
        </Typography>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: 0.5 }}>
          Resumen operativo del sistema de inventario
        </Typography>
      </Box>

      {/* Error banner */}
      {error && (
        <Box sx={{
          p: '12px 16px', borderRadius: '12px', mb: 3,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Warning size={16} weight="fill" color="#ef4444" />
          <Typography sx={{ fontSize: 13, color: '#ef4444' }}>{error} — los datos mostrados pueden ser de caché local.</Typography>
        </Box>
      )}

      {/* ── KPI CARDS ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'SKUs en Catálogo',     value: resumen?.totalSkusActivos,            icon: Package,              color: '#8B5CF6', sub: 'productos activos' },
          { label: 'Lotes con Stock',      value: resumen?.totalLotesConStock,          icon: TrendUp,               color: '#3B82F6', sub: 'lotes vigentes' },
          { label: 'Próx. a Vencer',      value: resumen?.alertas?.proximosVencer30Dias, icon: ClockCounterClockwise, color: '#F59E0B', sub: '≪ 30 días' },
          { label: 'Excepciones Abiertas', value: resumen?.alertas?.excepcionesAbiertas, icon: Warning,               color: '#EF4444', sub: 'sin resolver' },
        ].map((kpi) => (
          <StatCard key={kpi.label} {...kpi} loading={loading && !resumen} />
        ))}
      </Box>

      {/* Lotes + Pedidos row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        {/* ── Lotes críticos ── */}
        <Box sx={{ p: '20px 22px', borderRadius: '16px', background: colors.surface, border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Fire size={18} weight="duotone" color="#ef4444" />
                <SectionTitle>Lotes próximos a vencer</SectionTitle>
              </Box>
              <Typography
                onClick={() => navigate('/supervisor/inventario')}
                sx={{ fontSize: 12, color: '#6366f1', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Ver todos
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#6366f1' }} />
              </Box>
            ) : lotesCriticos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle size={32} weight="duotone" color="#22c55e" style={{ marginBottom: 8 }} />
                <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>Sin lotes críticos en los próximos 30 días</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {lotesCriticos.map((lote, i) => {
                  // LoteStockDTO: diasHastaVencimiento (no diasHastaVencer)
                  const dias = lote.diasHastaVencimiento ?? diasHastaVencer(lote.fechaVencimiento);
                  const col = colorVencimiento(dias);
                  return (
                    <Box key={i} sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      p: '10px 12px', borderRadius: '10px',
                      background: `${col}08`, border: `1px solid ${col}25`,
                      transition: 'all 0.2s',
                      '&:hover': { background: `${col}12` },
                    }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                        background: `${col}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {dias <= 7
                          ? <Fire size={18} weight="fill" color={col} />
                          : <Warning size={18} weight="duotone" color={col} />
                        }
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lote.marcaProducto || lote.skuId || '—'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
                          {lote.codigoLote || '—'} · Vence: {formatFecha(lote.fechaVencimiento)}
                        </Typography>
                      </Box>
                      <Box sx={{ px: 1.25, py: 0.4, borderRadius: '20px', flexShrink: 0, background: `${col}18`, border: `1px solid ${col}30` }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: col }}>
                          {dias != null ? `${dias}d` : '—'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

        {/* ── Pedidos para asignar ── */}
        <Box sx={{ p: '20px 22px', borderRadius: '16px', background: colors.surface, border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package size={18} weight="duotone" color="#6366f1" />
                <SectionTitle>Pedidos comprometidos</SectionTitle>
              </Box>
              <Typography
                onClick={() => navigate('/supervisor/asignacion')}
                sx={{ fontSize: 12, color: '#6366f1', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Asignar operarios
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#6366f1' }} />
              </Box>
            ) : pedidos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle size={32} weight="duotone" color="#22c55e" style={{ marginBottom: 8 }} />
                <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>No hay pedidos pendientes de asignación</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {pedidos.map((p, i) => (
                  <Box key={p.pedidoId || i} sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: '10px 12px', borderRadius: '10px',
                    background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateX(3px)', borderColor: '#6366f130' },
                  }}
                    onClick={() => navigate('/supervisor/asignacion')}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {p.numeroPedido || `PED-${i + 1}`}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.clienteNombre || p.clienteCc || '—'} · {formatRelativo(p.fechaCreacion)}
                      </Typography>
                    </Box>
                    <ArrowRight size={15} color={colors.textSecondary} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
      </Box>

      {/* ── Últimos movimientos ── */}
      <Box sx={{ p: '20px 22px', borderRadius: '16px', background: colors.surface, border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClockCounterClockwise size={18} weight="duotone" color="#3b82f6" />
                <SectionTitle>Últimos movimientos de inventario</SectionTitle>
              </Box>
              <Typography
                onClick={() => navigate('/supervisor/movimientos')}
                sx={{ fontSize: 12, color: '#6366f1', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Ver Kardex completo
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
              </Box>
            ) : movimientos.length === 0 ? (
              <Typography sx={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', py: 3 }}>
                Sin movimientos registrados
              </Typography>
            ) : (
              <Box sx={{ borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}`, background: colors.surfaceAlt }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 100px 110px 1.2fr 120px 80px 130px', gap: 1.5, px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
                  {['Fecha/Hora', 'Tipo', 'SKU', 'Marca', 'Lote', 'Cantidad', 'Referencia'].map(h => (
                    <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
                  ))}
                </Box>
                {movimientos.map((m, i) => {
                  const cfg = MOV_CONFIG[m.tipoMovimiento] || { label: m.tipoMovimiento, color: '#64748b', bg: 'transparent', Icon: Package };
                  const positivo = (m.cantidad || 0) > 0;
                  const codigoLote = m.lote?.codigoLote || m.codigoLote || '—';
                  const skuId      = m.producto?.skuId   || m.skuId       || '—';
                  const marca      = m.producto?.marca    || m.marcaProducto || '—';
                  
                  return (
                    <Box key={m.movimientoId || i} sx={{ display: 'grid', gridTemplateColumns: '140px 100px 110px 1.2fr 120px 80px 130px', gap: 1.5, px: 2.5, py: 1.5, borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`, borderLeft: `3px solid ${cfg.color}`, transition: 'background 0.15s', '&:hover': { background: `${colors.border}40` }, background: colors.surface, animation: `rowIn 0.3s ease-out ${Math.min(i, 10) * 0.03}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-4px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                      <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, alignSelf: 'center' }}>{formatFechaHora(m.fechaMovimiento)}</Typography>
                      <Box sx={{ alignSelf: 'center' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '6px', background: cfg.bg }}>
                          <cfg.Icon size={12} weight="duotone" color={cfg.color} />
                          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'monospace', alignSelf: 'center' }}>{skuId}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: colors.text, fontWeight: 500, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{marca}</Typography>
                      <Typography sx={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace', alignSelf: 'center' }}>{codigoLote}</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: cfg.color, alignSelf: 'center', letterSpacing: '-0.01em' }}>
                        {positivo ? `+${m.cantidad}` : m.cantidad}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#6366f1', fontFamily: 'monospace', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.numeroPedido || m.pedidoId || m.recepcionId || m.observaciones?.slice(0,20) || '—'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
    </Box>
  );
}
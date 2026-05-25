import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, InputAdornment, Tabs, Tab } from '@mui/material';
import { Bag, CheckCircle, Warning, X, Package, MagnifyingGlass, HourglassHigh, Checks } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import StatusBadge from '../../components/common/StatusBadge';
import { formatFecha, formatRelativo } from '../../utils/formatters';
import ReportarExcepcionModal from '../../components/ReportarExcepcionModal';

function Toast({ msg, color, onClose }) {
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, p: '12px 18px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', animation: 'tIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both', '@keyframes tIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <CheckCircle size={16} weight="fill" color={color} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>{msg}</Typography>
      <Box onClick={onClose} sx={{ ml: 1, cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={14} color={color} /></Box>
    </Box>
  );
}

/* ── Modal Confirmar Picking ─────────────────────────────────────────────── */
function PickingModal({ pedido, open, onClose, onConfirmado, showToast }) {
  const colors = useColors();
  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObs]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [alertas, setAlertas]       = useState([]);
  const [excModal, setExcModal]     = useState(false);

  useEffect(() => {
    if (!open || !pedido) return;
    const init = {};
    (pedido.lineas || []).forEach(l => {
      // Usamos el ID de la línea como clave. Si hay múltiples lotes, 
      // el operario confirma el total recolectado de esa línea física.
      init[l.productoPedidoId] = l.cantidadConfirmada || l.cantidadSolicitada || 0;
    });
    setCantidades(init); setObs(''); setAlertas([]);
  }, [open, pedido]);

  const handleConfirmar = async () => {
    setSaving(true);
    try {
      const operarioId = localStorage.getItem('sm_operario_id') || '';
      const lineasRecolectadas = Object.entries(cantidades).map(([id, c]) => ({ productoPedidoId: id, cantidadRecolectada: Number(c) }));
      const res = await api.picking.confirmar({ pedidoId: pedido.pedidoId, operarioId, lineasRecolectadas, observaciones });
      if (res.alertas?.length) { setAlertas(res.alertas); return; }
      onConfirmado(pedido.numeroPedido || pedido.pedidoId);
    } catch (err) {
      setAlertas([err.response?.data?.message || 'Error al confirmar picking']);
    } finally { setSaving(false); }
  };

  if (!pedido) return null;
  const lineas = pedido.lineas || [];

  const productosPredefinidos = lineas.map(l => ({
    skuId: l.skuId || l.producto?.skuId,
    marca: l.producto?.marca || l.marca || '',
    presentacion: l.producto?.presentacion || l.presentacion || ''
  })).filter(p => p.skuId);

  const lotesPredefinidos = [...new Set(lineas.flatMap(l => 
    (l.lotesComprometidos || []).map(lt => lt.codigoLote)
  ).filter(lote => lote && lote !== '—'))];

  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bag size={18} weight="duotone" color="#3b82f6" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Confirmar Picking</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{pedido.numeroPedido}</Typography>
          </Box>
          <Button onClick={() => setExcModal(true)} variant="outlined" startIcon={<Warning size={14} weight="duotone" />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 12, fontWeight: 600, borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', background: 'rgba(239,68,68,0.06)' }, ml: 2 }}>
            Reportar Problema
          </Button>
        </Box>
        <Box onClick={!saving ? onClose : undefined} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Cliente */}
        <Box sx={{ p: '10px 14px', borderRadius: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {pedido.cliente?.nombre || pedido.clienteNombre || pedido.clienteCc || '—'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
            Total solicitado: <strong style={{ color: colors.text }}>{pedido.totalSolicitado ?? pedido.totalUnidades ?? 0} und</strong>
          </Typography>
        </Box>

        {/* Alertas */}
        {alertas.length > 0 && (
          <Box sx={{ p: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            {alertas.map((a, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1 }}><Warning size={14} weight="fill" color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} /><Typography sx={{ fontSize: 12.5, color: '#f59e0b' }}>{a}</Typography></Box>
            ))}
          </Box>
        )}

        {/* Líneas */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Líneas a recolectar</Typography>
          <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', gap: 1, px: 2, py: 1.25, background: colors.surfaceAlt }}>
              {['Producto · Lote', 'Vence', 'Cant. Recol.'].map(h => (
                <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Typography>
              ))}
            </Box>
            {lineas.flatMap((l) => {
              const lotes = l.lotesComprometidos?.length ? l.lotesComprometidos : [{ codigoLote: '—', fechaVencimiento: null, cantidadComprometida: l.cantidadSolicitada }];
              return lotes.map((lt, j) => {
                const cantEsperada = lt.cantidadComprometida || l.cantidadSolicitada || 0;
                const cantActual   = cantidades[l.productoPedidoId] ?? cantEsperada;
                const esFaltante   = Number(cantActual) < Number(cantEsperada);
                return (
                  <Box key={`${l.productoPedidoId}-${j}`} sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', gap: 1, px: 2, py: 1.25, borderTop: `1px solid ${colors.border}`, '&:hover': { background: `${colors.border}40` } }}>
                    <Box>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{l.producto?.marca || l.marca || '—'}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#8b5cf6', fontFamily: 'monospace' }}>{lt.codigoLote}</Typography>
                      {/* FR-073: Advertencia de faltante */}
                      {esFaltante && Number(cantActual) >= 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <Warning size={11} weight="fill" color="#f59e0b" />
                          <Typography sx={{ fontSize: 10.5, color: '#f59e0b' }}>
                            Faltante: {Number(cantEsperada) - Number(cantActual)} und — se registrará excepción
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 12, color: colors.textSecondary, alignSelf: 'center' }}>{formatFecha(lt.fechaVencimiento)}</Typography>
                    <TextField
                      size="small" type="number"
                      value={cantidades[l.productoPedidoId] ?? lt.cantidadComprometida}
                      onChange={e => setCantidades(prev => ({ ...prev, [l.productoPedidoId]: Math.max(0, Number(e.target.value)) }))}
                      inputProps={{ min: 0 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: colors.surfaceAlt, height: 32, '& fieldset': { borderColor: esFaltante ? '#f59e0b' : colors.border }, '&.Mui-focused fieldset': { borderColor: esFaltante ? '#f59e0b' : '#3b82f6' } }, '& input': { color: colors.text, fontSize: 13, textAlign: 'center', py: 0 } }}
                    />
                  </Box>
                );
              });
            })}
          </Box>
        </Box>

        {/* Observaciones */}
        <TextField
          label="Observaciones (opcional)" multiline rows={2} value={observaciones}
          onChange={e => setObs(e.target.value)} size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#3b82f6' } }, '& textarea': { color: colors.text }, '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#3b82f6' } }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary }}>Cancelar</Button>
        <Button onClick={handleConfirmar} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircle size={15} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', '&:hover': { background: 'linear-gradient(135deg,#60a5fa,#3b82f6)' } }}>
          {saving ? 'Confirmando…' : 'Confirmar Picking'}
        </Button>
      </DialogActions>

      <ReportarExcepcionModal
        open={excModal}
        onClose={() => setExcModal(false)}
        onRegistrado={() => { setExcModal(false); showToast('Excepción registrada correctamente', '#f59e0b'); }}
        productosPredefinidos={productosPredefinidos}
        lotesPredefinidos={lotesPredefinidos}
      />
    </Dialog>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function PickingPage() {
  const colors = useColors();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);
  const [buscar, setBuscar]   = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  const operarioId = localStorage.getItem('sm_operario_id') || '';
  const showToast = (msg, color = '#3b82f6') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try { setPedidos(await api.picking.getMisPedidos(operarioId)); }
    catch { setPedidos([]); } finally { setLoading(false); }
  }, [operarioId]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const handleConfirmado = (num) => { setModal(null); showToast(`Picking confirmado para ${num}`); fetchPedidos(); };

  // FR-066: filtrar localmente por cliente o número de pedido
  let pedidosFiltrados = buscar.trim()
    ? pedidos.filter(p => {
        const q = buscar.toLowerCase();
        return (
          p.numeroPedido?.toLowerCase().includes(q) ||
          p.clienteNombre?.toLowerCase().includes(q) ||
          p.clienteCc?.includes(q)
        );
      })
    : pedidos;

  pedidosFiltrados = pedidosFiltrados.filter(p => {
    if (tabIndex === 0) return p.estado === 'COMPROMETIDO' || p.estado === 'ESPERANDO_RUTA';
    if (tabIndex === 1) return p.estado === 'EN_PICKING';
    if (tabIndex === 2) return !['COMPROMETIDO', 'ESPERANDO_RUTA', 'EN_PICKING'].includes(p.estado);
    return true;
  });

  const handleOpenModal = async (p) => {
    try {
      const detalle = await api.pedidos.detalle(p.pedidoId);
      setModal(detalle);
    } catch (err) {
      showToast('Error al cargar detalle del pedido', '#ef4444');
    }
  };

  const handleIniciarPicking = async (p) => {
    try {
      setLoading(true);
      await api.picking.iniciar(p.pedidoId, operarioId);
      showToast('Picking iniciado correctamente', '#3b82f6');
      await fetchPedidos();
      await handleOpenModal(p);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al iniciar picking', '#ef4444');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bag size={20} weight="duotone" color="#3b82f6" />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Mis Pedidos — Picking</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>Pedidos asignados para recolección</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={fetchPedidos} disabled={loading} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: colors.border, color: colors.textSecondary, '&:hover': { borderColor: '#3b82f6', color: '#3b82f6' } }}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Filtro FR-066 */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Buscar por cliente o N° pedido…" value={buscar}
          onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surface, height: 38, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#3b82f6' } }, '& input': { color: colors.text, fontSize: 13 } }}
        />
        {buscar && (
          <Button onClick={() => setBuscar('')} startIcon={<X size={13} />}
            sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, color: colors.textSecondary }}>
            Limpiar
          </Button>
        )}
      </Box>

      {/* Custom Tabs */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[
          { id: 0, label: 'Pendientes', count: pedidos.filter(p => p.estado === 'COMPROMETIDO' || p.estado === 'ESPERANDO_RUTA').length, color: '#f59e0b', icon: <HourglassHigh size={18} /> },
          { id: 1, label: 'En Proceso', count: pedidos.filter(p => p.estado === 'EN_PICKING').length, color: '#3b82f6', icon: <Bag size={18} /> },
          { id: 2, label: 'Completados', count: pedidos.filter(p => !['COMPROMETIDO', 'ESPERANDO_RUTA', 'EN_PICKING'].includes(p.estado)).length, color: '#22c55e', icon: <Checks size={18} /> }
        ].map(t => {
          const isActive = tabIndex === t.id;
          return (
            <Box
              key={t.id} onClick={() => setTabIndex(t.id)}
              sx={{
                flex: 1, p: '14px 16px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.25s',
                background: isActive ? colors.surface : colors.surfaceAlt,
                border: `1px solid ${isActive ? t.color : colors.border}`,
                boxShadow: isActive ? `0 4px 20px ${t.color}15` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
                '&:hover': { transform: 'translateY(-2px)', borderColor: isActive ? t.color : '#94a3b8' }
              }}
            >
              {isActive && <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: t.color }} />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: isActive ? t.color : colors.textSecondary, display: 'flex' }}>
                  {t.icon}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: isActive ? colors.text : colors.textSecondary }}>{t.label}</Typography>
              </Box>
              <Box sx={{ px: 1, py: 0.25, borderRadius: '6px', background: isActive ? `${t.color}15` : colors.border, color: isActive ? t.color : colors.textSecondary, fontSize: 13, fontWeight: 800 }}>
                {t.count}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Stats bar */}
      {!loading && pedidosFiltrados.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ px: 2, py: 1, borderRadius: '10px', background: `#3b82f610`, border: `1px solid #3b82f625`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{pedidosFiltrados.length}</Typography>
            <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: 500 }}>Total en esta vista</Typography>
          </Box>
        </Box>
      )}

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#3b82f6' }} /></Box>
        ) : pedidos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Package size={40} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>No tienes pedidos asignados para picking</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 80px 130px 110px 110px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['N° Pedido', 'Cliente', 'Und.', 'Asignado', 'Estado', 'Acción'].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {pedidosFiltrados.map((p, i) => (
              <Box key={p.pedidoId || i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 80px 130px 110px 110px', gap: 1.5, px: 2.5, py: 1.75, borderTop: `1px solid ${colors.border}`, transition: 'background 0.15s', '&:hover': { background: `${colors.border}40` }, '&:last-child': { borderBottom: 'none' }, animation: `rowIn 0.3s ease-out ${i * 0.04}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', alignSelf: 'center', fontFamily: 'monospace' }}>{p.numeroPedido || `PED-${i+1}`}</Typography>
                <Box sx={{ alignSelf: 'center' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.clienteNombre || '—'}</Typography>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>CC: {p.clienteCc || '—'}</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>{p.totalUnidades ?? p.totalSolicitado ?? '—'}</Typography>
                <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, alignSelf: 'center' }}>{formatRelativo(p.fechaCompromiso || p.fechaCreacion)}</Typography>
                <Box sx={{ alignSelf: 'center' }}><StatusBadge estado={p.estado} tipo="pedido" /></Box>
                <Box sx={{ alignSelf: 'center' }}>
                  {p.estado === 'COMPROMETIDO' ? (
                    <Button onClick={() => handleIniciarPicking(p)} size="small" variant="contained"
                      sx={{ borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2, background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 3px 10px rgba(245,158,11,0.4)', '&:hover': { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                      Iniciar Picking
                    </Button>
                  ) : p.estado === 'EN_PICKING' ? (
                    <Button onClick={() => handleOpenModal(p)} size="small" variant="contained"
                      sx={{ borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 3px 10px rgba(59,130,246,0.4)', '&:hover': { background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                      Confirmar Picking
                    </Button>
                  ) : (
                    <Chip label="Completado" size="small" sx={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', fontWeight: 700, fontSize: 11 }} />
                  )}
                </Box>
              </Box>
            ))}
          </>
        )}
      </Box>

      <PickingModal pedido={modal} open={!!modal} onClose={() => setModal(null)} onConfirmado={handleConfirmado} showToast={showToast} />
    </Box>
  );
}

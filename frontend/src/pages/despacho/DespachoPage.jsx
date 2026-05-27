import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, InputAdornment, Tabs, Tab } from '@mui/material';
import { Truck, CheckCircle, Warning, WarningCircle, X, Package, MagnifyingGlass, HourglassHigh, Checks, Bag } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import StatusBadge from '../../components/common/StatusBadge';
import { minutosDesde, formatRelativo, formatFecha } from '../../utils/formatters';
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

function formatearTiempo(minutos) {
  if (minutos < 60) return `${minutos}m`;
  if (minutos < 1440) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
  }
  const d = Math.floor(minutos / 1440);
  const h = Math.floor((minutos % 1440) / 60);
  return `${d}d ${String(h).padStart(2, '0')}h`;
}

function TiempoBadge({ fechaRef, fechaFin }) {
  const minutos = minutosDesde(fechaRef, fechaFin);
  const isFinalizado = !!fechaFin;
  const urgente = !isFinalizado && minutos > 10;
  const color   = isFinalizado ? '#94a3b8' : urgente ? '#ef4444' : '#22c55e';
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {urgente && <WarningCircle size={14} weight="fill" color="#ef4444" />}
      {isFinalizado && <CheckCircle size={14} weight="fill" color="#94a3b8" />}
      <Box sx={{ px: 1.25, py: 0.3, borderRadius: '20px', background: `${color}12`, border: `1px solid ${color}30` }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>{formatearTiempo(minutos)}</Typography>
      </Box>
    </Box>
  );
}

/* ── Modal Confirmar Despacho ─────────────────────────────────────────────── */
function DespachoModal({ pedido, open, onClose, onConfirmado, showToast }) {
  const colors = useColors();
  const [form, setForm]           = useState({ transportista: '', placaVehiculo: '', observaciones: '' });
  const [cantidades, setCants]    = useState({});
  const [saving, setSaving]       = useState(false);
  const [alertas, setAlertas]     = useState([]);
  const [errors, setErrors]       = useState({});
  const [excModal, setExcModal]   = useState(false);

  useEffect(() => {
    if (!open || !pedido) return;
    const init = {};
    (pedido.lineas || []).forEach(l => { init[l.productoPedidoId] = l.cantidadConfirmada ?? l.cantidadSolicitada ?? 0; });
    setCants(init); setForm({ transportista: '', placaVehiculo: '', observaciones: '' }); setAlertas([]); setErrors({});
  }, [open, pedido]);

  const validate = () => {
    const e = {};
    if (!form.transportista.trim()) e.transportista = 'Requerido';
    if (!form.placaVehiculo.trim()) e.placaVehiculo = 'Requerida';
    return e;
  };

  const handleConfirmar = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const operarioId = localStorage.getItem('sm_operario_id') || '';
      const cantidadesDespachadas = {};
      Object.entries(cantidades).forEach(([id, c]) => { cantidadesDespachadas[id] = Number(c); });
      const res = await api.despacho.confirmar({ pedidoId: pedido.pedidoId, operarioId, ...form, cantidadesDespachadas });
      
      // Si fue exitoso, cerramos y notificamos, incluso si hay alertas (informativas)
      if (res.exitoso) {
        onConfirmado(pedido.numeroPedido || pedido.pedidoId, res.despachoParcial || res.despacho_parcial);
      } else {
        setAlertas(res.alertas || ['No se pudo confirmar el despacho']);
      }
    } catch (err) {
      setAlertas([err.response?.data?.message || 'Error al confirmar despacho']);
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

  const inputSx = (color = '#10b981') => ({ 
    '& .MuiOutlinedInput-root': { 
      borderRadius: '10px', 
      backgroundColor: colors.surfaceAlt, 
      '& fieldset': { borderColor: colors.border }, 
      '&.Mui-focused fieldset': { borderColor: color } 
    }, 
    '& input, & textarea': { color: colors.text, fontSize: 13 }, 
    '& label': { color: colors.textSecondary, fontSize: 13 }, 
    '& label.Mui-focused': { color } 
  });

  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={18} weight="duotone" color="#10b981" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Confirmar Despacho</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{pedido.numeroPedido}</Typography>
          </Box>
          <Button onClick={() => setExcModal(true)} variant="outlined" startIcon={<Warning size={14} weight="duotone" />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 12, fontWeight: 600, borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', background: 'rgba(239,68,68,0.06)' }, ml: 2 }}>
            Reportar Problema
          </Button>
        </Box>
        <Box onClick={!saving ? onClose : undefined} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Resumen Cliente */}
        <Box sx={{ p: '12px 16px', borderRadius: '12px', background: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{pedido.cliente?.nombre || pedido.clienteNombre || pedido.clienteCc || '—'}</Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary, mt: 0.25 }}>{pedido.cliente?.direccion || 'Sin dirección registrada'}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.border}` }}>
             <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>Unidades</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{pedido.totalConfirmado ?? pedido.totalUnidades ?? 0} und</Typography>
             </Box>
             <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>Peso Est.</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{pedido.pesoLogisticoTotal || '—'} kg</Typography>
             </Box>
          </Box>
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
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Productos a Despachar</Typography>
          <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 1, px: 2, py: 1.25, background: colors.surfaceAlt }}>
              {['Producto', 'Recolectado', 'Despacho'].map(h => (
                <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Typography>
              ))}
            </Box>
            {lineas.map((l, i) => (
              <Box key={l.productoPedidoId || i} sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 1, px: 2, py: 1.5, borderTop: `1px solid ${colors.border}`, '&:hover': { background: `${colors.border}40` } }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{l.producto?.marca || l.marca || '—'}</Typography>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{l.producto?.presentacion || l.presentacion || ''}</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#22c55e', alignSelf: 'center' }}>{l.cantidadConfirmada ?? l.cantidadSolicitada ?? 0} und</Typography>
                <TextField size="small" type="number"
                  value={cantidades[l.productoPedidoId] ?? (l.cantidadConfirmada || 0)}
                  onChange={e => setCants(prev => ({ ...prev, [l.productoPedidoId]: Math.max(0, Number(e.target.value)) }))}
                  inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: colors.surfaceAlt, height: 32, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#10b981' } }, '& input': { color: colors.text, fontSize: 13, textAlign: 'center', py: 0 } }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Datos Logísticos */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField 
            label="Transportista *" 
            size="small" 
            value={form.transportista} 
            onChange={e => {
              setForm(f => ({ ...f, transportista: e.target.value }));
              if (errors.transportista) setErrors(prev => ({ ...prev, transportista: null }));
            }} 
            error={!!errors.transportista} 
            helperText={errors.transportista} 
            sx={inputSx()} 
          />
          <TextField 
            label="Placa del vehículo *" 
            size="small" 
            value={form.placaVehiculo} 
            onChange={e => {
              setForm(f => ({ ...f, placaVehiculo: e.target.value.toUpperCase() }));
              if (errors.placaVehiculo) setErrors(prev => ({ ...prev, placaVehiculo: null }));
            }} 
            error={!!errors.placaVehiculo} 
            helperText={errors.placaVehiculo} 
            sx={inputSx()} 
          />
        </Box>
        <TextField label="Observaciones (opcional)" multiline rows={2} size="small" value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} sx={inputSx()} />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary }}>Cancelar</Button>
        <Button onClick={handleConfirmar} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Truck size={15} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)', '&:hover': { background: 'linear-gradient(135deg,#34d399,#10b981)' } }}>
          {saving ? 'Confirmando…' : 'Confirmar Despacho'}
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

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function DespachoPage() {
  const colors = useColors();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);
  const [buscar, setBuscar]   = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [excModalHeader, setExcModalHeader] = useState(false);

  const operarioId = localStorage.getItem('sm_operario_id') || '';
  const showToast  = (msg, color = '#10b981') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try { setPedidos(await api.despacho.getMisPedidos(operarioId)); }
    catch { setPedidos([]); } finally { setLoading(false); }
  }, [operarioId]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const handleConfirmado = (num, parcial) => {
    setModal(null);
    showToast(parcial ? `Despacho parcial registrado para ${num}` : `Despacho confirmado para ${num}`, parcial ? '#f59e0b' : '#10b981');
    fetchPedidos();
  };

  const handleOpenModal = async (p) => {
    try {
      const detalle = await api.pedidos.detalle(p.pedidoId);
      setModal(detalle);
    } catch (err) {
      showToast('Error al cargar detalle del pedido', '#ef4444');
    }
  };

  // Filtrado local
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
    if (tabIndex === 0) return p.estado === 'PICKUP' || p.estado === 'EN_PICKING';
    if (tabIndex === 1) return p.estado === 'DESPACHADO';
    if (tabIndex === 2) return p.estado === 'ENTREGADO';
    return true;
  });

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} weight="duotone" color="#10b981" />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Mis Pedidos — Despacho</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>Pedidos listos para salida a ruta</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={() => setExcModalHeader(true)} variant="outlined" startIcon={<Warning size={15} weight="duotone" />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', background: 'rgba(239,68,68,0.06)' } }}>
            Reportar Problema
          </Button>
          <Button onClick={fetchPedidos} disabled={loading} variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: colors.border, color: colors.textSecondary, '&:hover': { borderColor: '#10b981', color: '#10b981' } }}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Filtro */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Buscar cliente o pedido…" value={buscar}
          onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surface, height: 38, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#10b981' } }, '& input': { color: colors.text, fontSize: 13 } }}
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
          { id: 0, label: 'Pendientes', count: pedidos.filter(p => p.estado === 'PICKUP' || p.estado === 'EN_PICKING').length, color: '#f59e0b', icon: <HourglassHigh size={18} /> },
          { id: 1, label: 'Despachados', count: pedidos.filter(p => p.estado === 'DESPACHADO').length, color: '#10b981', icon: <Truck size={18} /> },
          { id: 2, label: 'Entregados', count: pedidos.filter(p => p.estado === 'ENTREGADO').length, color: '#3b82f6', icon: <Checks size={18} /> }
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

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#10b981' }} /></Box>
        ) : pedidos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Package size={40} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>No tienes pedidos asignados para despacho</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 80px 110px 110px 110px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['N° Pedido', 'Cliente', 'Und.', 'Tiempo', 'Estado', 'Acción'].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {pedidosFiltrados.map((p, i) => {
              const refDate = p.fechaCompromiso || p.fechaCreacion;
              return (
                <Box key={p.pedidoId || i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 80px 110px 110px 110px', gap: 1.5, px: 2.5, py: 1.75, borderTop: `1px solid ${colors.border}`, transition: 'background 0.15s', '&:hover': { background: `${colors.border}40` }, '&:last-child': { borderBottom: 'none' }, animation: `rowIn 0.3s ease-out ${i * 0.04}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#10b981', alignSelf: 'center', fontFamily: 'monospace' }}>{p.numeroPedido || `PED-${i+1}`}</Typography>
                  <Box sx={{ alignSelf: 'center' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.clienteNombre || '—'}</Typography>
                    <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>CC: {p.clienteCc || '—'}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>{p.totalUnidades ?? '—'}</Typography>
                  <Box sx={{ alignSelf: 'center' }}><TiempoBadge fechaRef={refDate} fechaFin={p.fechaSalida} /></Box>
                  <Box sx={{ alignSelf: 'center' }}><StatusBadge estado={p.estado} tipo="pedido" /></Box>
                  <Box sx={{ alignSelf: 'center' }}>
                    {p.estado === 'PICKUP' || p.estado === 'EN_PICKING' ? (
                      <Button onClick={() => handleOpenModal(p)} size="small" variant="contained"
                        sx={{ borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontSize: 12, px: 2, background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 3px 10px rgba(16,185,129,0.4)', '&:hover': { background: 'linear-gradient(135deg,#34d399,#10b981)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
                        Despachar
                      </Button>
                    ) : (
                      <Chip label="Completado" size="small" sx={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', fontWeight: 700, fontSize: 11 }} />
                    )}
                  </Box>
                </Box>
              );
            })}
            </Box>
          </>
        )}
      </Box>

      <DespachoModal pedido={modal} open={!!modal} onClose={() => setModal(null)} onConfirmado={handleConfirmado} showToast={showToast} />
      <ReportarExcepcionModal
        open={excModalHeader}
        onClose={() => setExcModalHeader(false)}
        onRegistrado={() => { setExcModalHeader(false); showToast('Excepción registrada correctamente', '#f59e0b'); }}
      />
    </Box>
  );
}

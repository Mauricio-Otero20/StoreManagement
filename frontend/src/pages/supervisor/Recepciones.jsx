import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, CircularProgress, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, Chip, InputAdornment, Select, MenuItem,
} from '@mui/material';
import {
  ClipboardText, Plus, X, MagnifyingGlass, Eye,
  CheckCircle, WarningCircle, Clock, Package,
  CalendarBlank, User, Note,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha, formatRelativo } from '../../utils/formatters';


/* ── Estado config ─────────────────────────────────────────────────────────── */
const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', color: '#f59e0b', Icon: Clock },
  RECEPCIONADO_PARCIAL: { label: 'Parcial', color: '#3b82f6', Icon: WarningCircle },
  RECEPCIONADO_TOTAL: { label: 'Recepcionado', color: '#22c55e', Icon: CheckCircle },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado || 'Pendiente', color: '#64748b', Icon: Clock };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <cfg.Icon size={12} weight="fill" color={cfg.color} />
      <Chip label={cfg.label} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: '6px' }} />
    </Box>
  );
}

function Toast({ msg, color, onClose }) {
  const colors = useColors();
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, p: '12px 18px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', animation: 'tIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both', '@keyframes tIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <CheckCircle size={16} weight="fill" color={color} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>{msg}</Typography>
      <Box onClick={onClose} sx={{ ml: 1, cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={14} color={color} /></Box>
    </Box>
  );
}

/* ── Modal Crear Manifiesto ─────────────────────────────────────────────────── */
function CrearManifiestoModal({ open, onClose, onCreado }) {
  const colors = useColors();
  const [form, setForm] = useState({ proveedor: '' });
  const [lineas, setLineas] = useState([{ skuId: '', cantidadEsperada: '' }]);
  const [productos, setProductos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      api.productos.listar({}).then(r => setProductos(r.content || [])).catch(() => { });
      setForm({ proveedor: '' });
      setLineas([{ skuId: '', cantidadEsperada: '' }]);
      setError('');
    }
  }, [open]);

  const addLinea = () => setLineas(l => [...l, { skuId: '', cantidadEsperada: '' }]);
  const delLinea = (i) => setLineas(l => l.filter((_, j) => j !== i));
  const updLinea = (i, field, val) => setLineas(l => l.map((x, j) => j === i ? { ...x, [field]: val } : x));

  const validate = () => {
    if (!form.proveedor.trim()) return 'El proveedor es requerido';
    for (const l of lineas) {
      if (!l.skuId) return 'Selecciona el producto en todas las líneas';
      if (!l.cantidadEsperada || Number(l.cantidadEsperada) < 1) return 'La cantidad esperada debe ser > 0';
    }
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        proveedor: form.proveedor.trim(),
        lineas: lineas.map(l => ({ skuId: l.skuId, cantidadEsperada: Number(l.cantidadEsperada) })),
      };
      const res = await api.manifiestos.crear(payload);
      onCreado(res);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear el manifiesto');
    } finally { setSaving(false); }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } },
    '& input': { color: colors.text, fontSize: 13 }, '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#6366f1' },
  };

  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardText size={18} weight="duotone" color="#6366f1" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Crear Manifiesto</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>El operario de recepción usará este documento para verificar la mercancía</Typography>
          </Box>
        </Box>
        <Box onClick={!saving ? onClose : undefined} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Box sx={{ p: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Typography sx={{ fontSize: 12.5, color: '#ef4444' }}>{error}</Typography>
          </Box>
        )}

        {/* Datos generales */}
        <Box sx={{ mb: 0.5 }}>
          <TextField fullWidth size="small" label="Proveedor *" value={form.proveedor}
            onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
            disabled={saving} sx={inputSx} />
        </Box>

        {/* Líneas del manifiesto */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Líneas de Productos Esperados
            </Typography>
            <Button onClick={addLinea} disabled={saving} startIcon={<Plus size={13} weight="bold" />} size="small"
              sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 12, color: '#6366f1', '&:hover': { background: 'rgba(99,102,241,0.08)' } }}>
              Añadir línea
            </Button>
          </Box>

          <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 1.5, px: 2, py: 1.25, background: colors.surfaceAlt }}>
              {['Producto', 'Cant. Esperada', ''].map(h => (
                <Typography key={h} sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Typography>
              ))}
            </Box>
            {lineas.map((l, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 1.5, px: 2, py: 1.25, borderTop: `1px solid ${colors.border}` }}>
                <FormControl fullWidth size="small">
                  <Select value={l.skuId} onChange={e => updLinea(i, 'skuId', e.target.value)} disabled={saving}
                    displayEmpty sx={{ height: 34, borderRadius: '8px', backgroundColor: colors.surfaceAlt, fontSize: 13, color: l.skuId ? colors.text : '#64748b',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                      '& .MuiSelect-select': { py: 0.5 },
                    }}>
                    <MenuItem value="" sx={{ fontSize: 13 }}>— Seleccionar</MenuItem>
                    {productos.map(p => <MenuItem key={p.skuId} value={p.skuId} sx={{ fontSize: 13 }}>{p.marca} {p.presentacion}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="number" value={l.cantidadEsperada}
                  onChange={e => updLinea(i, 'cantidadEsperada', e.target.value)}
                  inputProps={{ min: 1 }} disabled={saving}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: colors.surfaceAlt, height: 34, '& fieldset': { borderColor: colors.border } }, '& input': { color: colors.text, fontSize: 13, textAlign: 'center', py: 0 } }} />
                <Box onClick={() => lineas.length > 1 && delLinea(i)}
                  sx={{ width: 32, height: 34, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: lineas.length > 1 ? 'pointer' : 'default', background: lineas.length > 1 ? 'rgba(239,68,68,0.08)' : 'transparent', border: lineas.length > 1 ? '1px solid rgba(239,68,68,0.2)' : 'none', '&:hover': lineas.length > 1 ? { background: 'rgba(239,68,68,0.15)' } : {} }}>
                  {lineas.length > 1 && <X size={13} color="#ef4444" />}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary }}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <ClipboardText size={15} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)' } }}>
          {saving ? 'Creando…' : 'Crear Manifiesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Detalle Manifiesto Modal ─────────────────────────────────────────────── */
function DetalleManifiestoModal({ open, manifiesto, onClose }) {
  const colors = useColors();
  const [recepcion, setRecepcion] = useState(null);
  const [loadingRecep, setLoadingRecep] = useState(false);

  useEffect(() => {
    if (!open || !manifiesto || manifiesto.estado === 'PENDIENTE') {
      setRecepcion(null);
      return;
    }
    setLoadingRecep(true);
    api.recepciones.listar()
      .then(list => {
        const found = Array.isArray(list)
          ? list.find(r => String(r.manifiestoId) === String(manifiesto.manifiestoId))
          : null;
        setRecepcion(found);
      })
      .catch(() => setRecepcion(null))
      .finally(() => setLoadingRecep(false));
  }, [open, manifiesto?.manifiestoId, manifiesto?.estado]);

  if (!manifiesto) return null;
  const lineas = manifiesto.detalles || manifiesto.lineas || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardText size={18} weight="duotone" color="#6366f1" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Detalle Manifiesto</Typography>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' }}>{manifiesto.numeroManifiesto}</Typography>
          </Box>
        </Box>
        <Box onClick={onClose} sx={{ cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Proveedor</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{manifiesto.proveedor}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Estado</Typography>
            <EstadoBadge estado={manifiesto.estado} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>Fecha Emisión</Typography>
            <Typography sx={{ fontSize: 13, color: colors.text }}>{formatFecha(manifiesto.fechaEmision)}</Typography>
          </Box>
        </Box>

        {recepcion && (
          <>
            <Box sx={{ height: 1, background: `linear-gradient(90deg, ${colors.border}, transparent)` }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle size={16} weight="fill" color="#22c55e" />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Datos de Recepción</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, p: 2, borderRadius: '12px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <Box>
                <Typography sx={{ fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>N° Recepción</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{recepcion.numeroRecepcion || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fecha</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <CalendarBlank size={13} color="#22c55e" />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{formatFecha(recepcion.fechaRecepcion)}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hora</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                  {recepcion.fechaRecepcion
                    ? new Date(recepcion.fechaRecepcion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography sx={{ fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operario</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <User size={13} color="#22c55e" />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                    {recepcion.operarioNombre ? `${recepcion.operarioNombre}${recepcion.operarioCedula ? ` — CC ${recepcion.operarioCedula}` : ''}` : String(recepcion.operarioId ?? '') || '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {recepcion.notas && (
              <Box sx={{ p: 1.5, borderRadius: '10px', background: '#fffbeb', border: '1px solid rgba(217,119,6,0.2)', display: 'flex', gap: 1 }}>
                <Note size={16} color="#d97706" weight="duotone" style={{ flexShrink: 0, marginTop: 2 }} />
                <Typography sx={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>{recepcion.notas}</Typography>
              </Box>
            )}
          </>
        )}

        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, mb: 0.5 }}>Líneas de Recepción</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {lineas.map((l, i) => (
            <Box key={i} sx={{ p: '10px 12px', borderRadius: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                  {l.marca} {l.presentacion}{l.contenidoMl ? ` · ${l.contenidoMl} ml` : ''}
                </Typography>
                <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
                  {l.skuId} | Esperada: {l.cantidadEsperada} | Recibida: {l.cantidadRecibida || 0}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: l.cantidadRecibida === l.cantidadEsperada ? '#22c55e' : (l.cantidadRecibida > 0 ? '#f59e0b' : colors.textSecondary) }}>
                {l.cantidadRecibida === l.cantidadEsperada ? 'Completo' : (l.cantidadRecibida > 0 ? 'Parcial' : 'Pendiente')}
              </Typography>
            </Box>
          ))}
          {lineas.length === 0 && <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>No hay detalles disponibles.</Typography>}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function SupervisorManifiestos() {
  const colors = useColors();
  const [manifiestos, setManifiestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [estadoFiltro, setEstado] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleVerDetalle = async (m) => {
    setLoadingId(m.manifiestoId);
    try {
      // Intentar obtener detalle completo del backend
      const full = await api.manifiestos.detalle(m.manifiestoId);
      setDetalle(full);
    } catch (err) {
      // Fallback al resumen si falla
      setDetalle(m);
    } finally {
      setLoadingId(null);
    }
  };

  const showToast = (msg, color = '#22c55e') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const fetchManifiestos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.manifiestos.listar({ incluirHistorico: true });
      setManifiestos(Array.isArray(data) ? data : []);
    } catch { setManifiestos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchManifiestos(); }, [fetchManifiestos]);

  const handleCreado = (res) => {
    setModal(false);
    const num = res.numeroManifiesto || '';
    showToast(`Manifiesto ${num} creado correctamente`);
    // Agregar optimistamente a la lista
    setManifiestos(prev => [{
      manifiestoId: String(res.manifiestoId ?? ''),
      numeroManifiesto: num,
      proveedor: res.proveedor || '',
      fechaEmision: res.fechaEmision,
      estado: res.estado || 'PENDIENTE',
      totalLineas: 0,
      lineasRecibidas: 0,
      creadoEl: new Date().toISOString(),
    }, ...prev]);
    // Refrescar en background para datos completos
    fetchManifiestos();
  };

  // Filtrado local
  const ESTADO_PRIORITY = { PENDIENTE: 0, RECEPCIONADO_PARCIAL: 1, RECEPCIONADO_TOTAL: 2, RECIBIDO: 3 };
  const filtrados = manifiestos
    .filter(m => {
      const q = buscar.toLowerCase();
      const matchBuscar = !q || m.numeroManifiesto?.toLowerCase().includes(q) || m.proveedor?.toLowerCase().includes(q);
      const matchEstado = !estadoFiltro || m.estado === estadoFiltro;
      return matchBuscar && matchEstado;
    })
    .sort((a, b) => (ESTADO_PRIORITY[a.estado] ?? 99) - (ESTADO_PRIORITY[b.estado] ?? 99));

  const stats = {
    total: manifiestos.length,
    pendiente: manifiestos.filter(m => m.estado === 'PENDIENTE').length,
    parcial: manifiestos.filter(m => m.estado === 'RECEPCIONADO_PARCIAL').length,
    completo: manifiestos.filter(m => m.estado === 'RECEPCIONADO_TOTAL').length,
  };

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardText size={20} weight="duotone" color="#6366f1" />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Manifiestos</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
            Crea y gestiona los manifiestos que el operario de recepción usa para verificar mercancía
          </Typography>
        </Box>
        <Button onClick={() => setModal(true)} variant="contained" startIcon={<Plus size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 2.5, height: 42, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', '&:hover': { transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
          Crear Manifiesto
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#6366f1' },
          { label: 'Pendientes', value: stats.pendiente, color: '#f59e0b' },
          { label: 'Parciales', value: stats.parcial, color: '#3b82f6' },
          { label: 'Completos', value: stats.completo, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <Box key={label} sx={{ px: 2, py: 1, borderRadius: '10px', background: `${color}10`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
            <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: 500 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Buscar por N° o proveedor…" value={buscar}
          onChange={e => setBuscar(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surface, height: 38, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text, fontSize: 13 } }} />
        <Select value={estadoFiltro} onChange={e => setEstado(e.target.value)} displayEmpty size="small"
          sx={{ height: 38, minWidth: 160, borderRadius: '10px', backgroundColor: colors.surface, color: estadoFiltro ? colors.text : '#64748b', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }}>
          <MenuItem value="">Todos los estados</MenuItem>
          <MenuItem value="PENDIENTE">Pendiente</MenuItem>
          <MenuItem value="RECEPCIONADO_PARCIAL">Parcial</MenuItem>
          <MenuItem value="RECEPCIONADO_TOTAL">Recepcionado</MenuItem>
        </Select>
        {(buscar || estadoFiltro) && (
          <Button onClick={() => { setBuscar(''); setEstado(''); }} startIcon={<X size={13} />}
            sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, color: colors.textSecondary }}>
            Limpiar
          </Button>
        )}
        <Button onClick={fetchManifiestos} disabled={loading} variant="outlined"
          sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, fontWeight: 600, borderColor: colors.border, color: colors.textSecondary, '&:hover': { borderColor: '#6366f1', color: '#6366f1' }, ml: 'auto' }}>
          Actualizar
        </Button>
      </Box>

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>
        ) : filtrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Package size={40} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
              {manifiestos.length === 0 ? 'No hay manifiestos creados — crea el primero' : 'No coincide con los filtros'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 120px 110px 110px 36px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['N° Manifiesto', 'Proveedor', 'Fecha Emisión', 'Líneas', 'Estado', 'Creado', ''].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {filtrados.map((m, i) => (
              <Box key={m.manifiestoId || m.manifistoId || i}
                sx={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 120px 110px 110px 36px', gap: 1.5, px: 2.5, py: 1.75, borderTop: `1px solid ${colors.border}`, '&:hover': { background: `${colors.border}40` }, transition: 'background 0.15s', animation: `rowIn 0.3s ease-out ${i * 0.03}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6366f1', alignSelf: 'center', fontFamily: 'monospace' }}>
                  {m.numeroManifiesto || '—'}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.proveedor || '—'}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, alignSelf: 'center' }}>
                  {formatFecha(m.fechaEmision)}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>
                  {m.totalLineas ?? m.lineas?.length ?? '—'} líneas
                </Typography>
                <Box sx={{ alignSelf: 'center' }}><EstadoBadge estado={m.estado} /></Box>
                <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, alignSelf: 'center' }}>
                  {formatRelativo(m.creadoEl || m.fechaEmision)}
                </Typography>
                <Box onClick={() => !loadingId && handleVerDetalle(m)} 
                  sx={{ alignSelf: 'center', width: 30, height: 30, borderRadius: '8px', background: loadingId === m.manifiestoId ? 'transparent' : 'rgba(99,102,241,0.08)', border: loadingId === m.manifiestoId ? 'none' : '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loadingId ? 'default' : 'pointer', '&:hover': { background: 'rgba(99,102,241,0.18)' } }}>
                  {loadingId === m.manifiestoId ? <CircularProgress size={14} sx={{ color: '#6366f1' }} /> : <Eye size={14} weight="duotone" color="#6366f1" />}
                </Box>
              </Box>
            ))}
            </Box>
          </>
        )}
      </Box>

      <CrearManifiestoModal open={modal} onClose={() => setModal(false)} onCreado={handleCreado} />
      <DetalleManifiestoModal open={!!detalle} manifiesto={detalle} onClose={() => setDetalle(null)} />
    </Box>
  );
}
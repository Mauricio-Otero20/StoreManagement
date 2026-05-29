import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Tooltip, Chip, Pagination,
} from '@mui/material';
import {
  
  Plus, MagnifyingGlass, PencilSimple, Trash,
  Package, X, Check, Warning, ClockClockwise, Eye,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha } from '../../utils/formatters';

const FORM_DEFAULT = { marca: '', presentacion: '', contenidoMl: '', pesoLogisticoKg: '' };
const LABELS = { marca: 'Marca', presentacion: 'Presentación', contenidoMl: 'Contenido (ml)', pesoLogisticoKg: 'Peso Log. (kg)' };
const PAGE_SIZE = 10;

/* ── Panel Detalle SKU + Bitácora ──────────────────────────────────────────── */
function DetalleSKUPanel({ sku, onClose, onEdit, onDelete, refreshTrigger }) {
  const colors = useColors();
  const [bitacora, setBitacora]   = useState([]);
  const [loadingBit, setLoadingBit] = useState(false);

  useEffect(() => {
    if (!sku) return;
    setLoadingBit(true);
    api.productos.bitacora(sku.skuId)
      .then(d => setBitacora(d))
      .catch(() => setBitacora([]))
      .finally(() => setLoadingBit(false));
  }, [sku?.skuId, refreshTrigger]);

  if (!sku) return null;

  const infoRows = [
    ['SKU ID', sku.skuId, true],
    ['Marca', sku.marca],
    ['Presentación', sku.presentacion],
    ['Contenido', `${sku.contenidoMl} ml`],
    ['Peso Logístico', `${sku.pesoLogisticoKg} kg`],
    ['Stock Disponible', sku.stockDisponible ?? 0],
    ['Costo (COP)', sku.costoCop ? `$${Number(sku.costoCop).toLocaleString()}` : '—'],
    ['Creado', <span style={{ fontFamily: 'inherit' }}>{formatFecha(sku.creadoEl) || '—'}</span>],
  ];

  return (
    <Box sx={{ width: 360, flexShrink: 0, borderRadius: '16px', border: `1px solid ${colors.border}`, background: colors.surface, position: 'sticky', top: 24, overflow: 'hidden', animation: 'panelIn .3s cubic-bezier(.34,1.56,.64,1) both', '@keyframes panelIn': { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      {/* Header */}
      <Box sx={{ p: '16px 20px', background: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08))', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.08em', mb: .5 }}>Detalle SKU</Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: colors.text }}>{sku.marca}</Typography>
          <Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>{sku.presentacion}</Typography>
        </Box>
        <Box onClick={onClose} sx={{ cursor: 'pointer', opacity: .5, '&:hover': { opacity: 1 }, mt: .5 }}><X size={16} color={colors.textSecondary}/></Box>
      </Box>

      <Box sx={{ p: '16px 20px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {/* Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: .75, mb: 2.5 }}>
          {infoRows.map(([label, val, mono]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .5 }}>
              <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{label}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', color: mono ? '#8b5cf6' : colors.text }}>{val}</Typography>
            </Box>
          ))}
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          <Button onClick={() => onEdit(sku)} variant="contained" fullWidth size="small"
            startIcon={<PencilSimple size={13} weight="bold"/>}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: 12.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 10px rgba(99,102,241,.35)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)' } }}>
            Editar
          </Button>
          <Button onClick={() => onDelete(sku)} variant="outlined" size="small"
            startIcon={<Trash size={13} weight="bold"/>}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderColor: 'rgba(239,68,68,.4)', color: '#ef4444', '&:hover': { borderColor: '#ef4444', background: 'rgba(239,68,68,.08)' } }}>
            Eliminar
          </Button>
        </Box>

        {/* Bitácora del backend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
          <ClockClockwise size={14} weight="duotone" color="#6366f1"/>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '.07em' }}>Bitácora de Cambios</Typography>
        </Box>

        {loadingBit ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={20} sx={{ color: '#6366f1' }}/></Box>
        ) : bitacora.length === 0 ? (
          <Box sx={{ p: '12px 16px', borderRadius: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Sin cambios registrados</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: .75 }}>
            {bitacora.map((b, i) => (
              <Box key={i} sx={{ p: '10px 12px', borderRadius: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, animation: `rowIn .25s ease-out ${i*.04}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateY(-3px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: .75 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: colors.text }}>{b.campo}</Typography>
                  <Typography sx={{ fontSize: 10.5, color: colors.textSecondary }}>{b.fecha ? new Date(b.fecha).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' }) : '—'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {/* Antes — rojo */}
                  <Box sx={{ px: 1, py: .25, borderRadius: '6px', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)' }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{b.valorAnterior || '—'}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>→</Typography>
                  {/* Después — verde */}
                  <Box sx={{ px: 1, py: .25, borderRadius: '6px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)' }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{b.valorNuevo || '—'}</Typography>
                  </Box>
                </Box>
                {b.usuario && <Typography sx={{ fontSize: 10.5, color: colors.textSecondary, mt: .5 }}>por {b.usuario}</Typography>}
                {b.descripcion && <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: .25, fontStyle: 'italic' }}>{b.descripcion}</Typography>}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg, color, onClose }) {
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, p: '12px 18px', borderRadius: '12px', background: `${color}12`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'toastIn .3s cubic-bezier(.34,1.56,.64,1) both', '@keyframes toastIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
      <Check size={15} weight="bold" color={color} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color }}>{msg}</Typography>
      <Box onClick={onClose} sx={{ ml: 1, cursor: 'pointer', opacity: .6, '&:hover': { opacity: 1 } }}><X size={13} color={color} /></Box>
    </Box>
  );
}

/* ── Modal Editar/Crear con Bitácora ─────────────────────────────────────── */
function ProductoModal({ open, producto, onClose, onSaved }) {
  const colors = useColors();
  const isEdit = !!producto;
  const [form, setForm]         = useState(FORM_DEFAULT);
  const [original, setOrig]     = useState(FORM_DEFAULT);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [bitacora, setBitacora] = useState([]);

  useEffect(() => {
    if (!open) return;
    const base = isEdit ? {
      marca:           producto.marca            || '',
      presentacion:    producto.presentacion     || '',
      contenidoMl:     String(producto.contenidoMl     || ''),
      pesoLogisticoKg: String(producto.pesoLogisticoKg || ''),
    } : FORM_DEFAULT;
    setForm({ ...base });
    setOrig({ ...base });
    setBitacora([]);
    setErrors({});
  }, [open, producto, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.marca.trim())        e.marca        = 'Requerido';
    if (!form.presentacion.trim()) e.presentacion = 'Requerido';
    if (!form.contenidoMl || Number(form.contenidoMl) <= 0)     e.contenidoMl = 'Número > 0';
    if (!form.pesoLogisticoKg || Number(form.pesoLogisticoKg) <= 0) e.pesoLogisticoKg = 'Número > 0';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        marca: form.marca.trim(), presentacion: form.presentacion.trim(),
        contenidoMl: Number(form.contenidoMl), pesoLogisticoKg: Number(form.pesoLogisticoKg),
      };
      if (isEdit) {
        await api.productos.actualizar(producto.skuId, payload);
        // Construir bitácora solo para edición
        const cambios = Object.keys(form)
          .filter(k => String(form[k]) !== String(original[k]))
          .map(k => ({ campo: LABELS[k] || k, antes: original[k], despues: form[k], ts: new Date().toLocaleTimeString() }));
        if (cambios.length) {
          setBitacora(prev => [...cambios, ...prev]);
          setOrig({ ...form }); // actualizar original para la siguiente edición
        }
        onSaved('Producto actualizado correctamente');
      } else {
        await api.productos.crear(payload);
        onSaved('Producto creado correctamente');
      }
    } catch (err) {
      const msg = err.response?.status === 409 ? 'Ya existe un producto con esa marca y presentación' : (err.response?.data?.message || 'Error al guardar');
      setErrors({ general: msg });
    } finally { setSaving(false); }
  };

  const hasChanges = isEdit && Object.keys(form).some(k => String(form[k]) !== String(original[k]));

  const fieldSx = (key) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', backgroundColor: colors.surfaceAlt,
      '& fieldset': { borderColor: isEdit && String(form[key]) !== String(original[key]) ? '#f59e0b' : colors.border, borderWidth: isEdit && String(form[key]) !== String(original[key]) ? 2 : 1 },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& input': { color: colors.text, fontSize: 13 },
    '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#6366f1' },
  });

  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: '#6366f118', border: '1px solid #6366f130', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isEdit ? <PencilSimple size={18} weight="duotone" color="#6366f1" /> : <Plus size={18} weight="bold" color="#6366f1" />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</Typography>
            {isEdit && <Typography sx={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' }}>{producto.skuId}</Typography>}
          </Box>
        </Box>
        <Box onClick={!saving ? onClose : undefined} sx={{ cursor: 'pointer', opacity: .6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {errors.general && (
          <Box sx={{ p: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', gap: 1 }}>
            <Warning size={14} weight="fill" color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ fontSize: 12.5, color: '#ef4444' }}>{errors.general}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {Object.keys(LABELS).map(k => (
            <TextField key={k} size="small" label={LABELS[k]}
              value={form[k] || ''}
              type={['contenidoMl', 'pesoLogisticoKg'].includes(k) ? 'number' : 'text'}
              onChange={e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: '' })); }}
              error={!!errors[k]} helperText={errors[k]} disabled={saving}
              inputProps={k === 'pesoLogisticoKg' ? { step: '0.01' } : {}}
              sx={fieldSx(k)}
            />
          ))}
        </Box>

        {/* Bitácora de cambios — solo en edición */}
        {isEdit && bitacora.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ClockClockwise size={14} weight="duotone" color="#6366f1" />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '.07em' }}>Bitácora de Cambios</Typography>
            </Box>
            <Box sx={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: .75 }}>
              {bitacora.map((b, i) => (
                <Box key={i} sx={{ p: '7px 12px', borderRadius: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center', animation: 'rowIn .25s ease-out both', '@keyframes rowIn': { from: { opacity: 0, transform: 'translateY(-3px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary, minWidth: 80 }}>{b.campo}</Typography>
                  {/* ANTES — rojo */}
                  <Box sx={{ px: 1, py: .2, borderRadius: '6px', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{b.antes}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>→</Typography>
                  {/* DESPUÉS — verde */}
                  <Box sx={{ px: 1, py: .2, borderRadius: '6px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{b.despues}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: colors.textSecondary, ml: 'auto' }}>{b.ts}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', color: colors.textSecondary, textTransform: 'none', fontSize: 13 }}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving || (isEdit && !hasChanges)} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={15} weight="bold" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,.35)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)' }, '&:disabled': { background: 'rgba(99,102,241,.3)', boxShadow: 'none' } }}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Modal confirmar eliminar ─────────────────────────────────────────────── */
function ConfirmDeleteModal({ open, producto, onClose, onConfirm, deleting }) {
  const colors = useColors();
  return (
    <Dialog open={open} onClose={!deleting ? onClose : undefined}
      PaperProps={{ sx: { borderRadius: '20px', maxWidth: 400, width: '100%', background: colors.surface, border: `1px solid ${colors.border}` } }}>
      <DialogContent sx={{ textAlign: 'center', py: 3.5 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash size={24} weight="duotone" color="#ef4444" />
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text, mb: 1 }}>¿Eliminar producto?</Typography>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
          Se eliminará <strong style={{ color: colors.text }}>{producto?.marca} {producto?.presentacion}</strong>.<br />Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: 'center' }}>
        <Button onClick={onClose} disabled={deleting} sx={{ borderRadius: '10px', color: colors.textSecondary, textTransform: 'none', px: 3 }}>Cancelar</Button>
        <Button onClick={onConfirm} disabled={deleting} variant="contained"
          startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Trash size={14} />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,.3)', '&:hover': { background: '#dc2626' } }}>
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Catalogo() {
  const colors = useColors();
  const [todos, setTodos]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando]   = useState(null);
  const [delModal, setDelModal]   = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [detalleSku, setDetalleSku] = useState(null); // SKU seleccionado para panel
  const [refreshBitacora, setRefreshBitacora] = useState(0); 

  const showToast = (msg, color = '#22c55e') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.productos.listar({ buscar: search });
      setTodos(res.content || []);
      setPage(1);
    } catch {
      setTodos([]);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  // Paginación local
  const totalPages = Math.ceil(todos.length / PAGE_SIZE);
  const productos  = todos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSaved = (msg) => {
    setModalOpen(false); setEditando(null);
    // Refrescar panel de detalle si el SKU editado es el que está abierto
    if (detalleSku && editando?.skuId === detalleSku.skuId) {
      setDetalleSku(prev => ({ ...prev, ...editando }));
      setRefreshBitacora(v => v + 1);
    }
    showToast(msg); fetchProductos();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.productos.eliminar(delTarget.skuId);
      setDelModal(false); setDelTarget(null);
      showToast('Producto eliminado');
      fetchProductos();
    } catch (err) {
      showToast(err.response?.status === 409 ? 'No se puede eliminar: tiene lotes activos' : 'Error al eliminar', '#ef4444');
      setDelModal(false);
    } finally { setDeleting(false); }
  };

  const COLS = ['SKU', 'Marca', 'Presentación', 'Contenido', 'Peso', 'Stock', 'Creado', ''];

  return (
    <Box sx={{ animation: 'pageIn .35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Catálogo de Productos</Typography>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: .5 }}>Gestión de SKUs · Haz clic en <PencilSimple size={12} weight="bold" /> para editar y ver bitácora de cambios</Typography>
        </Box>
        <Button onClick={() => { setEditando(null); setModalOpen(true); }} variant="contained"
          startIcon={<Plus size={16} weight="bold" />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 2.5, height: 42, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,.4)', '&:hover': { background: 'linear-gradient(135deg,#818cf8,#a78bfa)', transform: 'translateY(-1px)' }, transition: 'all .2s' }}>
          Nuevo Producto
        </Button>
      </Box>

      {/* Search + resumen */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar por marca o presentación…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={17} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ maxWidth: 380, '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text } }} />
        {!loading && todos.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ px: 1.5, py: .4, borderRadius: '8px', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.2)' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{todos.length} productos</Typography>
            </Box>
            {totalPages > 1 && <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Pág. {page}/{totalPages}</Typography>}
          </Box>
        )}
      </Box>

      {/* Tabla + Panel */}
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'start' }}>
        <Box sx={{ flex: 1, minWidth: 0, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}><CircularProgress size={28} sx={{ color: '#6366f1' }} /></Box>
        ) : todos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 7 }}>
            <Package size={40} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>{search ? 'Sin resultados para la búsqueda' : 'No hay productos en el catálogo'}</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {COLS.map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '.06em', background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}`, py: 1.5, px: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {productos.map((p, i) => {
                  const isActive = detalleSku?.skuId === p.skuId;
                  return (
                    <TableRow key={p.skuId}
                      onClick={() => setDetalleSku(prev => prev?.skuId === p.skuId ? null : p)}
                      sx={{ cursor: 'pointer', '& td': { borderBottom: `1px solid ${colors.border}`, px: 2, py: 1.25 }, animation: `rowIn .3s ease-out ${i * .03}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } }, '&:last-child td': { borderBottom: 'none' }, background: isActive ? 'rgba(99,102,241,.06)' : 'transparent', borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`, '&:hover': { background: isActive ? 'rgba(99,102,241,.09)' : `${colors.border}50` }, transition: 'all .15s' }}>
                      <TableCell><Typography sx={{ fontSize: 11.5, fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>{p.skuId}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{p.marca}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>{p.presentacion}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>{p.contenidoMl} ml</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>{p.pesoLogisticoKg} kg</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: .75, px: 1.25, py: .3, borderRadius: '20px', background: (p.stockDisponible || 0) > 0 ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${(p.stockDisponible || 0) > 0 ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}` }}>
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: (p.stockDisponible || 0) > 0 ? '#22c55e' : '#ef4444' }} />
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: (p.stockDisponible || 0) > 0 ? '#22c55e' : '#ef4444' }}>{p.stockDisponible ?? 0}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{formatFecha(p.creadoEl || p.fechaCreacion) || '—'}</Typography></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: .75 }}>
                          <Tooltip title="Editar producto">
                            <Box onClick={() => { setEditando(p); setModalOpen(true); }}
                              sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', '&:hover': { background: 'rgba(99,102,241,.18)', transform: 'scale(1.08)' } }}>
                              <PencilSimple size={14} weight="bold" color="#6366f1" />
                            </Box>
                          </Tooltip>
                          <Tooltip title="Eliminar producto">
                            <Box onClick={() => { setDelTarget(p); setDelModal(true); }}
                              sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', '&:hover': { background: 'rgba(239,68,68,.18)', transform: 'scale(1.08)' } }}>
                              <Trash size={14} weight="bold" color="#ef4444" />
                            </Box>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Box>

        {/* Panel lateral detalle SKU */}
        {detalleSku && (
          <DetalleSKUPanel
            sku={detalleSku}
            onClose={() => setDetalleSku(null)}
            onEdit={p => { setEditando(p); setModalOpen(true); }}
            onDelete={p => { setDelTarget(p); setDelModal(true); }}
            refreshTrigger={refreshBitacora}
          />
        )}
      </Box>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)}
            sx={{ '& .MuiPaginationItem-root': { color: colors.textSecondary }, '& .Mui-selected': { background: 'rgba(99,102,241,.18) !important', color: '#6366f1', fontWeight: 700 } }} />
        </Box>
      )}

      <ProductoModal open={modalOpen} producto={editando} onClose={() => { setModalOpen(false); setEditando(null); }} onSaved={handleSaved} />
      <ConfirmDeleteModal open={delModal} producto={delTarget} onClose={() => { setDelModal(false); setDelTarget(null); }} onConfirm={handleDeleteConfirm} deleting={deleting} />
    </Box>
  );
}
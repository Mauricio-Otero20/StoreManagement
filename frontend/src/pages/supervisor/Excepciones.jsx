import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, TextField, Select, MenuItem, InputAdornment, Dialog, DialogTitle, DialogContent, Pagination } from '@mui/material';
import { Warning, Eye, Plus, X, MagnifyingGlass, WarningCircle, Fire, CheckCircle } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha, formatRelativo } from '../../utils/formatters';
import ReportarExcepcionModal from '../../components/ReportarExcepcionModal';

const TIPOS = ['AVERIA', 'VENCIMIENTO', 'DIFERENCIA', 'FALTANTE'];
const TIPO_CONFIG = {
  AVERIA:     { label: 'Avería',                  color: '#ef4444', Icon: WarningCircle },
  VENCIMIENTO:{ label: 'Vencimiento',             color: '#f59e0b', Icon: Warning },
  DIFERENCIA: { label: 'Diferencia de Inventario', color: '#8b5cf6', Icon: Fire },
  FALTANTE:   { label: 'Faltante',                color: '#3b82f6', Icon: Warning },
};
const ROLES_AUTORIZADOS = ['SUPERVISOR_INVENTARIO', 'OPERARIO_PICKING', 'OPERARIO_DESPACHO', 'OPERARIO_RECEPCION'];
const puedeRegistrar = () => ROLES_AUTORIZADOS.includes(localStorage.getItem('sm_rol'));

/* (RegistrarModal reemplazado por componente reutilizable ReportarExcepcionModal) */

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function ExcepcionesPage() {
  const colors = useColors();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState('');
  const [skuFiltro, setSkuFil] = useState('');
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [toast, setToast] = useState('');
  const puedeCrear = puedeRegistrar();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // Limpiar parámetros antes de enviar: eliminar undefined o ""
      const params = Object.fromEntries(
        Object.entries(applied).filter(([_, v]) => v != null && v !== '')
      );
      setLista(await api.excepciones.listar(params));
    }
    catch { setLista([]); } finally { setLoading(false); }
  }, [applied]);

  const paginated = lista.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));

  const fetchUltimas = useCallback(async () => {
    try {
      const nuevas = await api.excepciones.ultimas(5);
      if (nuevas && nuevas.length > 0) {
        setLista(prev => [...nuevas, ...prev]);
        showToast(`${nuevas.length} nueva(s) excepción(es) registrada(s)`);
      }
    } catch { /* Silencioso */ }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchUltimas();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUltimas, loading]);

  const handleRegistrado = () => { setModal(false); showToast('Excepción registrada exitosamente'); fetch(); };

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {toast && (
        <Box sx={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, p: '12px 18px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', gap: 1.5, alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'tIn .3s cubic-bezier(.34,1.56,.64,1) both', '@keyframes tIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
          <CheckCircle size={15} weight="fill" color="#22c55e" />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{toast}</Typography>
          <Box onClick={() => setToast('')} sx={{ ml: 1, cursor: 'pointer', opacity: .6, '&:hover': { opacity: 1 } }}><X size={13} color="#22c55e" /></Box>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warning size={20} weight="duotone" color="#ef4444" />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Excepciones de Inventario</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>Averías, vencimientos y faltantes reportados</Typography>
        </Box>
        {puedeCrear && (
          <Button onClick={() => setModal(true)} variant="contained" startIcon={<Plus size={16} weight="bold" />}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 2.5, height: 42, background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.4)', '&:hover': { transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}> Registrar Excepción
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Box sx={{ p: '14px 16px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}`, mb: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <Select value={tipo} onChange={e => setTipo(e.target.value)} displayEmpty size="small"
          sx={{ height: 38, minWidth: 160, borderRadius: '10px', backgroundColor: colors.surfaceAlt, color: tipo ? colors.text : '#64748b', fontSize: 13, '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444' } }}>
          <MenuItem value="">Todos los tipos</MenuItem>
          {TIPOS.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{TIPO_CONFIG[t].label}</MenuItem>)}
        </Select>
        <TextField size="small" placeholder="SKU" value={skuFiltro} onChange={e => setSkuFil(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={14} color={colors.textSecondary} /></InputAdornment> }}
          sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: colors.surfaceAlt, height: 38, '& fieldset': { borderColor: colors.border } }, '& input': { color: colors.text, fontSize: 13 } }}
        />
        <Button onClick={() => { setApplied({ tipo: tipo || undefined, skuId: skuFiltro || undefined }); setPage(0); }} variant="contained"
          sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          Filtrar
        </Button>
        {(applied.tipo || applied.skuId) && (
          <Button onClick={() => { setTipo(''); setSkuFil(''); setApplied({}); setPage(0); }} startIcon={<X size={13} />}
            sx={{ height: 38, borderRadius: '10px', textTransform: 'none', fontSize: 12, color: colors.textSecondary }}>
            Limpiar
          </Button>
        )}
      </Box>

      {/* Tabla */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#ef4444' }} /></Box>
        ) : lista.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Warning size={38} weight="duotone" color="#64748b" style={{ marginBottom: 12 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>No hay excepciones registradas</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '100px 110px 110px 110px 80px 1fr 150px 36px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['Fecha', 'Tipo', 'SKU', 'Lote', 'Cant.', 'Descripción', 'Usuario', ''].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {paginated.map((e, i) => {
              const cfg = TIPO_CONFIG[e.tipoExcepcion] || { label: e.tipoExcepcion, color: '#64748b', Icon: Warning };
              return (
                <Box key={e.excepcionId || i} sx={{ display: 'grid', gridTemplateColumns: '100px 110px 110px 110px 80px 1fr 150px 36px', gap: 1.5, px: 2.5, py: 1.75, borderTop: `1px solid ${colors.border}`, '&:hover': { background: `${colors.border}40` }, '&:last-child': { borderBottom: 'none' }, transition: 'background 0.15s', animation: `rowIn 0.3s ease-out ${i * 0.03}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, alignSelf: 'center' }}>{formatFecha(e.fechaRegistro)}</Typography>
                  <Box sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <cfg.Icon size={13} weight="fill" color={cfg.color} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'monospace', alignSelf: 'center' }}>{e.skuId || '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, alignSelf: 'center' }}>{e.codigoLote || '—'}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: cfg.color, alignSelf: 'center' }}>{e.cantidadAfectada}</Typography>
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.descripcion || '—'}
                  </Typography>
                  <Box sx={{ alignSelf: 'center' }}>
                    <Typography sx={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>{e.operarioNombre || '—'}</Typography>
                    {e.operarioCedula && (
                      <Typography sx={{ fontSize: 10, color: colors.textSecondary }}>CC: {e.operarioCedula}</Typography>
                    )}
                  </Box>
                  <Box onClick={() => setDetalle(e)} sx={{ alignSelf: 'center', width: 30, height: 30, borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { background: 'rgba(99,102,241,0.18)' } }}>
                    <Eye size={14} weight="duotone" color="#6366f1" />
                  </Box>
                </Box>
              );
            })}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${colors.border}` }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} size="small"
                  sx={{ '& .MuiPaginationItem-root': { color: colors.textSecondary }, '& .Mui-selected': { background: 'rgba(99,102,241,.18) !important', color: '#6366f1', fontWeight: 700 } }} />
              </Box>
            )}
            </Box>
          </>
        )}
      </Box>

      <ReportarExcepcionModal open={modal} onClose={() => setModal(false)} onRegistrado={handleRegistrado} />

      {/* Modal Detalle Excepción */}
      {detalle && (() => {
        const cfg = TIPO_CONFIG[detalle.tipoExcepcion] || { label: detalle.tipoExcepcion, color: '#64748b', Icon: Warning };
        return (
          <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}` } }}>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <cfg.Icon size={18} weight="duotone" color={cfg.color} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Detalle de Excepción</Typography>
                  <Typography sx={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</Typography>
                </Box>
              </Box>
              <Box onClick={() => setDetalle(null)} sx={{ cursor: 'pointer', opacity: .6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
            </DialogTitle>
            <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[['SKU', detalle.skuId], ['Código Lote', detalle.codigoLote], ['Cantidad Afectada', detalle.cantidadAfectada], ['Fecha', formatFecha(detalle.fechaRegistro)], ['Operario', detalle.operarioNombre || '—']].map(([label, val]) => val && (
                <Box key={label} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, minWidth: 120 }}>{label}</Typography>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: label === 'SKU' || label === 'Código Lote' ? 'monospace' : 'inherit' }}>{val}</Typography>
                    {label === 'Operario' && detalle.operarioCedula && (
                      <Typography sx={{ fontSize: 10.5, color: colors.textSecondary }}>CC: {detalle.operarioCedula}</Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {detalle.descripcion && (
                <Box sx={{ p: '12px 16px', borderRadius: '12px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`, mt: .5 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: colors.textSecondary, mb: .75, textTransform: 'uppercase', letterSpacing: '.07em' }}>Descripción</Typography>
                  <Typography sx={{ fontSize: 13.5, color: colors.text, lineHeight: 1.6 }}>{detalle.descripcion}</Typography>
                </Box>
              )}
              {detalle.evidenciaUrl && (
                <Box sx={{ p: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#6366f1', mb: .5 }}>Evidencia</Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#6366f1', wordBreak: 'break-all' }}>{detalle.evidenciaUrl}</Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}
    </Box>
  );
}

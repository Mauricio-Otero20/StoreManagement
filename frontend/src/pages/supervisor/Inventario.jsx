import { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Autocomplete, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Pagination,
} from '@mui/material';
import { Fire, Warning, CheckCircle, Package, Lock, PencilSimple, X, Check, ClockClockwise, Eye } from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import { formatFecha } from '../../utils/formatters';
import ReportarExcepcionModal from '../../components/ReportarExcepcionModal';

/* ── helpers ─────────────────────────────────────────────── */
function diasHasta(fecha) {
  if (!fecha) return null;
  return Math.ceil((new Date(fecha) - new Date()) / 86400000);
}
function colorDias(d) {
  if (d == null) return '#64748b';
  if (d <= 7) return '#ef4444';
  if (d <= 30) return '#f59e0b';
  return '#22c55e';
}

/* ── AlertaBadge ─────────────────────────────────────────── */
function AlertaBadge({ dias }) {
  if (dias == null) return null;
  if (dias <= 7) return <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}><Fire size={13} weight="fill" color="#ef4444" /><Chip label={`${dias}d`} size="small" sx={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', borderRadius: '6px', fontSize: 11, fontWeight: 700, height: 20 }} /></Box>;
  if (dias <= 30) return <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}><Warning size={13} weight="fill" color="#f59e0b" /><Chip label={`${dias}d`} size="small" sx={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.25)', borderRadius: '6px', fontSize: 11, fontWeight: 700, height: 20 }} /></Box>;
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}><CheckCircle size={13} weight="fill" color="#22c55e" /><Chip label="OK" size="small" sx={{ background: 'rgba(34,197,94,.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,.25)', borderRadius: '6px', fontSize: 11, fontWeight: 700, height: 20 }} /></Box>;
}

/* ── EstadoBadge ─────────────────────────────────────────── */
function EstadoBadge({ estado }) {
  const map = {
    DISPONIBLE: { label: 'Disponible', color: '#22c55e' },
    COMPROMETIDO: { label: 'Comprometido', color: '#f59e0b' },
    AGOTADO: { label: 'Agotado', color: '#64748b' },
    VENCIDO: { label: 'Vencido', color: '#ef4444' },
  };
  const c = map[estado] || { label: estado || 'Disponible', color: '#22c55e' };
  return <Chip label={c.label} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30`, borderRadius: '6px' }} />;
}



/* ── Lote Detalle Modal ─────────────────────────────────── */
function LoteDetalleModal({ lote, skuId, open, onClose, onReportarExcepcion }) {
  const colors = useColors();
  if (!lote) return null;
  const dias = lote.diasHastaVencimiento ?? diasHasta(lote.fechaVencimiento);
  const col = colorDias(dias);
  const rows = [
    ['Código Lote',    lote.codigoLote,          true ],
    ['Vencimiento',    formatFecha(lote.fechaVencimiento), false],
    ['Expedición',    formatFecha(lote.fechaExpedicion) || '—', false],
    ['Costo Unitario', lote.costoUnitarioProducto != null ? `$${Number(lote.costoUnitarioProducto).toLocaleString()}` : '—', false],
    ['Cantidad',       `${lote.cantidad ?? 0} und`, false],
    ['Estado',         lote.estado || 'DISPONIBLE', false],
    ['Días p/Vencer',  dias != null ? `${dias} días` : '—', false],
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 24px 48px rgba(0,0,0,.4)' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${col}15`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dias != null && dias <= 7 ? <Fire size={18} weight="fill" color={col} /> : <Package size={18} weight="duotone" color={col} />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Detalle del Lote</Typography>
            <Typography sx={{ fontSize: 11, color: col, fontWeight: 700, fontFamily: 'monospace' }}>{lote.codigoLote}</Typography>
          </Box>
        </Box>
        <Box onClick={onClose} sx={{ cursor: 'pointer', opacity: .6, '&:hover': { opacity: 1 } }}><X size={18} color={colors.textSecondary} /></Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: .75, mb: 2 }}>
          {rows.map(([label, val, mono]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .6, borderBottom: `1px solid ${colors.border}30` }}>
              <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: mono ? '#8b5cf6' : col === '#22c55e' && label === 'Días p/Vencer' ? '#22c55e' : label === 'Días p/Vencer' ? col : colors.text, fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</Typography>
            </Box>
          ))}
        </Box>
        <Button
          onClick={() => onReportarExcepcion(skuId, lote.codigoLote)}
          fullWidth variant="outlined" size="small"
          startIcon={<Warning size={14} weight="duotone" />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontSize: 12.5, fontWeight: 600, borderColor: '#ef444440', color: '#ef4444', '&:hover': { borderColor: '#ef4444', background: 'rgba(239,68,68,.06)' } }}>
          Reportar excepción de este lote
        </Button>
      </DialogContent>
    </Dialog>
  );
}

const ROWS_PER_PAGE = 8;

/* ── MAIN ────────────────────────────────────────────────── */
export default function Inventario() {
  const colors = useColors();
  const [productos, setProductos]   = useState([]);
  const [prodSel, setProdSel]       = useState(null);
  const [stockData, setStockData]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingProds, setLP]       = useState(false);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [loteModal, setLoteModal]   = useState(null); // lote seleccionado
  const [excModal, setExcModal]     = useState({ open: false, skuId: '', lote: '' });

  const loadProductos = async () => {
    if (productos.length) return;
    setLP(true);
    try { const r = await api.productos.listar({}); setProductos(r.content || []); }
    catch { } finally { setLP(false); }
  };

  const consultarStock = async (sku) => {
    if (!sku) { setStockData(null); return; }
    setLoading(true); setError(''); setPage(1);
    try { setStockData(await api.inventario.getStock(sku)); }
    catch { setError('No se pudo obtener el stock'); setStockData(null); }
    finally { setLoading(false); }
  };

  // ── Mapping correcto de StockDisponibleDTO ──
  // { sku:{skuId,marca,presentacion}, disponibles, comprometidos, fisicoTotal, lotes:[{codigoLote, fechaVencimiento, cantidad, diasHastaVencimiento, estado}] }
  const lotes = stockData?.lotes || [];
  const totalDisp = stockData?.disponibles ?? 0;
  const totalComp = stockData?.comprometidos ?? 0;
  const criticos = lotes.filter(l => (l.diasHastaVencimiento ?? diasHasta(l.fechaVencimiento) ?? 999) <= 30);

  // Paginación
  const totalPages = Math.ceil(lotes.length / ROWS_PER_PAGE);
  const lotesPag = lotes.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <Box sx={{ animation: 'pageIn .35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em' }}>Consulta de Inventario</Typography>
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mt: .5 }}>Stock disponible por SKU · Orden FEFO</Typography>
      </Box>

      {/* Buscador */}
      <Autocomplete options={productos} getOptionLabel={o => `${o.marca} ${o.presentacion}`}
        onOpen={loadProductos} loading={loadingProds} value={prodSel}
        onChange={(_, v) => { setProdSel(v); consultarStock(v?.skuId); }}
        sx={{ maxWidth: 500, mb: 3 }}
        renderInput={p => (
          <TextField {...p} label="Buscar producto por marca" size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', backgroundColor: colors.surfaceAlt, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } }, '& input': { color: colors.text }, '& label': { color: colors.textSecondary }, '& label.Mui-focused': { color: '#6366f1' } }}
          />
        )}
      />

      {!prodSel && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Package size={48} weight="duotone" color="#64748b" style={{ marginBottom: 14, opacity: .5 }} />
          <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Selecciona un producto para ver su stock</Typography>
        </Box>
      )}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>}
      {error && <Box sx={{ p: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}><Typography sx={{ fontSize: 13, color: '#ef4444' }}>{error}</Typography></Box>}

      {stockData && !loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Resumen SKU */}
          <Box sx={{ p: '20px 24px', borderRadius: '16px', background: colors.surface, border: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: .5 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: colors.text, letterSpacing: '-0.02em' }}>{stockData.sku?.marca}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>{stockData.sku?.presentacion} · {stockData.sku?.contenidoMl} ml</Typography>
            </Box>
            {/* Disponible */}
            <Box sx={{ textAlign: 'center', px: 2.5, py: 1.5, borderRadius: '12px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)' }}>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#22c55e', letterSpacing: '-0.03em', lineHeight: 1 }}>{totalDisp} und</Typography>
              <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: .5 }}>Stock Disponible</Typography>
            </Box>
            {/* Comprometido */}
            <Box sx={{ textAlign: 'center', px: 2.5, py: 1.5, borderRadius: '12px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, justifyContent: 'center' }}>
                <Lock size={14} weight="duotone" color="#f59e0b" />
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em', lineHeight: 1 }}>{totalComp} und</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: .5 }}>Comprometido</Typography>
            </Box>
            {/* Lotes */}
            <Box sx={{ textAlign: 'center', px: 2.5, py: 1.5, borderRadius: '12px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.03em', lineHeight: 1 }}>{lotes.length}</Typography>
              <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: .5 }}>Lotes activos</Typography>
            </Box>
            {/* Críticos */}
            {criticos.length > 0 && (
              <Box sx={{ textAlign: 'center', px: 2.5, py: 1.5, borderRadius: '12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, justifyContent: 'center' }}>
                  <Warning size={14} weight="fill" color="#ef4444" />
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#ef4444', letterSpacing: '-0.03em', lineHeight: 1 }}>{criticos.length}</Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: .5 }}>Lotes críticos</Typography>
              </Box>
            )}
          </Box>

          {/* Tabla lotes paginada */}
          <Box sx={{ borderRadius: '16px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 120px 90px 110px 110px 38px', gap: 1.5, px: 2.5, py: 1.5, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
              {['Código Lote', 'Vence', 'Stock', 'Días p/Vencer', 'Estado', ''].map(h => (
                <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
              ))}
            </Box>
            {lotes.length === 0
              ? <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>Sin lotes activos</Typography></Box>
              : lotesPag.map((l, i) => {
                const dias = l.diasHastaVencimiento ?? diasHasta(l.fechaVencimiento);
                const col = colorDias(dias);
                const esCrit = dias != null && dias <= 30;
                return (
                  <Box key={i}
                    onClick={() => setLoteModal(l)}
                    sx={{ display: 'grid', gridTemplateColumns: '1.4fr 120px 90px 110px 110px 38px', gap: 1.5, px: 2.5, py: 1.75, borderTop: `1px solid ${colors.border}`, '&:hover': { background: `${col}10`, cursor: 'pointer' }, transition: 'background .15s', borderLeft: `3px solid ${col}`, background: esCrit ? `${col}06` : 'transparent', animation: `rowIn .3s ease-out ${i * .04}s both`, '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-4px)' }, to: { opacity: 1, transform: 'translateX(0)' } } }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center', fontFamily: 'monospace' }}>{l.codigoLote}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: col, alignSelf: 'center', fontWeight: esCrit ? 700 : 400 }}>{formatFecha(l.fechaVencimiento)}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#22c55e', alignSelf: 'center' }}>{l.cantidad ?? 0}</Typography>
                    <Box sx={{ alignSelf: 'center', display: 'inline-flex' }}><AlertaBadge dias={dias} /></Box>
                    <Box sx={{ alignSelf: 'center' }}><EstadoBadge estado={l.estado || 'DISPONIBLE'} /></Box>
                    <Box sx={{ alignSelf: 'center', width: 28, height: 28, borderRadius: '8px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={13} weight="duotone" color="#6366f1" />
                    </Box>
                  </Box>
                );
              })
            }
          </Box>

          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: .5 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)}
                sx={{ '& .MuiPaginationItem-root': { color: colors.textSecondary }, '& .Mui-selected': { background: 'rgba(99,102,241,.18) !important', color: '#6366f1', fontWeight: 700 } }} />
            </Box>
          )}

          {/* Leyenda */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px: .5 }}>
            {[['#22c55e', 'Disponible'], ['#f59e0b', 'Comprometido'], ['#ef4444', 'Crítico ≤ 30 días']].map(([color, label]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: .75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Modal Detalle Lote */}
      <LoteDetalleModal
        lote={loteModal}
        skuId={prodSel?.skuId}
        open={!!loteModal}
        onClose={() => setLoteModal(null)}
        onReportarExcepcion={(skuId, lote) => {
          setLoteModal(null);
          setExcModal({ open: true, skuId, lote });
        }}
      />

      {/* Modal Excepción por lote */}
      <ReportarExcepcionModal
        open={excModal.open}
        onClose={() => setExcModal({ open: false, skuId: '', lote: '' })}
        skuIdInicial={excModal.skuId}
        loteInicial={excModal.lote}
        onRegistrado={() => setExcModal({ open: false, skuId: '', lote: '' })}
      />
    </Box>
  );
}
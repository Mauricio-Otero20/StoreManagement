import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Collapse } from '@mui/material';
import {
  ArrowLeft, Package, User, CheckCircle, Clock,
  Truck, Warning, CaretDown, CaretUp,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import StatusBadge from '../../components/common/StatusBadge';
import { formatFecha, formatFechaHora, formatCOP } from '../../utils/formatters';

/* ── Timeline de estados ──────────────────────────────────────────────────── */
const ESTADOS_ORDEN = ['ESPERANDO_RUTA', 'RUTA_ASIGNADA', 'COMPROMETIDO', 'EN_PICKING', 'DESPACHADO', 'ENTREGADO'];
const ESTADO_ICON   = {
  ESPERANDO_RUTA: Clock,
  COMPROMETIDO:   CheckCircle,
  EN_PICKING:     Package,
  DESPACHADO:     Truck,
  ENTREGADO:      CheckCircle,
};

function Timeline({ estadoActual }) {
  const colors = useColors();
  const idxActual = ESTADOS_ORDEN.indexOf(estadoActual);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
      {ESTADOS_ORDEN.map((e, i) => {
        const done   = i <= idxActual;
        const active = i === idxActual;
        const Icon   = ESTADO_ICON[e] || Clock;
        const color  = active ? '#6366f1' : done ? '#22c55e' : colors.border;
        return (
          <Box key={e} sx={{ display: 'flex', alignItems: 'center', flex: i < ESTADOS_ORDEN.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%',
                background: active ? '#6366f118' : done ? '#22c55e18' : colors.surfaceAlt,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <Icon size={16} weight={done ? 'duotone' : 'regular'} color={color} />
              </Box>
              <Typography sx={{ fontSize: 9.5, color, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', textAlign: 'center' }}>
                {e.replace(/_/g, '\n')}
              </Typography>
            </Box>
            {i < ESTADOS_ORDEN.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mx: 0.75, mb: 3.5, background: i < idxActual ? '#22c55e' : colors.border, transition: 'background 0.3s' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/* ── Fila de línea con lotes expandibles ─────────────────────────────────── */
function LineaRow({ linea, idx, hasLotes }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        onClick={() => hasLotes && setOpen(o => !o)}
        sx={{
            display: 'grid', gridTemplateColumns: '1fr 100px 110px 36px',
            gap: 1.5, px: 2.5, py: 1.5,
          borderTop: `1px solid ${colors.border}`,
          transition: 'background 0.15s',
          cursor: hasLotes ? 'pointer' : 'default',
          '&:hover': hasLotes ? { background: `${colors.border}40` } : {},
        }}>
        <Box>
          {/* LineaPedidoResponseDTO: producto es ProductoInfoDTO {skuId, marca, presentacion, contenidoMl} */}
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{linea.producto?.marca || linea.marca}</Typography>
          <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>{linea.producto?.presentacion || linea.presentacion} · <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{linea.producto?.skuId || linea.skuId}</span></Typography>
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, alignSelf: 'center' }}>{linea.cantidadSolicitada}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: linea.cantidadConfirmada != null ? '#22c55e' : colors.textSecondary, alignSelf: 'center' }}>
          {linea.cantidadConfirmada ?? '—'}
        </Typography>
        <Box sx={{ alignSelf: 'center', display: 'flex', justifyContent: 'center' }}>
          {hasLotes && (open ? <CaretUp size={14} color={colors.textSecondary} /> : <CaretDown size={14} color={colors.textSecondary} />)}
        </Box>
      </Box>
      {hasLotes && (
        <Collapse in={open}>
          <Box sx={{ mx: 2.5, mb: 1, p: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
              Lotes comprometidos
            </Typography>
            {linea.lotesComprometidos?.map((lt, j) => (
              <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderTop: j > 0 ? `1px solid rgba(99,102,241,0.1)` : 'none' }}>
                <Typography sx={{ fontSize: 12, color: colors.text, fontFamily: 'monospace' }}>{lt.codigoLote}</Typography>
                <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>
                  Vence: {formatFecha(lt.fechaVencimiento)} · <strong style={{ color: '#6366f1' }}>{lt.cantidadComprometida} und</strong>
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </>
  );
}

/* ── Info card genérica ───────────────────────────────────────────────────── */
function InfoCard({ title, Icon, iconColor, children }) {
  const colors = useColors();
  return (
    <Box sx={{ p: '18px 20px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: `${iconColor}15`, border: `1px solid ${iconColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} weight="duotone" color={iconColor} />
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function DetallePedido() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const colors     = useColors();
  const [pedido, setPedido]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const nuevo = location.state?.nuevo;
  const numNuevo = location.state?.numero;

  useEffect(() => {
    setLoading(true);
    api.pedidos.detalle(id)
      .then(data => { setPedido(data); setLoading(false); })
      .catch(() => {
        // Fallback: search in list (for cases where id might be numeroPedido)
        api.pedidos.listar({}).then(res => {
          const found = (res.content || []).find(p => String(p.pedidoId) === id || p.numeroPedido === id);
          if (found) setPedido(found);
          else setError('No se encontró el pedido');
        }).catch(() => setError('Error al cargar el pedido'))
          .finally(() => setLoading(false));
      });
  }, [id]);

  const rol = localStorage.getItem('sm_rol');
  const backRoute = rol === 'ASESOR_COMERCIAL' ? '/asesor/pedidos' : '/supervisor/asignacion';

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  if (error || !pedido) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Warning size={40} weight="duotone" color="#ef4444" style={{ marginBottom: 12 }} />
      <Typography sx={{ color: colors.textSecondary, mb: 2 }}>{error || 'Pedido no encontrado'}</Typography>
      <Button onClick={() => navigate(backRoute)} startIcon={<ArrowLeft size={14} />}
        sx={{ borderRadius: '10px', textTransform: 'none', color: '#6366f1' }}>
        Volver
      </Button>
    </Box>
  );

  const lineas = pedido.lineas || [];
  const totalSolicitado  = pedido.totalSolicitado  || lineas.reduce((s, l) => s + (l.cantidadSolicitada  || 0), 0);
  const totalConfirmado  = pedido.totalConfirmado   || lineas.reduce((s, l) => s + (l.cantidadConfirmada  || 0), 0);

  return (
    <Box sx={{ animation: 'pageIn 0.35s ease-out both', '@keyframes pageIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: colors.textSecondary, fontSize: 13 }}>
        <Typography onClick={() => navigate(backRoute)} sx={{ cursor: 'pointer', '&:hover': { color: '#6366f1' }, transition: 'color 0.2s' }}>Pedidos</Typography>
        <Typography>›</Typography>
        <Typography sx={{ color: '#6366f1', fontWeight: 700 }}>{pedido.numeroPedido || id}</Typography>
      </Box>

      {/* Toast nuevo pedido */}
      {nuevo && (
        <Box sx={{ p: '12px 16px', borderRadius: '12px', mb: 2.5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <CheckCircle size={18} weight="fill" color="#22c55e" />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
            Pedido {numNuevo || pedido.numeroPedido} creado exitosamente en estado ESPERANDO_RUTA
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header card */}
        <InfoCard title="Información del pedido" Icon={Package} iconColor="#6366f1">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5 }}>
            {[
              { l: 'N° Pedido',   v: pedido.numeroPedido || id },
              { l: 'Estado',      v: <StatusBadge estado={pedido.estado} tipo="pedido" size="md" /> },
              { l: 'Creado',      v: formatFechaHora(pedido.fechaCreacion) },
              { l: 'Comprometido',v: formatFechaHora(pedido.fechaCompromiso) },
            ].map(({ l, v }) => (
              <Box key={l}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</Typography>
                <Box sx={{ mt: 0.25 }}>
                  {typeof v === 'string'
                    ? <Typography sx={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{v || '—'}</Typography>
                    : v
                  }
                </Box>
              </Box>
            ))}
          </Box>
        </InfoCard>

        {/* Cliente card */}
        <InfoCard title="Datos del cliente" Icon={User} iconColor="#3b82f6">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5 }}>
            {[
              { l: 'Nombre',    v: pedido.clienteNombre },
              { l: 'Cédula',    v: pedido.clienteCc },
              { l: 'Dirección', v: pedido.direccionEntrega || '—' },
            ].map(({ l, v }) => {
              const noDisponible = v === 'Cliente no disponible';
              return (
                <Box key={l}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</Typography>
                  {noDisponible ? (
                    <Box sx={{ mt: 0.25, display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.35, borderRadius: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <Warning size={13} weight="fill" color="#f59e0b" />
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{v}</Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 13, color: colors.text, fontWeight: 500, mt: 0.25 }}>{v || '—'}</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </InfoCard>

        {/* Timeline */}
        <Box sx={{ p: '18px 20px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text, mb: 2 }}>Seguimiento del pedido</Typography>
          <Timeline estadoActual={pedido.estado} />
        </Box>

        {/* Líneas */}
        <Box sx={{ borderRadius: '14px', overflowX: 'auto', overflowY: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface }}>
          <Box sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceAlt }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Líneas del pedido</Typography>
            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>{lineas.length} producto(s)</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 36px', gap: 1.5, px: 2.5, py: 1.25, background: colors.surfaceAlt }}>
            {['Producto', 'Solicitado', 'Confirmado', ''].map(h => (
              <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Typography>
            ))}
          </Box>
          {lineas.length === 0
            ? <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>Sin líneas registradas</Typography></Box>
            : lineas.map((l, i) => (
              <LineaRow
                key={l.productoPedidoId || i}
                linea={l}
                idx={i}
                hasLotes={!!(l.lotesComprometidos?.length)}
              />
            ))
          }
        </Box>

        {/* Totales */}
        <Box sx={{ p: '16px 20px', borderRadius: '14px', background: colors.surface, border: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[
            { l: 'Total solicitado',  v: `${totalSolicitado} und`, color: colors.text     },
            { l: 'Total confirmado',  v: `${totalConfirmado} und`, color: '#22c55e'       },
            { l: 'Costo total',       v: formatCOP(pedido.costoTotal), color: '#f59e0b'   },
            { l: 'Peso logístico',    v: pedido.pesoLogisticoTotal ? `${pedido.pesoLogisticoTotal} kg` : '—', color: colors.text },
            { l: 'Tipo cumplimiento', v: pedido.tipoCumplimiento || '—', color: '#6366f1' },
          ].map(({ l, v, color }) => (
            <Box key={l}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{v}</Typography>
            </Box>
          ))}
        </Box>

        {/* Botón volver */}
        <Box>
          <Button onClick={() => navigate(backRoute)} startIcon={<ArrowLeft size={15} weight="bold" />}
            sx={{ borderRadius: '10px', textTransform: 'none', color: colors.textSecondary, fontWeight: 600, '&:hover': { background: colors.surfaceAlt } }}>
            Volver a la lista
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

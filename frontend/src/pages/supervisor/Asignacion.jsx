import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, CircularProgress, Button,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import {
  UsersThree, Package, ArrowRight, CheckCircle, Warning,
  ArrowsClockwise, Bag, Truck, ClipboardText, Checks,
  HourglassHigh,
} from 'phosphor-react';
import { useColors } from '../../context/ThemeContext';
import api from '../../lib/localApi';
import StatusBadge from '../../components/common/StatusBadge';
import { formatFecha } from '../../utils/formatters';
import { MOCK_USERS } from '../../utils/constants';

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, color, onClose }) {
  return (
    <Box sx={{ position:'fixed', top:20, right:24, zIndex:9999, p:'12px 18px', borderRadius:'12px', background:`${color}15`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', gap:1.5, boxShadow:'0 8px 24px rgba(0,0,0,.25)', animation:'tIn .3s cubic-bezier(.34,1.56,.64,1) both', '@keyframes tIn':{ from:{ opacity:0, transform:'translateX(20px)' }, to:{ opacity:1, transform:'translateX(0)' } } }}>
      <CheckCircle size={16} weight="fill" color={color}/>
      <Typography sx={{ fontSize:13, fontWeight:600, color }}>{msg}</Typography>
    </Box>
  );
}

/* ── Selector de operario ───────────────────────────────────────────────── */
function OperarioSelect({ label, icon: Icon, iconColor, value, onChange, operarios, disabled }) {
  const colors = useColors();
  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
        <Box sx={{ width:26, height:26, borderRadius:'7px', background:`${iconColor}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={13} weight="duotone" color={iconColor}/>
        </Box>
        <Typography sx={{ fontSize:11, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</Typography>
      </Box>
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize:13 }}>Seleccionar operario</InputLabel>
        <Select value={value} onChange={e => onChange(e.target.value)} label="Seleccionar operario" disabled={disabled}
          sx={{ borderRadius:'12px', backgroundColor: colors.surfaceAlt, fontSize:13, '& .MuiOutlinedInput-notchedOutline':{ borderColor: colors.border } }}>
          <MenuItem value=""><em style={{ color:'#64748b', fontSize:13 }}>— Sin asignar —</em></MenuItem>
          {operarios.map(op => {
            const id  = op.operarioId || op.id;
            const nom = op.nombre;
            return (
              <MenuItem key={id} value={id} disabled={op.activo === false} sx={{ fontSize:13 }}>
                <Box>
                  <Typography sx={{ fontSize:13, fontWeight:600 }}>{nom}</Typography>
                  <Typography sx={{ fontSize:10.5, color:'#64748b' }}>CC: {op.cedula}</Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}

/* ── Info de pedido seleccionado ─────────────────────────────────────────── */
function PedidoInfoCard({ pedido }) {
  const colors = useColors();
  return (
    <Box sx={{ p:'16px', borderRadius:'12px', background: colors.surfaceAlt, border:`1px solid ${colors.border}`, mb:1 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
        <Typography sx={{ fontSize:16, fontWeight:800, color: colors.text, fontFamily:'monospace' }}>{pedido.numeroPedido || '—'}</Typography>
        <StatusBadge estado={pedido.estado} tipo="pedido"/>
      </Box>
      
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1.5, mb:1.5 }}>
        <Box>
          <Typography sx={{ fontSize:10, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase' }}>Cliente</Typography>
          <Typography sx={{ fontSize:13, fontWeight:600, color: colors.text }}>{pedido.clienteNombre || '—'}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize:10, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase' }}>Dirección</Typography>
          <Typography sx={{ fontSize:13, color: colors.text }}>{pedido.direccionEntrega || '—'}</Typography>
        </Box>
      </Box>

      <Box sx={{ display:'flex', gap:2, pt:1.5, borderTop:`1px solid ${colors.border}` }}>
        <Box>
          <Typography sx={{ fontSize:10, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase' }}>Unidades</Typography>
          <Typography sx={{ fontSize:13, fontWeight:700, color: colors.text }}>{pedido.totalConfirmado ?? pedido.totalUnidades ?? 0} und</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize:10, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase' }}>Peso</Typography>
          <Typography sx={{ fontSize:13, fontWeight:700, color: colors.text }}>{pedido.pesoLogisticoTotal || '—'} kg</Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* ── Panel según etapa activa ───────────────────────────────────────────── */
function PanelAsignacion({ pedido, etapa, pickOps, despOps, onAsignado }) {
  const colors = useColors();
  const [pickingId, setPickingId]   = useState('');
  const [despachoId, setDespachoId] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  // Inicializar con valores existentes del pedido
  useEffect(() => {
    setPickingId(pedido.operarioPickingId || '');
    setDespachoId(pedido.operarioDespachoId || '');
    setError('');
  }, [pedido.pedidoId]);

  const handleAsignar = async () => {
    setSaving(true); setError('');
    try {
      // Construir request según lo que acepta el backend: AsignarPedidoRequest
      // Solo enviamos el campo que corresponde a esta etapa
      const body = {};
      if (etapa === 'ESPERANDO_RUTA' || etapa === 'COMPROMETIDO') {
        if (!pickingId) { setError('Selecciona un operario de picking'); setSaving(false); return; }
        body.operarioPickingId  = pickingId;
        body.operarioDespachoId = pedido.operarioDespachoId || null;
      } else if (etapa === 'PICKUP') {
        if (!despachoId) { setError('Selecciona un operario de despacho'); setSaving(false); return; }
        body.operarioPickingId  = pedido.operarioPickingId || null;
        body.operarioDespachoId = despachoId;
      }

      await api.pedidos.asignar(pedido.pedidoId, body);
      onAsignado(pedido.numeroPedido || pedido.pedidoId);
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Error al asignar. Verifica la conexión con el backend.');
    } finally { setSaving(false); }
  };

  const resolverOperario = (operarioObj, operarioId, operarios) => {
    if (!operarioObj && !operarioId) return null;
    if (operarioObj && operarioObj.nombre && operarioObj.nombre !== 'Operario no disponible')
      return operarioObj;
    const found = (operarios || []).find(o =>
      String(o.operarioId || o.id) === String(operarioId || operarioObj?.id)
    );
    if (found) return { nombre: found.nombre, cedula: found.cedula, id: found.operarioId || found.id };
    return operarioObj && operarioObj.nombre ? operarioObj : null;
  };

  const renderOperarioBox = (op, label, Icon, color) => (
    <Box sx={{ p:'12px', borderRadius:'12px', background:`${color}0a`, border:`1px solid ${color}25` }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
        <Icon size={14} color={color} weight="duotone" />
        <Typography sx={{ fontSize:11, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase' }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize:14, fontWeight:700, color }}>{op.nombre}</Typography>
      <Typography sx={{ fontSize:11, color: colors.textSecondary }}>CC: {op.cedula || '—'}</Typography>
    </Box>
  );

  const puedeAsignar = (etapa === 'ESPERANDO_RUTA' || etapa === 'COMPROMETIDO') && pickingId ||
                       etapa === 'PICKUP' && despachoId;

  return (
    <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
      <PedidoInfoCard pedido={pedido}/>

      {error && (
        <Box sx={{ p:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', display:'flex', gap:1 }}>
          <Warning size={14} weight="fill" color="#ef4444" style={{ flexShrink:0, marginTop:1 }}/>
          <Typography sx={{ fontSize:12, color:'#ef4444' }}>{error}</Typography>
        </Box>
      )}

      {/* Info Operarios (Solo lectura o resumen) */}
      {(() => {
        const pickOp = resolverOperario(pedido.operarioPicking, pedido.operarioPickingId, pickOps);
        const despOp = resolverOperario(pedido.operarioDespacho, pedido.operarioDespachoId, despOps);
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
            {pickOp && renderOperarioBox(pickOp, 'Operario Picking', Bag, '#3b82f6')}
            {despOp && renderOperarioBox(despOp, 'Operario Despacho', Truck, '#10b981')}
          </Box>
        );
      })()}

      {/* ESPERANDO_RUTA: solo lectura */}
      {etapa === 'ESPERANDO_RUTA' && (
        <Box sx={{ p:'12px 16px', borderRadius:'10px', background: colors.surfaceAlt, border:`1px solid ${colors.border}`, textAlign:'center' }}>
          <Typography sx={{ fontSize:13, color: colors.textSecondary }}>
            Este pedido está <strong>esperando ruta</strong>. <br/>
            Podrás asignar un operario cuando pase a estado comprometido.
          </Typography>
        </Box>
      )}

      {/* COMPROMETIDO: asignar picking */}
      {etapa === 'COMPROMETIDO' && (
        <>
          <OperarioSelect label="Operario de Picking" icon={Bag} iconColor="#3b82f6" value={pickingId} onChange={setPickingId} operarios={pickOps} disabled={saving}/>
          <Button onClick={handleAsignar} disabled={!pickingId || saving} variant="contained" fullWidth
            startIcon={saving ? <CircularProgress size={14} color="inherit"/> : <Bag size={17} weight="bold"/>}
            sx={{ height:44, borderRadius:'12px', fontWeight:700, textTransform:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow:'0 4px 16px rgba(59,130,246,.4)', '&:hover':{ transform:'translateY(-1px)' }, '&:disabled':{ background:'rgba(59,130,246,.3)', boxShadow:'none' }, transition:'all .25s' }}>
            {saving ? 'Asignando…' : pedido.operarioPickingId ? 'Reasignar Picking' : 'Asignar a Picking'}
          </Button>
        </>
      )}

      {/* PICKUP: asignar despacho */}
      {etapa === 'PICKUP' && (
        <>
          <OperarioSelect label="Operario de Despacho" icon={Truck} iconColor="#10b981" value={despachoId} onChange={setDespachoId} operarios={despOps} disabled={saving}/>
          <Button onClick={handleAsignar} disabled={!despachoId || saving} variant="contained" fullWidth
            startIcon={saving ? <CircularProgress size={14} color="inherit"/> : <Truck size={17} weight="bold"/>}
            sx={{ height:44, borderRadius:'12px', fontWeight:700, textTransform:'none', background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 4px 16px rgba(16,185,129,.4)', '&:hover':{ transform:'translateY(-1px)' }, '&:disabled':{ background:'rgba(16,185,129,.3)', boxShadow:'none' }, transition:'all .25s' }}>
            {saving ? 'Asignando…' : pedido.operarioDespachoId ? 'Reasignar Despacho' : 'Asignar a Despacho'}
          </Button>
        </>
      )}

      {/* DESPACHADO / ENTREGADO: Informativo */}
      {(etapa === 'DESPACHADO' || etapa === 'ENTREGADO') && (
        <Typography sx={{ fontSize:12, color: colors.textSecondary, textAlign:'center', mt:.5 }}>
          Este pedido ya ha sido procesado completamente.
        </Typography>
      )}
      
      <Button 
        fullWidth 
        variant="text" 
        onClick={() => window.location.href = `/supervisor/pedidos/${pedido.pedidoId}`}
        startIcon={<ClipboardText size={16} />}
        sx={{ textTransform:'none', fontSize:13, color:'#6366f1', mt:1, fontWeight:600 }}
      >
        Ver detalle completo del pedido
      </Button>
    </Box>
  );
}

/* ── Lista de pedidos ───────────────────────────────────────────────────── */
function ListaPedidos({ pedidos, activo, setActivo, emptyMsg }) {
  const colors = useColors();
  if (pedidos.length === 0) return (
    <Box sx={{ textAlign:'center', py:7 }}>
      <Package size={36} weight="duotone" color="#64748b" style={{ marginBottom:10 }}/>
      <Typography sx={{ color: colors.textSecondary, fontSize:14 }}>{emptyMsg}</Typography>
    </Box>
  );
  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 100px 110px 24px', gap:1.5, px:2.5, py:1.5, background: colors.surfaceAlt, borderBottom:`1px solid ${colors.border}` }}>
        {['Pedido','Cliente','Creado','Estado',''].map(h => (
          <Typography key={h} sx={{ fontSize:10.5, fontWeight:700, color: colors.textSecondary, textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</Typography>
        ))}
      </Box>
      {pedidos.map((p, i) => {
        const isActive = String(activo?.pedidoId ?? '') === String(p.pedidoId ?? '');
        const handleRowClick = async () => {
          if (isActive) { setActivo(null); return; }
          // Cargar detalle completo al hacer click
          try {
            const detail = await api.pedidos.detalle(p.pedidoId);
            setActivo(detail);
            } catch (e) {
              // Log de error opcional en producción
              setActivo(p); // Fallback a datos de la lista
            }
        };

        return (
          <Box key={p.pedidoId || i} onClick={handleRowClick}
            sx={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 100px 110px 24px', gap:1.5, px:2.5, py:1.75, borderTop:`1px solid ${colors.border}`, cursor:'pointer', background: isActive ? 'rgba(99,102,241,.06)' : 'transparent', borderLeft:`3px solid ${isActive ? '#6366f1' : 'transparent'}`, transition:'all .18s', animation:`rowIn .3s ease-out ${i*.03}s both`, '@keyframes rowIn':{ from:{ opacity:0, transform:'translateX(-6px)' }, to:{ opacity:1, transform:'translateX(0)' } }, '&:hover':{ background: isActive ? 'rgba(99,102,241,.09)' : `${colors.border}50` } }}>
            <Box sx={{ alignSelf:'center' }}>
              <Typography sx={{ fontSize:13, fontWeight:700, color: isActive ? '#6366f1' : colors.text, fontFamily:'monospace' }}>{p.numeroPedido || `—`}</Typography>
              {(p.operarioPickingId || p.operarioDespachoId) && <Typography sx={{ fontSize:10, color:'#22c55e', fontWeight:600 }}>Asignado</Typography>}
            </Box>
            <Box sx={{ alignSelf:'center' }}>
              <Typography sx={{ fontSize:12.5, color: colors.textSecondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.clienteNombre || p.clienteCc || '—'}</Typography>
              {p.totalUnidades !== undefined && <Typography sx={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>{p.totalUnidades} und · {p.cantidadLineas} líns</Typography>}
            </Box>
            <Typography sx={{ fontSize:11.5, color: colors.textSecondary, alignSelf:'center' }}>{formatFecha(p.fechaCreacion)}</Typography>
            <Box sx={{ alignSelf:'center' }}><StatusBadge estado={p.estado} tipo="pedido"/></Box>
            <Box sx={{ display:'flex', alignItems:'center' }}>
              <ArrowRight size={14} color={isActive ? '#6366f1' : colors.textSecondary} style={{ transform: isActive ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}/>
            </Box>
          </Box>
        );
      })}
      </Box>
    </>
  );
}

/* ── Etapas config ──────────────────────────────────────────────────────── */
const ETAPAS = [
  { key:'ESPERANDO_RUTA', label:'Esp. Ruta',   color:'#64748b', Icon:HourglassHigh,  desc:'Pendiente de ruta — asignar picking' },
  { key:'COMPROMETIDO',   label:'Comprometido', color:'#f59e0b', Icon:ClipboardText,  desc:'Inventario comprometido — asignar picking' },
  { key:'EN_PICKING',     label:'En Picking',   color:'#3b82f6', Icon:Bag,            desc:'En recolección' },
  { key:'PICKUP',         label:'Pickup',       color:'#10b981', Icon:Package,        desc:'Picking finalizado — asignar despacho' },
  { key:'DESPACHADO',     label:'Despachado',   color:'#8b5cf6', Icon:Truck,          desc:'En camino al cliente' },
  { key:'ENTREGADO',      label:'Entregado',    color:'#22c55e', Icon:Checks,         desc:'Pedido completado' },
];

/* ── MAIN ────────────────────────────────────────────────────────────────── */
export default function Asignacion() {
  const colors = useColors();

  // pedidos por estado: se cargan independientemente
  const [groups, setGroups]     = useState({ ESPERANDO_RUTA:[], COMPROMETIDO:[], EN_PICKING:[], PICKUP:[], DESPACHADO:[], ENTREGADO:[] });
  const [pickOps, setPickOps]   = useState([]);
  const [despOps, setDespOps]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tabIdx, setTabIdx]     = useState(0);
  const [activo, setActivo]     = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, color = '#22c55e') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar pedidos de todos los estados y operarios en paralelo
      const [todosRes, pick, desp, pickingE, despachoE] = await Promise.all([
        // GET /pedidos sin filtro de estado — traemos todos y filtramos local
        api.pedidos.listar({ page: 0, size: 100 }),
        api.operarios.listarPicking(),
        api.operarios.listarDespacho(),
        api.picking.getPedidosEtapa(),
        api.despacho.getPedidosEtapa()
      ]);

      const todos = todosRes.content || [];
      const newGroups = { ESPERANDO_RUTA:[], COMPROMETIDO:[], EN_PICKING:[], PICKUP:[], DESPACHADO:[], ENTREGADO:[] };
      
      const mapPicking = new Map(pickingE.map(p => [String(p.pedidoId), p]));
      const mapDespacho = new Map(despachoE.map(p => [String(p.pedidoId), p]));

      todos.forEach(p => {
        const est = p.estado;
        let pExtra = { ...p };
        const pid = String(p.pedidoId);
        if (est === 'COMPROMETIDO' && mapPicking.has(pid)) {
           pExtra.totalUnidades = mapPicking.get(pid).totalUnidades;
           pExtra.cantidadLineas = mapPicking.get(pid).cantidadLineas;
        }
        if (est === 'PICKUP' && mapDespacho.has(pid)) {
           pExtra.totalUnidades = mapDespacho.get(pid).totalUnidades;
           pExtra.cantidadLineas = mapDespacho.get(pid).cantidadLineas;
        }
        if (newGroups[est] !== undefined) newGroups[est].push(pExtra);
      });

      setGroups(newGroups);
      
      // Combinar operarios del backend con MOCK_USERS para asegurar que siempre haya opciones
      const mergeOps = (backend, role) => {
        const mocks = MOCK_USERS.filter(u => u.rol === role);
        const combined = [...backend];
        mocks.forEach(m => {
          if (!combined.some(o => String(o.operarioId ?? o.id ?? '') === String(m.operarioId ?? ''))) {
            combined.push(m);
          }
        });
        return combined;
      };

      setPickOps(mergeOps(pick, 'OPERARIO_PICKING'));
      setDespOps(mergeOps(desp, 'OPERARIO_DESPACHO'));
    } catch (e) {
      // Registro opcional de error en producción
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAsignado = (num) => {
    showToast(`Operario asignado correctamente a ${num}`);
    setActivo(null);
    fetchAll();
  };

  const etapa     = ETAPAS[tabIdx];
  const pedidosTab = groups[etapa.key] || [];

  return (
    <Box sx={{ animation:'pageIn .35s ease-out both', '@keyframes pageIn':{ from:{ opacity:0, transform:'translateY(8px)' }, to:{ opacity:1, transform:'translateY(0)' } } }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

      {/* Header */}
      <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb:3, flexWrap:'wrap', gap:2 }}>
        <Box>
          <Typography sx={{ fontSize:24, fontWeight:800, color: colors.text, letterSpacing:'-0.03em' }}>Asignación de Operarios</Typography>
          <Typography sx={{ fontSize:13, color: colors.textSecondary, mt:.5 }}>
            Flujo: <strong style={{ color:'#64748b' }}>Esp. Ruta</strong> → <strong style={{ color:'#f59e0b' }}>Comprometido</strong> → <strong style={{ color:'#3b82f6' }}>Picking</strong> → <strong style={{ color:'#8b5cf6' }}>Despacho</strong> → <strong style={{ color:'#22c55e' }}>Entregado</strong>
          </Typography>
        </Box>
        <Button onClick={fetchAll} disabled={loading} startIcon={<ArrowsClockwise size={15} weight="bold" className={loading ? 'spin' : ''}/>} variant="outlined"
          sx={{ borderRadius:'10px', textTransform:'none', fontSize:13, fontWeight:600, borderColor: colors.border, color: colors.textSecondary, '&:hover':{ borderColor:'#6366f1', color:'#6366f1' } }}>
          {loading ? 'Cargando…' : 'Actualizar'}
        </Button>
      </Box>

      {/* Tabs de etapas con contadores */}
      <Box sx={{ display:'flex', gap:1, mb:2.5, flexWrap:'wrap' }}>
        {ETAPAS.map((e, i) => {
          const cnt = (groups[e.key] || []).length;
          const active = tabIdx === i;
          return (
            <Box key={e.key} onClick={() => { setTabIdx(i); setActivo(null); }}
              sx={{ px:2, py:1, borderRadius:'10px', background: active ? `${e.color}18` : colors.surface, border:`1.5px solid ${active ? e.color+'50' : colors.border}`, cursor:'pointer', display:'flex', alignItems:'center', gap:1.25, transition:'all .2s', '&:hover':{ borderColor:`${e.color}40`, transform:'translateY(-1px)' } }}>
              <e.Icon size={14} weight="duotone" color={active ? e.color : colors.textSecondary}/>
              <Typography sx={{ fontSize:20, fontWeight:800, color: active ? e.color : colors.text, lineHeight:1 }}>{cnt}</Typography>
              <Typography sx={{ fontSize:12, color: active ? e.color : colors.textSecondary, fontWeight: active ? 600 : 400 }}>{e.label}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* Etapa header */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2, p:'12px 16px', borderRadius:'12px', background:`${etapa.color}08`, border:`1px solid ${etapa.color}25` }}>
        <etapa.Icon size={18} weight="duotone" color={etapa.color}/>
        <Box>
          <Typography sx={{ fontSize:14, fontWeight:700, color: etapa.color }}>{etapa.label}</Typography>
          <Typography sx={{ fontSize:12, color: colors.textSecondary }}>{etapa.desc}</Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display:'flex', justifyContent:'center', py:8 }}><CircularProgress sx={{ color:'#6366f1' }}/></Box>
      ) : (
        <Box sx={{ display:'grid', gridTemplateColumns: activo ? { xs:'1fr', lg:'1fr 380px' } : '1fr', gap:2.5, alignItems:'start' }}>
          {/* Lista */}
          <Box sx={{ borderRadius:'16px', overflow:'hidden', border:`1px solid ${colors.border}`, background: colors.surface }}>
            <ListaPedidos pedidos={pedidosTab} activo={activo} setActivo={setActivo}
              emptyMsg={`No hay pedidos en estado "${etapa.label}"`}/>
          </Box>

          {/* Panel de asignación */}
          {activo && (
            <Box sx={{ p:'22px 24px', borderRadius:'16px', background: colors.surface, border:`1px solid ${colors.border}`, position:'sticky', top:24, animation:'panelIn .3s cubic-bezier(.34,1.56,.64,1) both', '@keyframes panelIn':{ from:{ opacity:0, transform:'translateX(16px)' }, to:{ opacity:1, transform:'translateX(0)' } } }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1.25, mb:2.5 }}>
                <Box sx={{ width:36, height:36, borderRadius:'10px', background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <UsersThree size={18} weight="duotone" color="#6366f1"/>
                </Box>
                <Typography sx={{ fontSize:15, fontWeight:700, color: colors.text }}>Asignar operario</Typography>
              </Box>
              <PanelAsignacion pedido={activo} etapa={etapa.key} pickOps={pickOps} despOps={despOps} onAsignado={handleAsignado}/>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
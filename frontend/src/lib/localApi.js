import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { MOCK_USERS } from '../utils/constants';
import { withCache, invalidateCache } from './cache';

/* ─────────────────────────────────────────────────────────────────────────────
   NOTA: Solo los USUARIOS del sistema se simulan (para funcionar sin backend).
   Todos los datos operativos (pedidos, manifiestos, inventario, etc.) deben
   venir del backend real. Si no hay backend, las páginas muestran estado vacío.
   ───────────────────────────────────────────────────────────────────────────── */

// ── Usuarios simulados (mismo conjunto que MOCK_USERS en constants.js) ────────
const SIM_USERS = MOCK_USERS.map((user) => ({ ...user, activo: true }));

// Los operarios de picking/despacho son los mismos usuarios simulados
const SIM_OPERARIOS_PICKING  = SIM_USERS.filter(u => u.rol === 'OPERARIO_PICKING').map(u => ({ id: u.operarioId, nombre: u.nombre, cedula: u.cedula, rol: u.rol, activo: u.activo }));
const SIM_OPERARIOS_DESPACHO = SIM_USERS.filter(u => u.rol === 'OPERARIO_DESPACHO').map(u => ({ id: u.operarioId, nombre: u.nombre, cedula: u.cedula, rol: u.rol, activo: u.activo }));
const SIM_OPERARIOS_RECEPCION = SIM_USERS.filter(u => u.rol === 'OPERARIO_RECEPCION').map(u => ({ id: u.operarioId, nombre: u.nombre, cedula: u.cedula, rol: u.rol, activo: u.activo }));
const SIM_SUPERVISORES = SIM_USERS.filter(u => u.rol === 'SUPERVISOR_INVENTARIO').map(u => ({ id: u.operarioId, nombre: u.nombre, cedula: u.cedula, rol: u.rol, activo: u.activo }));

// ── Axios instance ────────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('sm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      ['sm_token', 'sm_user', 'sm_rol', 'sm_cedula', 'sm_operario_id'].forEach(k => localStorage.removeItem(k));
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── simAuth (login real con fallback a mock) ─────────────────────────────────
export const simAuth = {
  async login(cc) {
    try {
      const res = await axiosInstance.post('/auth/login', { cedula: cc });
      return res.data;
    } catch {
      try {
        const res = await axiosInstance.post('/auth/mock-login', { cedula: cc });
        return res.data;
      } catch {
        throw new Error('Backend not available');
      }
    }
  },
};

export const SIMULATED_MODE = false;

// ── API ───────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (cc) => axiosInstance.post('/auth/login', { cedula: cc }).then(r => r.data),
  },

  productos: {
    listar:     (p = {}) => axiosInstance.get('/productos', {
      params: { busqueda: p.buscar || p.busqueda, page: p.page ?? 0, size: p.size ?? 100 },
    }).then(r => {
      const d = r.data;
      return { content: Array.isArray(d) ? d : (d?.content || []) };
    }),
    crear:      (d)       => axiosInstance.post('/productos', d).then(r => r.data),
    actualizar: (sku, d)  => axiosInstance.put(`/productos/${sku}`, d).then(r => r.data),
    eliminar:   (sku)     => axiosInstance.delete(`/productos/${sku}`).then(r => r.data),
    bitacora:   (sku)     => axiosInstance.get(`/productos/${sku}/bitacora`).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : [];
    }),
  },

  clientes: {
    consultar: (cc) => axiosInstance.get(`/clientes/${cc}`).then(r => r.data),
  },

  pedidos: {
    listar: (p = {}) => axiosInstance.get('/pedidos', {
      params: { estado: p.estado, clienteCc: p.clienteCc, numeroPedido: p.numeroPedido, page: p.page ?? 0, size: p.size ?? 20 },
    }).then(r => {
      const d = r.data;
      // PedidosListResponseDTO: { pedidos: [], paginacion: {totalElements, totalPages, currentPage, pageSize} }
      if (d?.pedidos) return { content: d.pedidos, paginacion: d.paginacion };
      // Fallback por si devuelve array directo
      return { content: Array.isArray(d) ? d : (d?.content || []), paginacion: null };
    }),
    listarComprometidos: () => axiosInstance.get('/pedidos/comprometidos').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.content || d?.pedidos || []);
    }),
    detalle: (id) => axiosInstance.get(`/pedidos/${id}`).then(r => r.data),
    crear:   (d)  => axiosInstance.post('/pedidos', { clienteCc: d.clienteCc, asesorId: d.asesorId, lineas: d.lineas }).then(r => r.data),
    asignar: (pedidoId, data) => axiosInstance.put(`/pedidos/${pedidoId}/asignar`, data).then(r => r.data),
  },

  manifiestos: {
    listar: (p = {}) => axiosInstance.get('/manifiestos', {
      params: { incluirHistorico: p.incluirHistorico || false },
    }).then(r => {
      // Backend devuelve 204 No Content cuando no hay datos (data = null)
      const d = r.data;
      if (!d) return [];
      return Array.isArray(d) ? d : (d?.content || []);
    }).catch(() => []),
    pendientes: () => axiosInstance.get('/manifiestos/pendientes').then(r => {
      const d = r.data;
      if (!d) return [];
      return Array.isArray(d) ? d : (d?.content || []);
    }).catch(() => []),
    detalle: (id) => axiosInstance.get(`/manifiestos/${id}/detalles`).then(r => r.data),
    crear:   (d)  => axiosInstance.post('/manifiestos', d).then(r => r.data),
  },

  recepciones: {
    registrar: (d) => axiosInstance.post('/recepciones', d).then(r => r.data),
    listar: () => axiosInstance.get('/recepciones').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : [];
    }).catch(() => []),
  },

  excepciones: {
    listar: (p = {}) => axiosInstance.get('/excepciones', {
      params: { tipo: p.tipo, skuId: p.skuId, page: p.page ?? 0, size: p.size ?? 20 },
    }).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.content || []);
    }),
    ultimas: (minutos = 60) => axiosInstance.get('/excepciones/ultimas', {
      params: { minutos },
    }).then(r => r.data),
    nuevas: (desde) => axiosInstance.get('/excepciones/nuevas', {
      params: { desde },
    }).then(r => r.data),
    crear: (d) => axiosInstance.post('/excepciones', d).then(r => r.data),
  },

  // Operarios: simulados con los mismos usuarios del login
  operarios: {
    listarPicking: async () => {
      try {
        const r = await axiosInstance.get('/operarios/picking');
        const d = r.data;
        return Array.isArray(d) ? d : (d?.content || []);
      } catch {
        // Si el backend no está, devuelve los operarios simulados
        return SIM_OPERARIOS_PICKING;
      }
    },
    listarDespacho: async () => {
      try {
        const r = await axiosInstance.get('/operarios/despacho');
        const d = r.data;
        return Array.isArray(d) ? d : (d?.content || []);
      } catch {
        return SIM_OPERARIOS_DESPACHO;
      }
    },
    listarRecepcion: async () => {
      try {
        const r = await axiosInstance.get('/operarios/recepcion');
        const d = r.data;
        return Array.isArray(d) ? d : (d?.content || []);
      } catch {
        return SIM_OPERARIOS_RECEPCION;
      }
    },
    listarTodos: async () => {
      // Combina todos para búsquedas globales de historial
      try {
        const [p, d, r] = await Promise.all([
          axiosInstance.get('/operarios/picking').catch(() => ({ data: SIM_OPERARIOS_PICKING })),
          axiosInstance.get('/operarios/despacho').catch(() => ({ data: SIM_OPERARIOS_DESPACHO })),
          axiosInstance.get('/operarios/recepcion').catch(() => ({ data: SIM_OPERARIOS_RECEPCION })),
        ]);
        const all = [...p.data, ...d.data, ...r.data, ...SIM_SUPERVISORES];
        // Quitar duplicados por ID
        return Array.from(new Map(all.map(u => [u.id || u.operarioId, u])).values());
      } catch {
        return SIM_USERS.map(u => ({ id: u.operarioId, nombre: u.nombre, cedula: u.cedula }));
      }
    }
  },

  inventario: {
    getResumen: () => axiosInstance.get('/inventario/resumen').then(r => r.data),
    getStock:   (sku) => axiosInstance.get(`/inventario/stock/${sku}`).then(r => r.data),
    getMovimientos: (p = {}) => axiosInstance.get('/inventario/movimientos', {
      params: {
        skuId: p.skuId, codigoLote: p.codigoLote, tipoMovimiento: p.tipoMovimiento,
        fechaDesde: p.fechaDesde, fechaHasta: p.fechaHasta, page: 0, size: 100,
      },
    }).then(r => {
      const d = r.data;
      return d?.movimientos || (Array.isArray(d) ? d : []);
    }),
    getLotesCriticos: (dias = 30) => axiosInstance.get('/inventario/lotes/criticos', {
      params: { diasAviso: dias },
    }).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : [];
    }),
    getLoteDetalle: (codigoLote) =>
      axiosInstance.get(`/inventario/lotes/${encodeURIComponent(codigoLote)}`).then(r => r.data),
    consultarDisponibilidad: (d) => axiosInstance.post('/inventario/disponibilidad', d).then(r => r.data),
  },

  picking: {
    getPedidosEtapa: () => axiosInstance.get('/picking/pedidos').then(r => r.data || []),
    getMisPedidos: (operarioId) => axiosInstance.get(`/picking/mis-pedidos/${operarioId}`).then(r => {
      const d = r.data;
      const list = Array.isArray(d) ? d : (d?.content || []);
      // Normalize: guarantee pedidoId field regardless of backend serialization
      return list.map(p => ({ ...p, pedidoId: p.pedidoId ?? p.id }));
    }),
    iniciar: (pedidoId, operarioId) => axiosInstance.post('/picking/iniciar', {
      pedidoId,
      operarioId
    }).then(r => r.data),
    confirmar: (d) => axiosInstance.post('/picking/confirmar', {
      pedidoId: d.pedidoId,
      operarioId: d.operarioId,
      lineasRecolectadas: d.lineasRecolectadas,
    }).then(r => r.data),
  },

  despacho: {
    getPedidosEtapa: () => axiosInstance.get('/despacho/pedidos').then(r => r.data || []),
    getMisPedidos: (operarioId) => axiosInstance.get(`/despacho/mis-pedidos/${operarioId}`).then(r => {
      const d = r.data;
      const list = Array.isArray(d) ? d : (d?.content || []);
      // Normalize: guarantee pedidoId field regardless of backend serialization
      return list.map(p => ({ ...p, pedidoId: p.pedidoId ?? p.id }));
    }),
    confirmar: (d) => axiosInstance.post('/despacho/confirmar', {
      pedidoId: d.pedidoId,
      operarioId: d.operarioId,
      transportista: d.transportista,
      placaVehiculo: d.placaVehiculo,
      observaciones: d.observaciones,
      cantidadesDespachadas: d.cantidadesDespachadas,
    }).then(r => r.data),
  },
};

/* ── Cache wrappers (stale-while-revalidate) ─────────────────────────────── */
api.productos.listar     = withCache(api.productos.listar,     'productos.listar',     60000);
api.productos.bitacora   = withCache(api.productos.bitacora,   'productos.bitacora',   30000);
api.clientes.consultar   = withCache(api.clientes.consultar,   'clientes.consultar',   60000);
api.pedidos.listar       = withCache(api.pedidos.listar,       'pedidos.listar',       15000);
api.pedidos.listarComprometidos = withCache(api.pedidos.listarComprometidos, 'pedidos.listarComprometidos', 15000);
api.pedidos.detalle      = withCache(api.pedidos.detalle,       'pedidos.detalle',      30000);
api.manifiestos.listar   = withCache(api.manifiestos.listar,   'manifiestos.listar',    30000);
api.manifiestos.pendientes = withCache(api.manifiestos.pendientes, 'manifiestos.pendientes', 30000);
api.manifiestos.detalle  = withCache(api.manifiestos.detalle,  'manifiestos.detalle',   30000);
api.recepciones.listar   = withCache(api.recepciones.listar,   'recepciones.listar',    30000);
api.excepciones.listar   = withCache(api.excepciones.listar,   'excepciones.listar',    20000);
api.excepciones.ultimas  = withCache(api.excepciones.ultimas,  'excepciones.ultimas',   20000);
api.excepciones.nuevas   = withCache(api.excepciones.nuevas,   'excepciones.nuevas',    20000);
api.operarios.listarPicking  = withCache(api.operarios.listarPicking,  'operarios.picking',  60000);
api.operarios.listarDespacho = withCache(api.operarios.listarDespacho, 'operarios.despacho', 60000);
api.operarios.listarRecepcion= withCache(api.operarios.listarRecepcion,'operarios.recepcion',60000);
api.operarios.listarTodos    = withCache(api.operarios.listarTodos,    'operarios.todos',    60000);
api.inventario.getResumen      = withCache(api.inventario.getResumen,      'inventario.resumen',      30000);
api.inventario.getStock        = withCache(api.inventario.getStock,        'inventario.stock',        30000);
api.inventario.getMovimientos  = withCache(api.inventario.getMovimientos,  'inventario.movimientos',  30000);
api.inventario.getLotesCriticos= withCache(api.inventario.getLotesCriticos,'inventario.lotesCriticos', 30000);
api.inventario.getLoteDetalle  = withCache(api.inventario.getLoteDetalle,  'inventario.loteDetalle',  30000);
api.inventario.consultarDisponibilidad = withCache(api.inventario.consultarDisponibilidad, 'inventario.disponibilidad', 30000);
api.picking.getPedidosEtapa = withCache(api.picking.getPedidosEtapa, 'picking.getPedidosEtapa', 15000);
api.picking.getMisPedidos   = withCache(api.picking.getMisPedidos,   'picking.getMisPedidos',   15000);
api.despacho.getPedidosEtapa= withCache(api.despacho.getPedidosEtapa,'despacho.getPedidosEtapa',15000);
api.despacho.getMisPedidos  = withCache(api.despacho.getMisPedidos,  'despacho.getMisPedidos',  15000);

/* ── Mutation invalidation ────────────────────────────────────────────────── */
const _crearPedido = api.pedidos.crear;
api.pedidos.crear = (...args) => _crearPedido(...args).then(r => { invalidateCache('pedidos.'); return r; });

const _asignarPedido = api.pedidos.asignar;
api.pedidos.asignar = (...args) => _asignarPedido(...args).then(r => { invalidateCache('pedidos.'); return r; });

const _crearManifiesto = api.manifiestos.crear;
api.manifiestos.crear = (...args) => _crearManifiesto(...args).then(r => { invalidateCache('manifiestos.'); return r; });

const _registrarRecepcion = api.recepciones.registrar;
api.recepciones.registrar = (...args) => _registrarRecepcion(...args).then(r => { invalidateCache('recepciones.'); invalidateCache('manifiestos.'); return r; });

const _crearExcepcion = api.excepciones.crear;
api.excepciones.crear = (...args) => _crearExcepcion(...args).then(r => { invalidateCache('excepciones.'); return r; });

const _crearProducto = api.productos.crear;
api.productos.crear = (...args) => _crearProducto(...args).then(r => { invalidateCache('productos.'); return r; });

const _actualizarProducto = api.productos.actualizar;
api.productos.actualizar = (...args) => _actualizarProducto(...args).then(r => { invalidateCache('productos.'); return r; });

const _eliminarProducto = api.productos.eliminar;
api.productos.eliminar = (...args) => _eliminarProducto(...args).then(r => { invalidateCache('productos.'); return r; });

const _confirmarPicking = api.picking.confirmar;
api.picking.confirmar = (...args) => _confirmarPicking(...args).then(r => { invalidateCache('picking.'); invalidateCache('pedidos.'); return r; });

const _confirmarDespacho = api.despacho.confirmar;
api.despacho.confirmar = (...args) => _confirmarDespacho(...args).then(r => { invalidateCache('despacho.'); invalidateCache('pedidos.'); return r; });

export default api;
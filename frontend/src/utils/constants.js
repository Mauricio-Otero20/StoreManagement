// ── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPERVISOR_INVENTARIO: 'SUPERVISOR_INVENTARIO',
  ASESOR_COMERCIAL:      'ASESOR_COMERCIAL',
  OPERARIO_RECEPCION:    'OPERARIO_RECEPCION',
  OPERARIO_PICKING:      'OPERARIO_PICKING',
  OPERARIO_DESPACHO:     'OPERARIO_DESPACHO',
};

export const ROLE_LABELS = {
  SUPERVISOR_INVENTARIO: 'Supervisor Inventario',
  ASESOR_COMERCIAL:      'Asesor Comercial',
  OPERARIO_RECEPCION:    'Operario Recepción',
  OPERARIO_PICKING:      'Operario Picking',
  OPERARIO_DESPACHO:     'Operario Despacho',
};

// ── Rutas por rol ────────────────────────────────────────────────────────────
export const HOME_ROUTE_BY_ROL = {
  SUPERVISOR_INVENTARIO: '/supervisor',
  ASESOR_COMERCIAL:      '/asesor/catalogo',
  OPERARIO_RECEPCION:    '/recepcion',
  OPERARIO_PICKING:      '/picking',
  OPERARIO_DESPACHO:     '/despacho',
};

// ── Estados de Pedido ────────────────────────────────────────────────────────
export const ESTADOS_PEDIDO = {
  ESPERANDO_RUTA: { label: 'Esperando Ruta', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  RUTA_ASIGNADA:  { label: 'Ruta Asignada',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  COMPROMETIDO:   { label: 'Comprometido',   color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
  EN_PICKING:     { label: 'En Picking',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PICKUP:         { label: 'Pickup',           color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  DESPACHADO:     { label: 'Despachado',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  ENTREGADO:      { label: 'Entregado',       color: '#0891b2', bg: 'rgba(8,145,178,0.12)'  },
};

// ── Tipos Excepción — TipoExcepcion enum backend ─────────────────────────────
export const TIPOS_EXCEPCION = [
  { value: 'AVERIA',      label: 'Avería',                   color: '#ef4444' },
  { value: 'VENCIMIENTO', label: 'Vencimiento',              color: '#f97316' },
  { value: 'DIFERENCIA',  label: 'Diferencia de Inventario', color: '#8b5cf6' },
  { value: 'FALTANTE',    label: 'Faltante',                 color: '#f59e0b' },
];

// ── Estados Manifiesto — EstadoManifiesto enum backend ───────────────────────
export const ESTADOS_MANIFIESTO = {
  PENDIENTE:            { label: 'Pendiente',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  RECEPCIONADO_PARCIAL: { label: 'Parcial',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  RECEPCIONADO_TOTAL:   { label: 'Recepcionado', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
};

// ── Tipos Movimiento — TipoMovimiento enum backend ───────────────────────────
export const TIPOS_MOVIMIENTO = {
  ENTRADA:          { label: 'Entrada',          sign: '+', color: '#22c55e' },
  COMPROMISO:       { label: 'Compromiso',       sign: 'C', color: '#3b82f6' },
  PICKING:          { label: 'Picking',          sign: 'P', color: '#8b5cf6' },
  SALIDA:           { label: 'Salida',           sign: '-', color: '#ef4444' },
  BAJA_AVERIA:      { label: 'Baja Avería',      sign: '-', color: '#f97316' },
  BAJA_VENCIMIENTO: { label: 'Baja Vencimiento', sign: '-', color: '#dc2626' },
  FALTANTE:         { label: 'Faltante',         sign: '!', color: '#f59e0b' },
  REASIGNACION:     { label: 'Reasignación',     sign: '~', color: '#64748b' },
};

// ── Usuarios mock (para accesos rápidos en Login) ────────────────────────────
export const MOCK_USERS = [
  { id: 1, operarioId: 1, cedula: '11111111', nombre: 'Carlos Perez',    rol: 'OPERARIO_PICKING',      color: '#3B82F6', activo: true },
  { id: 2, operarioId: 2, cedula: '22222222', nombre: 'Maria Lopez',     rol: 'OPERARIO_DESPACHO',     color: '#10B981', activo: true },
  { id: 3, operarioId: 3, cedula: '33333333', nombre: 'Pedro Gomez',     rol: 'SUPERVISOR_INVENTARIO', color: '#8B5CF6', activo: true },
  { id: 4, operarioId: 4, cedula: '44444444', nombre: 'Roberto Sanchez', rol: 'ASESOR_COMERCIAL',      color: '#F59E0B', activo: true },
  { id: 5, operarioId: 5, cedula: '55555555', nombre: 'Ana Reception',   rol: 'OPERARIO_RECEPCION',    color: '#EF4444', activo: true },
];

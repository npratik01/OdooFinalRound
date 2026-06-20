import axiosInstance from './axiosInstance'

// ─── Bill of Materials ────────────────────────────────────────────────────────
export const fetchBOMs = (params = {}) =>
  axiosInstance.get('/bom', { params })

export const fetchBOMById = (id) =>
  axiosInstance.get(`/bom/${id}`)

export const createBOM = (data) =>
  axiosInstance.post('/bom', data)

export const updateBOM = (id, data) =>
  axiosInstance.put(`/bom/${id}`, data)

export const cloneBOM = (id) =>
  axiosInstance.post(`/bom/${id}/clone`)

export const activateBOM = (id) =>
  axiosInstance.patch(`/bom/${id}/activate`)

export const archiveBOM = (id) =>
  axiosInstance.patch(`/bom/${id}/archive`)

// ─── Work Centers ─────────────────────────────────────────────────────────────
export const fetchWorkCenters = (params = {}) =>
  axiosInstance.get('/work-centers', { params })

export const fetchWorkCenterById = (id) =>
  axiosInstance.get(`/work-centers/${id}`)

export const createWorkCenter = (data) =>
  axiosInstance.post('/work-centers', data)

export const updateWorkCenter = (id, data) =>
  axiosInstance.put(`/work-centers/${id}`, data)

export const toggleWorkCenterStatus = (id) =>
  axiosInstance.patch(`/work-centers/${id}/toggle-status`)

// ─── Operations ───────────────────────────────────────────────────────────────
export const fetchOperations = (params = {}) =>
  axiosInstance.get('/operations', { params })

export const fetchOperationById = (id) =>
  axiosInstance.get(`/operations/${id}`)

export const createOperation = (data) =>
  axiosInstance.post('/operations', data)

export const updateOperation = (id, data) =>
  axiosInstance.put(`/operations/${id}`, data)

// ─── Manufacturing Orders ─────────────────────────────────────────────────────
export const fetchManufacturingOrders = (params = {}) =>
  axiosInstance.get('/manufacturing', { params })

export const fetchManufacturingOrderById = (id) =>
  axiosInstance.get(`/manufacturing/${id}`)

export const createManufacturingOrder = (data) =>
  axiosInstance.post('/manufacturing', data)

export const updateManufacturingOrder = (id, data) =>
  axiosInstance.put(`/manufacturing/${id}`, data)

export const confirmManufacturingOrder = (id) =>
  axiosInstance.patch(`/manufacturing/${id}/confirm`)

export const startManufacturingOrder = (id) =>
  axiosInstance.patch(`/manufacturing/${id}/start`)

export const completeManufacturingOrder = (id, data = {}) =>
  axiosInstance.patch(`/manufacturing/${id}/complete`, data)

export const cancelManufacturingOrder = (id) =>
  axiosInstance.patch(`/manufacturing/${id}/cancel`)

export const fetchWorkOrdersForMO = (moId) =>
  axiosInstance.get(`/manufacturing/${moId}/work-orders`)

// ─── Work Orders ──────────────────────────────────────────────────────────────
export const fetchAllWorkOrders = (params = {}) =>
  axiosInstance.get('/manufacturing/work-orders', { params })

export const startWorkOrder = (id) =>
  axiosInstance.patch(`/manufacturing/work-orders/${id}/start`)

export const completeWorkOrder = (id, data = {}) =>
  axiosInstance.patch(`/manufacturing/work-orders/${id}/complete`, data)

export const cancelWorkOrder = (id) =>
  axiosInstance.patch(`/manufacturing/work-orders/${id}/cancel`)

// ─── Manufacturing Dashboard ──────────────────────────────────────────────────
export const fetchManufacturingDashboardSummary = () =>
  axiosInstance.get('/manufacturing-dashboard/summary')

export const fetchManufacturingAnalytics = () =>
  axiosInstance.get('/manufacturing-dashboard/analytics')

export const fetchWorkCenterUtilization = () =>
  axiosInstance.get('/manufacturing-dashboard/work-center-utilization')

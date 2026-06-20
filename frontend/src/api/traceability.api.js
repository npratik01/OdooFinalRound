import axiosInstance from './axiosInstance'

export const traceabilityApi = {
  getFlow: (docId) => axiosInstance.get(`/traceability/flow/${docId}`),
}

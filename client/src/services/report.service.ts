import { api } from '../lib/api.js';
import { IOperationalSummary, ApiResponse } from '../types/index.js';

export const reportService = {
  async getSummary() {
    const res = await api.get<ApiResponse<IOperationalSummary>>('/reports/summary');
    return res.data.data;
  },

  async downloadShipmentsCsv() {
    const res = await api.get('/reports/export/shipments', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fleetflow-shipments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async downloadTripsCsv() {
    const res = await api.get('/reports/export/trips', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fleetflow-trips-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

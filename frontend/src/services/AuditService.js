import api from './api';

export default {
  async getAuditLogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.target_type) params.append('target_type', filters.target_type);
      
      const response = await api.get(`/audit/logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },
};

import { defineStore } from 'pinia';
import api from '../services/api';

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchProjects() {
      this.isLoading = true;
      try {
        const response = await api.get('/projects/');
        this.projects = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch projects';
      } finally {
        this.isLoading = false;
      }
    },
    async fetchProjectDetail(projectId) {
      this.isLoading = true;
      try {
        const response = await api.get(`/projects/${projectId}`);
        this.currentProject = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch project details';
      } finally {
        this.isLoading = false;
      }
    }
  }
});

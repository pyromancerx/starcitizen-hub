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
    async addProject(projectData) {
      this.isLoading = true;
      try {
        const response = await api.post('/projects/', projectData);
        await this.fetchProjects(); // Refresh the list to include the new project
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add project';
        throw err;
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
    },
    async addPhase(projectId, phaseData) {
      this.isLoading = true;
      try {
        await api.post(`/projects/${projectId}/phases`, phaseData);
        await this.fetchProjectDetail(projectId); // Refresh project to show new phase
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add project phase';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
    async addTask(phaseId, taskData) {
      this.isLoading = true;
      try {
        await api.post(`/projects/phases/${phaseId}/tasks`, taskData);
        // Assuming currentProject is always loaded when adding a task
        if (this.currentProject) {
          await this.fetchProjectDetail(this.currentProject.id); // Refresh project to show new task
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add task';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
    async addContributionGoal(projectId, goalData) {
      this.isLoading = true;
      try {
        await api.post(`/projects/${projectId}/goals`, goalData);
        await this.fetchProjectDetail(projectId); // Refresh project to show new goal
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add contribution goal';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
    async addContribution(goalId, contributionData) {
      this.isLoading = true;
      try {
        await api.post(`/projects/goals/${goalId}/contribute`, contributionData);
        // Assuming currentProject is always loaded when adding a contribution
        if (this.currentProject) {
          await this.fetchProjectDetail(this.currentProject.id); // Refresh project to show updated goal progress
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add contribution';
        throw err;
      } finally {
        this.isLoading = false;
      }
    }
  }
});

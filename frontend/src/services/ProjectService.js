import api from './api';

export default {
  // --- Projects ---
  async createProject(projectData) {
    try {
      const response = await api.post('/projects/', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async getProjects(skip = 0, limit = 20) {
    try {
      const response = await api.get(`/projects/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  async getProject(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
    }
  },

  async updateProject(projectId, projectData) {
    try {
      const response = await api.patch(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw error;
    }
  },

  async deleteProject(projectId) {
    try {
      await api.delete(`/projects/${projectId}`);
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      throw error;
    }
  },

  async completeProject(projectId) {
    try {
      const response = await api.post(`/projects/${projectId}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error completing project ${projectId}:`, error);
      throw error;
    }
  },

  // --- Phases ---
  async createPhase(projectId, phaseData) {
    try {
      const response = await api.post(`/projects/${projectId}/phases`, phaseData);
      return response.data;
    } catch (error) {
      console.error(`Error creating phase for project ${projectId}:`, error);
      throw error;
    }
  },

  async getPhase(phaseId) {
    try {
      const response = await api.get(`/projects/phases/${phaseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching phase ${phaseId}:`, error);
      throw error;
    }
  },

  async updatePhase(phaseId, phaseData) {
    try {
      const response = await api.patch(`/projects/phases/${phaseId}`, phaseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating phase ${phaseId}:`, error);
      throw error;
    }
  },

  async deletePhase(phaseId) {
    try {
      await api.delete(`/projects/phases/${phaseId}`);
    } catch (error) {
      console.error(`Error deleting phase ${phaseId}:`, error);
      throw error;
    }
  },

  // --- Tasks ---
  async createTask(phaseId, taskData) {
    try {
      const response = await api.post(`/projects/phases/${phaseId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Error creating task for phase ${phaseId}:`, error);
      throw error;
    }
  },

  async getTask(taskId) {
    try {
      const response = await api.get(`/projects/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw error;
    }
  },

  async updateTask(taskId, taskData) {
    try {
      const response = await api.patch(`/projects/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  },

  async deleteTask(taskId) {
    try {
      await api.delete(`/projects/tasks/${taskId}`);
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw error;
    }
  },

  // --- Contribution Goals ---
  async createContributionGoal(projectId, goalData) {
    try {
      const response = await api.post(`/projects/${projectId}/goals`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error creating contribution goal for project ${projectId}:`, error);
      throw error;
    }
  },

  async getContributionGoal(goalId) {
    try {
      const response = await api.get(`/projects/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contribution goal ${goalId}:`, error);
      throw error;
    }
  },

  async updateContributionGoal(goalId, goalData) {
    try {
      const response = await api.patch(`/projects/goals/${goalId}`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error updating contribution goal ${goalId}:`, error);
      throw error;
    }
  },

  async deleteContributionGoal(goalId) {
    try {
      await api.delete(`/projects/goals/${goalId}`);
    } catch (error) {
      console.error(`Error deleting contribution goal ${goalId}:`, error);
      throw error;
    }
  },

  // --- Contributions ---
  async addContribution(goalId, contributionData) {
    try {
      const response = await api.post(`/projects/goals/${goalId}/contribute`, contributionData);
      return response.data;
    } catch (error) {
      console.error(`Error adding contribution to goal ${goalId}:`, error);
      throw error;
    }
  },

  async getContribution(contributionId) {
    try {
      const response = await api.get(`/projects/contributions/${contributionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contribution ${contributionId}:`, error);
      throw error;
    }
  },

  async updateContribution(contributionId, contributionData) {
    try {
      const response = await api.patch(`/projects/contributions/${contributionId}`, contributionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating contribution ${contributionId}:`, error);
      throw error;
    }
  },

  async deleteContribution(contributionId) {
    try {
      await api.delete(`/projects/contributions/${contributionId}`);
    } catch (error) {
      console.error(`Error deleting contribution ${contributionId}:`, error);
      throw error;
    }
  },
};

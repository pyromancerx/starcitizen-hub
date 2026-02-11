import { defineStore } from 'pinia';
import ProjectService from '../services/ProjectService';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    selectedProject: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    // --- Projects ---
    async fetchProjects() {
      this.isLoading = true;
      try {
        this.projects = await ProjectService.getProjects();
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch projects:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchProject(projectId) {
      this.isLoading = true;
      try {
        this.selectedProject = await ProjectService.getProject(projectId);
      } catch (error) {
        this.error = error;
        console.error(`Failed to fetch project ${projectId}:`, error);
      } finally {
        this.isLoading = false;
      }
    },
    async createProject(projectData) {
      this.isLoading = true;
      try {
        const newProject = await ProjectService.createProject(projectData);
        this.projects.push(newProject);
        return newProject;
      } catch (error) {
        this.error = error;
        console.error('Failed to create project:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateProject(projectId, projectData) {
      this.isLoading = true;
      try {
        const updatedProject = await ProjectService.updateProject(projectId, projectData);
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
          this.projects[index] = updatedProject;
        }
        if (this.selectedProject?.id === projectId) {
          this.selectedProject = updatedProject;
        }
        return updatedProject;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update project ${projectId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteProject(projectId) {
      this.isLoading = true;
      try {
        await ProjectService.deleteProject(projectId);
        this.projects = this.projects.filter(p => p.id !== projectId);
        if (this.selectedProject?.id === projectId) {
          this.selectedProject = null;
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete project ${projectId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async completeProject(projectId) {
      this.isLoading = true;
      try {
        const updatedProject = await ProjectService.completeProject(projectId);
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
          this.projects[index] = updatedProject;
        }
        if (this.selectedProject?.id === projectId) {
          this.selectedProject = updatedProject;
        }
        return updatedProject;
      } catch (error) {
        this.error = error;
        console.error(`Failed to complete project ${projectId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Phases ---
    async createPhase(projectId, phaseData) {
      this.isLoading = true;
      try {
        const newPhase = await ProjectService.createPhase(projectId, phaseData);
        if (this.selectedProject?.id === projectId) {
          this.selectedProject.phases.push(newPhase);
        }
        return newPhase;
      } catch (error) {
        this.error = error;
        console.error(`Failed to create phase for project ${projectId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updatePhase(phaseId, phaseData) {
      this.isLoading = true;
      try {
        const updatedPhase = await ProjectService.updatePhase(phaseId, phaseData);
        if (this.selectedProject) {
          const phaseIndex = this.selectedProject.phases.findIndex(p => p.id === phaseId);
          if (phaseIndex !== -1) {
            this.selectedProject.phases[phaseIndex] = updatedPhase;
          }
        }
        return updatedPhase;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update phase ${phaseId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deletePhase(phaseId) {
      this.isLoading = true;
      try {
        await ProjectService.deletePhase(phaseId);
        if (this.selectedProject) {
          this.selectedProject.phases = this.selectedProject.phases.filter(p => p.id !== phaseId);
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete phase ${phaseId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Tasks ---
    async createTask(phaseId, taskData) {
      this.isLoading = true;
      try {
        const newTask = await ProjectService.createTask(phaseId, taskData);
        if (this.selectedProject) {
          const phase = this.selectedProject.phases.find(p => p.id === phaseId);
          if (phase) {
            phase.tasks.push(newTask);
          }
        }
        return newTask;
      } catch (error) {
        this.error = error;
        console.error(`Failed to create task for phase ${phaseId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateTask(taskId, taskData) {
      this.isLoading = true;
      try {
        const updatedTask = await ProjectService.updateTask(taskId, taskData);
        if (this.selectedProject) {
          this.selectedProject.phases.forEach(phase => {
            const taskIndex = phase.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
              phase.tasks[taskIndex] = updatedTask;
            }
          });
        }
        return updatedTask;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update task ${taskId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteTask(taskId) {
      this.isLoading = true;
      try {
        await ProjectService.deleteTask(taskId);
        if (this.selectedProject) {
          this.selectedProject.phases.forEach(phase => {
            phase.tasks = phase.tasks.filter(t => t.id !== taskId);
          });
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete task ${taskId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Contribution Goals ---
    async createContributionGoal(projectId, goalData) {
      this.isLoading = true;
      try {
        const newGoal = await ProjectService.createContributionGoal(projectId, goalData);
        if (this.selectedProject?.id === projectId) {
          this.selectedProject.contribution_goals.push(newGoal);
        }
        return newGoal;
      } catch (error) {
        this.error = error;
        console.error(`Failed to create contribution goal for project ${projectId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateContributionGoal(goalId, goalData) {
      this.isLoading = true;
      try {
        const updatedGoal = await ProjectService.updateContributionGoal(goalId, goalData);
        if (this.selectedProject) {
          const goalIndex = this.selectedProject.contribution_goals.findIndex(g => g.id === goalId);
          if (goalIndex !== -1) {
            this.selectedProject.contribution_goals[goalIndex] = updatedGoal;
          }
        }
        return updatedGoal;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update contribution goal ${goalId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteContributionGoal(goalId) {
      this.isLoading = true;
      try {
        await ProjectService.deleteContributionGoal(goalId);
        if (this.selectedProject) {
          this.selectedProject.contribution_goals = this.selectedProject.contribution_goals.filter(g => g.id !== goalId);
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete contribution goal ${goalId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Contributions ---
    async addContribution(goalId, contributionData) {
      this.isLoading = true;
      try {
        const newContribution = await ProjectService.addContribution(goalId, contributionData);
        if (this.selectedProject) {
          this.selectedProject.contribution_goals.forEach(goal => {
            if (goal.id === goalId) {
              goal.contributions.push(newContribution);
              goal.current_amount += newContribution.amount; // Update current amount
            }
          });
        }
        return newContribution;
      } catch (error) {
        this.error = error;
        console.error(`Failed to add contribution to goal ${goalId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateContribution(contributionId, contributionData) {
      this.isLoading = true;
      try {
        const updatedContribution = await ProjectService.updateContribution(contributionId, contributionData);
        if (this.selectedProject) {
          this.selectedProject.contribution_goals.forEach(goal => {
            const contributionIndex = goal.contributions.findIndex(c => c.id === contributionId);
            if (contributionIndex !== -1) {
              // Adjust goal current amount
              const oldAmount = goal.contributions[contributionIndex].amount;
              goal.current_amount -= oldAmount;
              goal.current_amount += updatedContribution.amount;
              goal.contributions[contributionIndex] = updatedContribution;
            }
          });
        }
        return updatedContribution;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update contribution ${contributionId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteContribution(contributionId) {
      this.isLoading = true;
      try {
        await ProjectService.deleteContribution(contributionId);
        if (this.selectedProject) {
          this.selectedProject.contribution_goals.forEach(goal => {
            const contribution = goal.contributions.find(c => c.id === contributionId);
            if (contribution) {
              goal.current_amount -= contribution.amount; // Update current amount
              goal.contributions = goal.contributions.filter(c => c.id !== contributionId);
            }
          });
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete contribution ${contributionId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

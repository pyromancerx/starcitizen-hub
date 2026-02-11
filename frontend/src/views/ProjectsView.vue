<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Organization Logistics</h2>
      <button @click="showAddProjectModal = true" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Launch New Project</button>
    </div>

    <div v-if="projectStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="project in projectStore.projects" :key="project.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden flex flex-col hover:border-sc-blue/30 transition-all shadow-xl group">
        <div class="p-6 flex-1">
          <div class="flex justify-between items-start mb-4">
            <span class="px-2 py-0.5 rounded bg-sc-blue/10 text-[8px] text-sc-blue font-bold uppercase tracking-widest">{{ project.status }}</span>
            <span class="text-[10px] text-sc-grey/50 uppercase">Est. {{ project.target_date ? new Date(project.target_date).toLocaleDateString() : 'TBD' }}</span>
          </div>
          <h3 class="text-xl font-bold text-white uppercase tracking-tight mb-2 group-hover:text-sc-blue transition-colors">{{ project.title }}</h3>
          <p class="text-xs text-sc-grey/70 leading-relaxed line-clamp-3">{{ project.description || 'Logistics data pending for this initiative.' }}</p>
        </div>
        
        <div class="p-6 bg-black/20 border-t border-sc-grey/5 flex justify-between items-center">
          <div class="flex -space-x-2">
            <div class="h-6 w-6 rounded-full bg-sc-blue/20 border border-sc-blue/50 flex items-center justify-center text-[8px] text-sc-blue font-bold">M</div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="openEditModal(project)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">Edit</button>
            <button @click="handleDeleteProject(project.id)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
            <router-link :to="{ name: 'project-detail', params: { id: project.id } }" class="text-[10px] text-sc-blue font-bold uppercase tracking-widest border-b border-sc-blue/30 hover:border-sc-blue transition-all pb-0.5">Project Overview</router-link>
          </div>
        </div>
      </div>
      
      <div v-if="projectStore.projects.length === 0 && !projectStore.isLoading" class="md:col-span-2 bg-sc-panel border border-sc-grey/10 p-12 text-center">
        <p class="text-sc-grey/50 uppercase tracking-widest italic">No active logistics projects recorded.</p>
      </div>
    </div>
  </div>

  <AddProjectModal :show="showAddProjectModal" @close="showAddProjectModal = false" @project-added="handleAddProject" />
  <EditProjectModal :show="showEditProjectModal" :project="editingProject" @close="showEditProjectModal = false" @project-updated="handleEditProject" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProjectStore } from '../stores/project';
import AddProjectModal from '../components/AddProjectModal.vue';
import EditProjectModal from '../components/EditProjectModal.vue'; // Import EditProjectModal

const projectStore = useProjectStore();
const showAddProjectModal = ref(false);
const showEditProjectModal = ref(false); // New ref for edit modal
const editingProject = ref(null); // New ref for project being edited

onMounted(() => {
  projectStore.fetchProjects();
});

const handleAddProject = async (newProjectData) => {
  try {
    await projectStore.createProject(newProjectData); // Corrected to createProject
    showAddProjectModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to create project.');
  }
};

const openEditModal = (project) => {
  editingProject.value = { ...project }; // Clone project data for editing
  showEditProjectModal.value = true;
};

const handleEditProject = async (updatedProjectData) => {
  try {
    await projectStore.updateProject(editingProject.value.id, updatedProjectData);
    showEditProjectModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update project.');
  }
};

const handleDeleteProject = async (projectId) => {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    try {
      await projectStore.deleteProject(projectId);
    } catch (error) {
      alert(error.message || 'Failed to delete project.');
    }
  }
};
</script>

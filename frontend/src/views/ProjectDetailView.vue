<template>
  <div v-if="projectStore.isLoading && !projectStore.selectedProject" class="flex justify-center p-12">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
  </div>

  <div v-else-if="projectStore.selectedProject" class="space-y-8">
    <div class="flex items-center space-x-4">
      <button @click="$router.push({ name: 'projects' })" class="text-sc-blue hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">{{ projectStore.selectedProject.title }}</h2>
      <div v-if="projectStore.selectedProject.status === 'completed'" class="px-2 py-0.5 bg-green-500/20 text-green-500 border border-green-500/30 rounded text-[10px] font-black uppercase tracking-widest">Completed</div>
      
      <div class="flex-1"></div>
      
      <button 
        v-if="projectStore.selectedProject.status !== 'completed' && isManager" 
        @click="handleCompleteProject"
        class="px-4 py-2 bg-green-500/10 border border-green-500 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all"
      >
        Mark as Completed
      </button>
    </div>

    <!-- Project Meta -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 space-y-8">
        <!-- Phases and Tasks -->
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
              <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Operational Phases
            </h3>
            <button @click="showAddPhaseModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
              Add Phase
            </button>
          </div>
          
          <div v-for="phase in projectStore.selectedProject.phases" :key="phase.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-lg">
            <div class="bg-black/20 p-4 border-b border-sc-grey/10 flex justify-between items-center">
              <h4 class="text-sm font-bold text-white uppercase">{{ phase.name }}</h4>
              <div class="flex items-center space-x-2">
                <button @click="openAddTaskModal(phase)" class="ml-4 px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
                  Add Task
                </button>
                <button @click="openEditPhaseModal(phase)" class="text-sc-grey/20 hover:text-sc-blue transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button @click="handleDeletePhase(phase.id)" class="text-sc-grey/20 hover:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <span class="text-[10px] text-sc-grey/50 uppercase">{{ phase.tasks?.length || 0 }} Objectives</span>
              </div>
            </div>
            <div class="divide-y divide-sc-grey/5">
              <div v-for="task in phase.tasks" :key="task.id" class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div class="flex items-center space-x-4">
                  <div :class="{
                    'bg-green-500/20 text-green-500 border-green-500/30': task.status === 'done',
                    'bg-sc-blue/20 text-sc-blue border-sc-blue/30': task.status === 'in_progress',
                    'bg-sc-grey/10 text-sc-grey/50 border-sc-grey/20': task.status === 'todo'
                  }" class="h-5 w-5 rounded border flex items-center justify-center">
                    <svg v-if="task.status === 'done'" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                  </div>
                  <span :class="task.status === 'done' ? 'text-sc-grey/30 line-through' : 'text-white'" class="text-sm font-semibold transition-all">{{ task.title }}</span>
                </div>
                <div class="flex items-center space-x-4">
                  <span v-if="task.assignee" class="text-[10px] text-sc-blue/70 uppercase font-bold tracking-tighter">{{ task.assignee.display_name }}</span>
                  <button @click="openEditTaskModal(task)" class="text-sc-grey/20 group-hover:text-sc-blue transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button @click="handleDeleteTask(task.id)" class="text-sc-grey/20 group-hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
              <div v-if="phase.tasks?.length === 0" class="p-8 text-center text-sc-grey/20 text-xs italic uppercase tracking-widest">No objectives defined for this phase.</div>
            </div>
          </div>
          
          <div v-if="projectStore.selectedProject.phases?.length === 0" class="bg-sc-panel border border-sc-grey/10 border-dashed p-12 text-center rounded-lg">
            <p class="text-sc-grey/30 uppercase tracking-widest text-sm">No phases initialized.</p>
          </div>
        </div>
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-6">
        <!-- Contribution Goals -->
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 space-y-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xs text-sc-grey font-black uppercase tracking-widest">Contribution Goals</h3>
            <button @click="showAddGoalModal = true" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
              Add Goal
            </button>
          </div>
          
          <div v-for="goal in projectStore.selectedProject.contribution_goals" :key="goal.id" class="space-y-2">
            <div class="flex flex-col">
              <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                <span class="text-sc-blue">{{ goal.resource_type }}</span>
                <span class="text-white">{{ goal.current_amount.toLocaleString() }} / {{ goal.target_amount.toLocaleString() }} {{ goal.unit }}</span>
              </div>
              <p class="text-[8px] text-sc-grey/50 italic">{{ goal.description }}</p>
            </div>
            <div class="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
              <div class="bg-sc-blue h-full transition-all duration-1000 shadow-[0_0_10px_rgba(102,252,241,0.5)]" :style="{ width: Math.min((goal.current_amount / goal.target_amount) * 100, 100) + '%' }"></div>
            </div>
            <div class="flex items-center justify-between gap-2 mt-2">
              <button @click="openContributeModal(goal)" class="flex-1 py-2 bg-white/5 hover:bg-sc-blue/10 text-[8px] text-sc-blue font-bold uppercase tracking-widest border border-sc-blue/20 rounded transition-all">Contribute</button>
              <button @click="openEditGoalModal(goal)" class="text-sc-grey/20 hover:text-sc-blue transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button @click="handleDeleteGoal(goal.id)" class="text-sc-grey/20 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <div class="mt-4 border-t border-sc-grey/10 pt-4">
              <h5 class="text-[8px] text-sc-grey/50 uppercase font-black tracking-widest mb-2">Recent Contributions</h5>
              <div v-if="goal.contributions?.length > 0">
                <div v-for="contribution in goal.contributions" :key="contribution.id" class="flex justify-between items-center text-xs text-sc-grey/70 mb-1">
                  <span>{{ contribution.user?.display_name || 'Anonymous' }} contributed {{ contribution.amount.toLocaleString() }} {{ goal.unit }}</span>
                  <div class="flex items-center space-x-2">
                    <button @click="openEditContributionModal(contribution)" class="text-sc-grey/20 hover:text-sc-blue transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button @click="handleDeleteContribution(contribution.id)" class="text-sc-grey/20 hover:text-red-500 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="goal.contributions?.length === 0" class="text-center py-2 text-sc-grey/30 text-[8px] italic uppercase tracking-widest">No contributions yet.</div>
            </div>
          </div>
          
          <div v-if="projectStore.selectedProject.contribution_goals?.length === 0" class="text-center py-4 text-sc-grey/30 text-[10px] italic uppercase tracking-widest">No active funding goals.</div>
        </div>

        <!-- Manager Info -->
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <h3 class="text-xs text-sc-grey font-black uppercase tracking-widest mb-4">Command</h3>
          <div class="flex items-center space-x-4">
            <div class="h-10 w-10 rounded-full bg-sc-grey/10 border border-sc-blue/30 flex items-center justify-center text-sc-blue text-xs font-black">
              {{ projectStore.selectedProject.manager?.display_name?.charAt(0) || 'M' }}
            </div>
            <div>
              <div class="text-sm font-bold text-white">{{ projectStore.selectedProject.manager?.display_name || 'Project Manager' }}</div>
              <div class="text-[8px] text-sc-grey/50 uppercase font-black tracking-widest">Operations Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AddPhaseModal :show="showAddPhaseModal" @close="showAddPhaseModal = false" @phase-added="projectStore.fetchProject(projectStore.selectedProject.id)" :projectId="projectStore.selectedProject.id" />
  <EditPhaseModal :show="showEditPhaseModal" @close="showEditPhaseModal = false" @phase-updated="projectStore.fetchProject(projectStore.selectedProject.id)" :phase="editingPhase" />

  <AddTaskModal :show="showAddTaskModal" @close="showAddTaskModal = false" @task-added="projectStore.fetchProject(projectStore.selectedProject.id)" :phaseId="currentPhaseId" />
  <EditTaskModal :show="showEditTaskModal" @close="showEditTaskModal = false" @task-updated="projectStore.fetchProject(projectStore.selectedProject.id)" :task="editingTask" />

  <AddContributionGoalModal :show="showAddGoalModal" @close="showAddGoalModal = false" @goal-added="projectStore.fetchProject(projectStore.selectedProject.id)" :projectId="projectStore.selectedProject.id" />
  <EditContributionGoalModal :show="showEditGoalModal" @close="showEditGoalModal = false" @goal-updated="projectStore.fetchProject(projectStore.selectedProject.id)" :goal="editingGoal" />

  <ContributeModal :show="showContributeModal" @close="showContributeModal = false" @contribution-added="projectStore.fetchProject(projectStore.selectedProject.id)" :goal="currentGoalToContribute" />
  <EditContributionModal :show="showEditContributionModal" @close="showEditContributionModal = false" @contribution-updated="projectStore.fetchProject(projectStore.selectedProject.id)" :contribution="editingContribution" />
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { useAuthStore } from '../stores/auth';
import AddPhaseModal from '../components/AddPhaseModal.vue';
import EditPhaseModal from '../components/EditPhaseModal.vue';
import AddTaskModal from '../components/AddTaskModal.vue';
import EditTaskModal from '../components/EditTaskModal.vue';
import AddContributionGoalModal from '../components/AddContributionGoalModal.vue';
import EditContributionGoalModal from '../components/EditContributionGoalModal.vue';
import ContributeModal from '../components/ContributeModal.vue';
import EditContributionModal from '../components/EditContributionModal.vue';

const route = useRoute();
const projectStore = useProjectStore();
const authStore = useAuthStore();

const isManager = computed(() => {
  return projectStore.selectedProject?.manager_id === authStore.user?.id;
});

const handleCompleteProject = async () => {
  if (confirm('Are you sure you want to mark this project as completed? This will archive the operational phases.')) {
    try {
      await projectStore.completeProject(projectStore.selectedProject.id);
    } catch (err) {
      alert(err.message || 'Failed to complete project');
    }
  }
};

const showAddPhaseModal = ref(false);
const showEditPhaseModal = ref(false);
const editingPhase = ref(null);

const showAddTaskModal = ref(false);
const showEditTaskModal = ref(false);
const currentPhaseId = ref(null);
const editingTask = ref(null);

const showAddGoalModal = ref(false);
const showEditGoalModal = ref(false);
const editingGoal = ref(null);

const showContributeModal = ref(false);
const showEditContributionModal = ref(false);
const currentGoalToContribute = ref(null);
const editingContribution = ref(null);


onMounted(() => {
  if (route.params.id) {
    projectStore.fetchProject(parseInt(route.params.id));
  }
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    projectStore.fetchProject(parseInt(newId));
  }
}, { immediate: true });


// --- Phase Handlers ---
const handleAddPhase = async (phaseData) => {
  try {
    await projectStore.createPhase(projectStore.selectedProject.id, phaseData);
    showAddPhaseModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to add project phase');
  }
};
const openEditPhaseModal = (phase) => {
  editingPhase.value = { ...phase };
  showEditPhaseModal.value = true;
};
const handleUpdatePhase = async (updatedPhaseData) => {
  try {
    await projectStore.updatePhase(editingPhase.value.id, updatedPhaseData);
    showEditPhaseModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update phase.');
  }
};
const handleDeletePhase = async (phaseId) => {
  if (confirm('Are you sure you want to delete this phase and all its tasks? This cannot be undone.')) {
    try {
      await projectStore.deletePhase(phaseId);
    } catch (error) {
      alert(error.message || 'Failed to delete phase.');
    }
  }
};


// --- Task Handlers ---
const openAddTaskModal = (phase) => {
  currentPhaseId.value = phase.id;
  showAddTaskModal.value = true;
};
const handleAddTask = async (taskData) => {
  try {
    await projectStore.createTask(currentPhaseId.value, taskData);
    showAddTaskModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to add task');
  }
};
const openEditTaskModal = (task) => {
  editingTask.value = { ...task };
  showEditTaskModal.value = true;
};
const handleUpdateTask = async (updatedTaskData) => {
  try {
    await projectStore.updateTask(editingTask.value.id, updatedTaskData);
    showEditTaskModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update task.');
  }
};
const handleDeleteTask = async (taskId) => {
  if (confirm('Are you sure you want to delete this task? This cannot be undone.')) {
    try {
      await projectStore.deleteTask(taskId);
    } catch (error) {
      alert(error.message || 'Failed to delete task.');
    }
  }
};


// --- Contribution Goal Handlers ---
const handleAddGoal = async (goalData) => {
  try {
    await projectStore.createContributionGoal(projectStore.selectedProject.id, goalData);
    showAddGoalModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to add contribution goal');
  }
};
const openEditGoalModal = (goal) => {
  editingGoal.value = { ...goal };
  showEditGoalModal.value = true;
};
const handleUpdateGoal = async (updatedGoalData) => {
  try {
    await projectStore.updateContributionGoal(editingGoal.value.id, updatedGoalData);
    showEditGoalModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update contribution goal.');
  }
};
const handleDeleteGoal = async (goalId) => {
  if (confirm('Are you sure you want to delete this contribution goal and all its contributions? This cannot be undone.')) {
    try {
      await projectStore.deleteContributionGoal(goalId);
    } catch (error) {
      alert(error.message || 'Failed to delete contribution goal.');
    }
  }
};


// --- Contribution Handlers ---
const openContributeModal = (goal) => {
  currentGoalToContribute.value = { ...goal };
  showContributeModal.value = true;
};
const handleContribute = async (contributionData) => {
  try {
    await projectStore.addContribution(currentGoalToContribute.value.id, contributionData);
    showContributeModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to add contribution');
  }
};
const openEditContributionModal = (contribution) => {
  editingContribution.value = { ...contribution };
  showEditContributionModal.value = true;
};
const handleUpdateContribution = async (updatedContributionData) => {
  try {
    await projectStore.updateContribution(editingContribution.value.id, updatedContributionData);
    showEditContributionModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update contribution.');
  }
};
const handleDeleteContribution = async (contributionId) => {
  if (confirm('Are you sure you want to delete this contribution? This cannot be undone.')) {
    try {
      await projectStore.deleteContribution(contributionId);
    } catch (error) {
      alert(error.message || 'Failed to delete contribution.');
    }
  }
};
</script>
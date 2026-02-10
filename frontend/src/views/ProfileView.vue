<template>
  <div class="profile-view max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Citizen Profile</h1>

    <!-- RSI Verification Section -->
    <RSIVerification />

    <!-- Profile Settings (placeholder) -->
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 mt-6">
      <h2 class="text-xl font-bold text-sc-light-blue mb-4">Profile Settings</h2>
      <p class="text-sc-grey">Profile editing features coming soon...</p>
    </div>
  </div>
</template>

<script setup>
import RSIVerification from '../components/RSIVerification.vue';
</script>

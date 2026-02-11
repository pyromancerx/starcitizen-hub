import { defineStore } from 'pinia';
import AnnouncementsService from '../services/AnnouncementsService';

export const useAnnouncementStore = defineStore('announcement', {
  state: () => ({
    announcements: [],
    publicAnnouncements: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchAnnouncements() {
      this.isLoading = true;
      try {
        this.announcements = await AnnouncementsService.getAnnouncements();
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch announcements:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchPublicAnnouncements() {
      this.isLoading = true;
      try {
        this.publicAnnouncements = await AnnouncementsService.getPublicAnnouncements();
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch public announcements:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async createAnnouncement(announcementData) {
      this.isLoading = true;
      try {
        const newAnnouncement = await AnnouncementsService.createAnnouncement(announcementData);
        this.announcements.push(newAnnouncement);
        return newAnnouncement;
      } catch (error) {
        this.error = error;
        console.error('Failed to create announcement:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateAnnouncement(id, announcementData) {
      this.isLoading = true;
      try {
        const updatedAnnouncement = await AnnouncementsService.updateAnnouncement(id, announcementData);
        const index = this.announcements.findIndex(ann => ann.id === id);
        if (index !== -1) {
          this.announcements[index] = updatedAnnouncement;
        }
        return updatedAnnouncement;
      } catch (error) {
        this.error = error;
        console.error('Failed to update announcement:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteAnnouncement(id) {
      this.isLoading = true;
      try {
        await AnnouncementsService.deleteAnnouncement(id);
        this.announcements = this.announcements.filter(ann => ann.id !== id);
      } catch (error) {
        this.error = error;
        console.error('Failed to delete announcement:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
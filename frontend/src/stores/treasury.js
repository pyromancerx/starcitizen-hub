// src/stores/treasury.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const useTreasuryStore = defineStore('treasury', {
  state: () => ({
    wallets: [],
    selectedWallet: null,
    transactions: [],
    pendingTransactions: [],
    report: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    primaryWallet: (state) => state.wallets.find(w => w.is_primary) || state.wallets[0],
    totalBalance: (state) => state.wallets.reduce((sum, w) => sum + w.balance, 0),
    pendingCount: (state) => state.pendingTransactions.length,
  },

  actions: {
    async fetchWallets() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/treasury/wallets');
        this.wallets = response.data;
        if (!this.selectedWallet && this.wallets.length > 0) {
          this.selectedWallet = this.primaryWallet;
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch wallets';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createWallet(walletData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/treasury/wallets', walletData);
        this.wallets.push(response.data);
        if (response.data.is_primary || this.wallets.length === 1) {
          this.selectedWallet = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create wallet';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateWallet(walletId, walletData) { // Renamed and changed params
      this.isLoading = true;
      this.error = null;
      try {
        // If the updated wallet is set as primary, unmark others locally (backend handles db)
        if (walletData.is_primary) {
          this.wallets.forEach(w => {
            if (w.id !== walletId) {
              w.is_primary = false;
            }
          });
        }

        const response = await api.patch(`/treasury/wallets/${walletId}`, walletData); // Changed to patch and pass data object
        const index = this.wallets.findIndex(w => w.id === walletId);
        if (index !== -1) {
          this.wallets[index] = response.data;
        }
        if (this.selectedWallet?.id === walletId) {
          this.selectedWallet = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update wallet';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteWallet(walletId) {
      this.isLoading = true;
      this.error = null;
      try {
        await api.delete(`/treasury/wallets/${walletId}`);
        this.wallets = this.wallets.filter(w => w.id !== walletId);
        if (this.selectedWallet?.id === walletId) {
          this.selectedWallet = this.wallets[0] || null;
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete wallet';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async selectWallet(walletId) {
      const wallet = this.wallets.find(w => w.id === walletId);
      if (wallet) {
        this.selectedWallet = wallet;
        await this.fetchTransactions(walletId);
      }
    },

    async fetchTransactions(walletId, filters = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        
        const response = await api.get(`/treasury/wallets/${walletId}/transactions?${params}`);
        this.transactions = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch transactions';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createTransaction(walletId, type, amount, category, description = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post(`/treasury/wallets/${walletId}/transactions`, {
          type,
          amount,
          category,
          description,
        });
        
        // Update local state
        this.transactions.unshift(response.data);
        
        // Update wallet balance if deposit (auto-approved)
        if (type === 'deposit' && response.data.status === 'approved') {
          const wallet = this.wallets.find(w => w.id === walletId);
          if (wallet) {
            wallet.balance += amount;
          }
        }
        
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create transaction';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPendingTransactions() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/treasury/pending');
        this.pendingTransactions = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch pending transactions';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async approveTransaction(transactionId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post(`/treasury/transactions/${transactionId}/approve`);
        
        // Remove from pending
        this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
        
        // Update transaction in list if present
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
          this.transactions[index] = response.data;
        }
        
        // Update wallet balance
        const wallet = this.wallets.find(w => w.id === response.data.treasury_id);
        if (wallet && response.data.type === 'withdrawal') {
          wallet.balance -= response.data.amount;
        }
        
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to approve transaction';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async rejectTransaction(transactionId, notes = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post(`/treasury/transactions/${transactionId}/reject`, {
          approved: false,
          notes,
        });
        
        // Remove from pending
        this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transactionId);
        
        // Update transaction in list if present
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
          this.transactions[index] = response.data;
        }
        
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to reject transaction';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchReport(walletId, days = 30) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`/treasury/wallets/${walletId}/reports/summary?days=${days}`);
        this.report = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch report';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

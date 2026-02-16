'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  TrendingUp,
  CreditCard,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const transactionMutation = useMutation({
    mutationFn: async (data: { amount: number, description: string, type: string }) => {
      return api.post('/wallet/transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowDepositModal(false);
      setShowWithdrawModal(false);
      setAmount('');
      setDescription('');
    },
  });

  const handleTransaction = (type: 'deposit' | 'withdraw') => {
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;
    
    transactionMutation.mutate({
      amount: type === 'deposit' ? val : -val,
      description: description || (type === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal'),
      type: type
    });
  };

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/');
      return res.data;
    },
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const res = await api.get('/wallet/transactions');
      return res.data;
    },
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Financial Terminal
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Secure Credits Management & Ledger
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={() => setShowDepositModal(true)} className="flex-1 md:flex-none px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Deposit
          </button>
          <button onClick={() => setShowWithdrawModal(true)} className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 border border-red-500 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center">
            <Minus className="w-4 h-4 mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-sc-panel to-sc-dark border border-sc-blue/30 rounded-lg p-6 md:p-10 flex flex-col md:flex-row justify-between items-center shadow-[0_0_30px_rgba(var(--color-sc-blue-rgb),0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet className="w-24 h-24 md:w-32 md:h-32" />
        </div>
        
        <div className="relative z-10 text-center md:text-left space-y-2">
          <div className="text-[8px] md:text-[10px] text-sc-blue font-black uppercase tracking-[0.3em] flex items-center justify-center md:justify-start">
            <Shield className="w-3 h-3 mr-2" />
            Available Credits (aUEC)
          </div>
          <div className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tighter">
            {walletLoading ? (
              <span className="opacity-20">XXXXXXXX</span>
            ) : (
              (wallet?.balance_auec || 0).toLocaleString()
            )}
          </div>
          <div className="text-[8px] md:text-[10px] text-sc-grey/40 font-mono italic">
            Last Synced: {wallet?.last_updated_at ? new Date(wallet.last_updated_at).toLocaleString() : 'Just now'}
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex space-x-4 w-full md:w-auto justify-center">
          <div className="bg-black/40 border border-sc-grey/10 rounded p-3 md:p-4 text-center flex-1 md:min-w-[120px]">
            <div className="text-[7px] md:text-[8px] text-sc-grey/40 font-black uppercase tracking-widest mb-1">Weekly Profit</div>
            <div className="text-xs md:text-sm font-bold text-green-400 font-mono">+124,500</div>
          </div>
          <div className="bg-black/40 border border-sc-grey/10 rounded p-3 md:p-4 text-center flex-1 md:min-w-[120px]">
            <div className="text-[7px] md:text-[8px] text-sc-grey/40 font-black uppercase tracking-widest mb-1">Assets Value</div>
            <div className="text-xs md:text-sm font-bold text-sc-blue font-mono">14.2M</div>
          </div>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-sc-blue" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transaction Ledger</h3>
        </div>

        <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-sc-grey/10">
                  <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Timestamp</th>
                  <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Classification</th>
                  <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Description</th>
                  <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sc-grey/5">
                {txLoading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-xs italic font-mono animate-pulse">
                      Downloading encrypted ledger data...
                    </td>
                  </tr>
                ) : transactions?.length > 0 ? (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-[10px] text-sc-grey/70 font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 border rounded text-[9px] uppercase font-bold tracking-widest",
                          tx.amount >= 0 
                            ? "bg-green-500/10 border-green-500/20 text-green-400" 
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-white max-w-xs truncate">
                        {tx.description || 'No data recorded'}
                      </td>
                      <td className={cn(
                        "p-4 text-right font-mono font-bold",
                        tx.amount >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-24 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <TrendingUp className="w-12 h-12 mb-4" />
                        <p className="text-sm uppercase tracking-[0.3em] text-sc-grey italic">No financial activity recorded in current cycle.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showDepositModal || showWithdrawModal) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-sc-panel border border-sc-blue/20 rounded-lg p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
              {showDepositModal ? 'Credit Injection' : 'Credit Disbursement'}
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Amount (aUEC)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-sc-grey/10 rounded px-3 py-2 text-white font-mono focus:border-sc-blue/50 focus:outline-none transition-colors"
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Reference Note</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-sc-grey/10 rounded px-3 py-2 text-white text-xs focus:border-sc-blue/50 focus:outline-none transition-colors"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button 
                onClick={() => {
                  setShowDepositModal(false);
                  setShowWithdrawModal(false);
                  setAmount('');
                  setDescription('');
                }}
                className="flex-1 py-2 border border-sc-grey/20 text-sc-grey text-[10px] font-black uppercase rounded hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleTransaction(showDepositModal ? 'deposit' : 'withdraw')}
                disabled={transactionMutation.isPending || !amount}
                className="flex-1 py-2 bg-sc-blue text-sc-dark text-[10px] font-black uppercase rounded hover:bg-white transition-all disabled:opacity-50"
              >
                {transactionMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component Helper
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
  </svg>
);

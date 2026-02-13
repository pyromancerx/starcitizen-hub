'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Package, 
  Search, 
  Plus, 
  MapPin, 
  Tag, 
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory/');
      return res.data;
    },
  });

  const filteredItems = items?.filter((item: any) => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Personal Inventory
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Encrypted Asset Database
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text" 
              placeholder="Scan items..." 
              className="bg-black/30 border border-sc-grey/20 rounded pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20 min-w-[200px]"
            />
          </div>
          <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-sc-grey/10">
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-center w-20">Qty</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Item Designation</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Classification</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Storage Location</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sc-grey/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sc-blue"></div>
                      <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic">Decrypting data streams...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems?.length > 0 ? (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-center font-mono text-sc-blue font-bold text-lg">{item.quantity}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-tight">{item.item_name}</span>
                        <span className="text-[8px] text-sc-grey/20 font-mono uppercase">ID: {item.id.toString().padStart(6, '0')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3 h-3 text-sc-light-blue opacity-50" />
                        <span className="px-2 py-0.5 bg-sc-light-blue/10 border border-sc-light-blue/20 rounded-full text-[9px] uppercase text-sc-light-blue font-bold tracking-widest">
                          {item.item_type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-sc-grey/70">
                        <MapPin className="w-3 h-3 opacity-50" />
                        <span className="text-xs italic font-medium">{item.location || 'Unknown Coordinates'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-sc-blue/10 rounded text-sc-grey/40 hover:text-sc-blue transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-red-500/10 rounded text-sc-grey/40 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Package className="w-12 h-12 mb-4" />
                      <p className="text-sm uppercase tracking-[0.3em] text-sc-grey italic">No signals found in current scan parameters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

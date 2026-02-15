'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { 
  Package, 
  Search, 
  Plus, 
  MapPin, 
  Tag, 
  Edit2,
  Trash2,
  Database,
  Layers,
  Info,
  ShoppingCart,
  Box,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

function InventoryContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'personal' | 'database'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbCategory, setDbCategory] = useState('');
  const [dbSubCategory, setDbSubCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'database' || tab === 'personal') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Personal Inventory Query
  const { data: items, isLoading: isPersonalLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory/');
      return res.data;
    },
    enabled: activeTab === 'personal',
  });

  // Global Database Query
  const { data: dbItems, isLoading: isDbLoading } = useQuery({
    queryKey: ['game-items', dbSearchQuery, dbCategory, dbSubCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dbSearchQuery) params.append('q', dbSearchQuery);
      if (dbCategory) params.append('category', dbCategory);
      if (dbSubCategory) params.append('sub_category', dbSubCategory);
      const res = await api.get(`/game-data/items?${params.toString()}`);
      return res.data;
    },
    enabled: activeTab === 'database',
  });

  const filteredItems = items?.filter((item: any) => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryGroups = [
    {
      name: 'Ship Components',
      items: [
        { id: 'WeaponGun', label: 'Ship Weapons', sub: 'Gun,Rocket' },
        { id: 'Turret', label: 'Turrets', sub: 'GunTurret,MannedTurret,BallTurret,MissileTurret' },
        { id: 'Shield', label: 'Shield Generators' },
        { id: 'PowerPlant', label: 'Power Plants', sub: 'Power' },
        { id: 'Cooler', label: 'Coolers' },
        { id: 'QuantumDrive', label: 'Quantum Drives' },
        { id: 'Missile', label: 'Missiles', sub: 'Missile,Torpedo,GroundVehicleMissile' },
        { id: 'Paints', label: 'Vessel Paints' },
        { id: 'Armor', label: 'Vessel Armor', sub: 'Heavy,Medium,Light' },
      ]
    },
    {
      name: 'Player Gear',
      items: [
        { id: 'Char_Armor_Helmet', label: 'Helmets', sub: 'Heavy,Medium,Light' },
        { id: 'Char_Armor_Torso', label: 'Torso Armor', sub: 'Heavy,Medium,Light' },
        { id: 'Char_Armor_Arms', label: 'Arms Armor', sub: 'Heavy,Medium,Light' },
        { id: 'Char_Armor_Legs', label: 'Legs Armor', sub: 'Heavy,Medium,Light' },
        { id: 'Char_Armor_Undersuit', label: 'Undersuits' },
        { id: 'Char_Armor_Backpack', label: 'Backpacks', sub: 'Personal,LightArmor' },
        { id: 'WeaponPersonal', label: 'Personal Weapons', sub: 'Small,Medium,Large,Knife,Grenade' },
        { id: 'FPS_Consumable', label: 'Medical & Utility', sub: 'Medical,Hacking,MedPack' },
        { id: 'Clothing', label: 'Civilian Clothing', apiCategory: 'Char_Clothing_Feet,Char_Clothing_Hands,Char_Clothing_Hat,Char_Clothing_Legs,Char_Clothing_Torso_0,Char_Clothing_Torso_1,Char_Clothing_Torso_2' },
      ]
    }
  ];

  const handleCategorySelect = (catId: string, apiCat?: string) => {
    setDbSubCategory(''); // Reset sub on main category change
    if (catId === dbCategory || (apiCat && apiCat === dbCategory)) {
      setDbCategory('');
    } else {
      setDbCategory(apiCat || catId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Logistics Hub
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            {activeTab === 'personal' ? 'Encrypted Asset Database' : 'UEE Central Item Registry'}
          </p>
        </div>

        <div className="flex bg-black/40 border border-sc-grey/10 p-1 rounded backdrop-blur-md self-start">
          <button 
            onClick={() => setActiveTab('personal')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-2",
              activeTab === 'personal' ? "bg-sc-blue text-white" : "text-sc-grey/40 hover:text-sc-grey"
            )}
          >
            <Box className="w-3 h-3" />
            <span>Personal</span>
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-2",
              activeTab === 'database' ? "bg-sc-blue text-white" : "text-sc-grey/40 hover:text-sc-grey"
            )}
          >
            <Database className="w-3 h-3" />
            <span>Global Database</span>
          </button>
        </div>
      </div>

      {activeTab === 'personal' ? (
        <>
          <div className="flex justify-between items-center bg-sc-panel/50 p-4 border border-sc-grey/10 rounded">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text" 
                placeholder="Scan personal assets..." 
                className="bg-black/30 border border-sc-grey/20 rounded pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20 min-w-[280px]"
              />
            </div>
            <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Manifest Asset
            </button>
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
                  {isPersonalLoading ? (
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
              <div className="bg-black/40 p-3 border-b border-sc-grey/10 flex items-center space-x-2">
                <Layers className="w-3 h-3 text-sc-blue" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Asset Classification</span>
              </div>
              
              <div className="p-2 space-y-4">
                <button
                  onClick={() => { setDbCategory(''); setDbSubCategory(''); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2",
                    dbCategory === '' 
                      ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                      : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                  )}
                >
                  All Hub Records
                </button>

                {categoryGroups.map((group) => (
                  <div key={group.name} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[8px] font-black text-sc-grey/30 uppercase tracking-[0.2em]">
                      {group.name}
                    </div>
                    {group.items.map((cat: any) => (
                      <div key={cat.id} className="space-y-0.5">
                        <button
                          onClick={() => handleCategorySelect(cat.id, cat.apiCategory)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2 flex justify-between items-center",
                            (dbCategory === cat.id || (cat.apiCategory && dbCategory === cat.apiCategory))
                              ? "bg-sc-blue/5 border-sc-blue text-sc-blue" 
                              : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                          )}
                        >
                          <span>{cat.label}</span>
                          {(dbCategory === cat.id || (cat.apiCategory && dbCategory === cat.apiCategory)) && <ChevronRight className="w-2.5 h-2.5" />}
                        </button>

                        {/* Sub-categories if main category is selected */}
                        {(dbCategory === cat.id || (cat.apiCategory && dbCategory === cat.apiCategory)) && cat.sub && (
                          <div className="pl-4 pr-1 py-1 grid grid-cols-1 gap-1">
                            {cat.sub.split(',').map((sub) => (
                              <button
                                key={sub}
                                onClick={() => setDbSubCategory(dbSubCategory === sub ? '' : sub)}
                                className={cn(
                                  "text-left px-2 py-1 text-[9px] uppercase tracking-tighter font-bold transition-all rounded",
                                  dbSubCategory === sub 
                                    ? "bg-sc-blue text-sc-dark" 
                                    : "text-sc-grey/30 hover:text-sc-blue hover:bg-sc-blue/5"
                                )}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sc-blue/5 border border-sc-blue/20 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-3 h-3 text-sc-blue" />
                <span className="text-[10px] font-black text-sc-blue uppercase tracking-widest">Global Sync</span>
              </div>
              <p className="text-[10px] text-sc-grey/60 leading-relaxed italic">
                Data provided by UEE Intelligence and scunpacked. Prices and locations are updated periodically via FTL data link.
              </p>
            </div>
          </div>

          {/* Item Grid/Search */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
              <input 
                value={dbSearchQuery}
                onChange={(e) => setDbSearchQuery(e.target.value)}
                type="text" 
                placeholder="Query global database..." 
                className="w-full bg-sc-panel border border-sc-grey/10 rounded pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isDbLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 bg-sc-panel/50 border border-sc-grey/5 rounded animate-pulse" />
                ))
              ) : dbItems?.length > 0 ? (
                dbItems.map((item: any) => (
                  <div key={item.id} className="bg-sc-panel border border-sc-grey/10 rounded p-4 hover:border-sc-blue/30 transition-all group relative overflow-hidden">
                    {/* Background Highlight */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-sc-blue/5 -rotate-45 translate-x-8 -translate-y-8 group-hover:bg-sc-blue/10 transition-all" />
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-sc-blue transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-[8px] text-sc-grey/40 uppercase font-mono">{item.manufacturer}</span>
                          <span className="text-[8px] text-sc-grey/20">•</span>
                          <span className="text-[8px] text-sc-blue uppercase font-bold tracking-tighter">
                            {item.category} {item.sub_category ? `(${item.sub_category})` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="bg-black/40 border border-sc-grey/10 px-2 py-0.5 rounded text-[10px] font-mono text-sc-light-blue">
                        SZ {item.size}
                      </span>
                    </div>

                    <p className="text-[10px] text-sc-grey/50 line-clamp-2 mb-4 italic leading-relaxed">
                      {item.description || "No official technical documentation available for this asset."}
                    </p>

                                          <div className="flex justify-between items-center mt-auto pt-4 border-t border-sc-grey/5">

                                            <div className="flex items-center space-x-1">

                                              <ShoppingCart className="w-3 h-3 text-sc-grey/40" />

                                              <span className="text-[10px] font-mono text-sc-grey/60">

                                                {item.base_price > 0 ? `${item.base_price.toLocaleString()} UEC` : 'Unavailable'}

                                              </span>

                                            </div>

                                            <button 

                                              onClick={() => setSelectedItem(item)}

                                              className="text-[9px] font-black uppercase tracking-widest text-sc-blue hover:text-white transition-colors flex items-center space-x-1"

                                            >

                                              <span>Details</span>

                                              <Info className="w-2.5 h-2.5" />

                                            </button>

                                          </div>

                    
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-sc-panel/30 border border-dashed border-sc-grey/10 rounded">
                  <div className="flex flex-col items-center opacity-30">
                    <Database className="w-12 h-12 mb-4" />
                    <p className="text-sm uppercase tracking-[0.3em] text-sc-grey italic">No matching records in central database.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-2xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Box className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Asset Technical Specifications</h3>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black text-sc-blue uppercase tracking-[0.2em]">{selectedItem.manufacturer}</div>
                            <h2 className="text-2xl font-bold text-white italic tracking-tight uppercase">{selectedItem.name}</h2>
                        </div>
                        <div className="bg-sc-blue/10 border border-sc-blue/20 px-4 py-2 rounded text-center">
                            <div className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Classification</div>
                            <div className="text-xs font-bold text-white uppercase">{selectedItem.category}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/20 border border-white/5 p-3 rounded text-center">
                            <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Size</div>
                            <div className="text-sm font-mono text-white">SZ {selectedItem.size}</div>
                        </div>
                        <div className="bg-black/20 border border-white/5 p-3 rounded text-center">
                            <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Grade</div>
                            <div className="text-sm font-mono text-white">{selectedItem.grade || 'C'}</div>
                        </div>
                        <div className="bg-black/20 border border-white/5 p-3 rounded text-center">
                            <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Base Price</div>
                            <div className="text-sm font-mono text-sc-light-blue">{selectedItem.base_price > 0 ? `${selectedItem.base_price.toLocaleString()} UEC` : 'N/A'}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest border-b border-white/5 pb-1">Technical Overview</div>
                        <p className="text-xs text-sc-grey/80 leading-relaxed italic">
                            {selectedItem.description || "No official UEE technical documentation available for this asset. Field reports suggest standard performance within its classification."}
                        </p>
                    </div>

                    {selectedItem.locations && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest border-b border-white/5 pb-1">Known Procurement Locations</div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(() => {
                                    try {
                                        const locs = JSON.parse(selectedItem.locations);
                                        return Array.isArray(locs) && locs.length > 0 ? locs.map((loc: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-sc-dark border border-sc-grey/10 rounded text-[9px] text-sc-grey font-bold uppercase tracking-tighter">
                                                {loc}
                                            </span>
                                        )) : <span className="text-[9px] text-sc-grey/40 italic uppercase">Coordinates Encrypted or Restricted</span>;
                                    } catch (e) {
                                        return <span className="text-[9px] text-sc-grey/40 italic uppercase">Coordinates Encrypted or Restricted</span>;
                                    }
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/40 border-t border-sc-blue/10 flex justify-end">
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="px-8 py-2 bg-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all"
                    >
                        Close Registry Entry
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-sc-blue"></div>
        <span className="text-xs text-sc-grey/40 uppercase tracking-widest font-mono italic">Initializing logistics link...</span>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}

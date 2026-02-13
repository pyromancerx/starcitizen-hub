'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Database, 
  ChevronRight, 
  Plus,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects/');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Organization Logistics
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Long-term Strategic Objectives
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Launch Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Database className="w-12 h-12 text-sc-blue opacity-20 animate-spin" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Synchronizing manifest files...</span>
            </div>
          </div>
        ) : projects?.length > 0 ? (
          projects.map((project: any) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.id}`}
              className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[8px] font-black uppercase text-sc-blue tracking-widest">
                      {project.status}
                    </span>
                    <span className="text-[10px] text-sc-grey/30 font-mono">ID: PRJ-{project.id.toString().padStart(3, '0')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase group-hover:text-sc-blue transition-colors italic tracking-tight">
                    {project.title}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-grey/20 group-hover:text-sc-blue/50 transition-colors">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-sc-grey/60 line-clamp-2 mb-6 min-h-[2.5rem]">
                {project.description || 'No classification data provided for this objective.'}
              </p>

              <div className="space-y-4">
                {/* Progress Bar Mockup (Real data would come from contribution goals) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-sc-grey/40">Acquisition Progress</span>
                    <span className="text-sc-blue">65%</span>
                  </div>
                  <div className="w-full bg-sc-dark h-1 rounded-full overflow-hidden">
                    <div className="bg-sc-blue h-full w-2/3 shadow-[0_0_8px_#66fcf1] transition-all duration-1000"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-sc-grey/5">
                  <div className="flex items-center space-x-4 text-[9px] font-bold uppercase text-sc-grey/40">
                    <span className="flex items-center tracking-widest">
                      <BarChart3 className="w-3 h-3 mr-1.5 opacity-50" />
                      4 Phases
                    </span>
                    <span className="flex items-center tracking-widest">
                      <Calendar className="w-3 h-3 mr-1.5 opacity-50" />
                      ETA: 2956.04.12
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sc-grey/20 group-hover:text-sc-blue group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">Manifest is empty. No projects authorized.</p>
          </div>
        )}
      </div>
    </div>
  );
}

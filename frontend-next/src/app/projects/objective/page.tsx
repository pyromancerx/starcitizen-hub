'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Target, 
  BarChart3, 
  Database,
  Calendar,
  Layers,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ProjectContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/projects" className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
              {isLoading ? 'Loading Objective...' : project?.title}
            </h2>
            <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-mono ml-4">
              Project Reference: PRJ-{id?.toString().padStart(4, '0')}
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Layers className="w-4 h-4 mr-2" />
          Manage Phases
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="bg-sc-panel border border-sc-grey/10 rounded p-8">
            <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] mb-4 border-b border-sc-blue/20 pb-2">Operational Scope</h3>
            <p className="text-sm text-sc-grey/80 leading-relaxed font-medium">
              {project?.description || 'No classified documentation found for this strategic objective.'}
            </p>
          </div>

          {/* Phases & Tasks */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-4">Strategic Timeline</h3>
            <div className="space-y-6">
              {project?.phases?.map((phase: any) => (
                <div key={phase.id} className="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-xl">
                  <div className="bg-black/40 p-4 border-b border-sc-grey/10 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-sc-blue uppercase tracking-widest italic">{phase.name}</h4>
                    <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Phase {phase.sort_order}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {phase.tasks?.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-sc-dark/50 border border-sc-grey/5 rounded hover:border-sc-blue/20 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                            task.status === 'completed' ? "bg-sc-blue border-sc-blue text-sc-dark" : "border-sc-grey/30"
                          )}>
                            {task.status === 'completed' && <CheckSquare className="w-3 h-3" />}
                          </div>
                          <span className={cn(
                            "text-xs font-bold transition-all",
                            task.status === 'completed' ? "text-sc-grey/30 line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[8px] font-black text-sc-grey/20 uppercase group-hover:text-sc-blue/40 transition-colors">
                          {task.status}
                        </span>
                      </div>
                    ))}
                    {(!phase.tasks || phase.tasks.length === 0) && (
                      <div className="text-center p-4 text-[10px] text-sc-grey/30 uppercase italic">No tasks assigned to this phase.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-sc-panel border border-sc-blue/20 rounded p-6 space-y-6">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Project Status</span>
              <div className="text-lg font-bold text-sc-blue uppercase italic tracking-tighter">{project?.status || 'Active'}</div>
            </div>

            <div className="space-y-4 pt-4 border-t border-sc-grey/10">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                <Database className="w-3 h-3 mr-2 text-sc-blue" />
                Contribution Goals
              </h4>
              {project?.contribution_goals?.map((goal: any) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span className="text-sc-grey/60">{goal.resource_type}</span>
                    <span className="text-white">{goal.current_amount} / {goal.target_amount} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-sc-dark h-1.5 rounded-full overflow-hidden border border-sc-grey/10">
                    <div 
                      className="bg-sc-blue h-full shadow-[0_0_8px_#66fcf1] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (goal.current_amount / goal.target_amount) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all">
              Submit Resources
            </button>
          </div>

          <div className="bg-sc-panel border border-sc-grey/10 rounded p-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Project Command</h4>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue font-bold">
                {project?.manager?.display_name?.charAt(0) || 'M'}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white uppercase">{project?.manager?.display_name || 'Project Manager'}</div>
                <div className="text-[8px] text-sc-grey/40 font-black uppercase tracking-widest">Logistics Lead</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div>Loading strategic data...</div>}>
      <ProjectContent />
    </Suspense>
  );
}

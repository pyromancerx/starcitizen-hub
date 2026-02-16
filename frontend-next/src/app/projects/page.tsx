'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Briefcase, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Plus,
  Box,
  Layers,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['org-projects'],
    queryFn: async () => {
      const res = await api.get('/projects/');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic border-l-4 border-sc-blue pl-4">
            Strategic Initiatives
          </h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em] ml-4">
            Organization Progress & Objective Tracker
          </p>
        </div>
        <button 
            onClick={() => alert('Strategic planning clearance required: Only logistics leads can authorize new initiatives.')}
            className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase rounded hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]"
        >
            <Plus className="w-4 h-4" />
            <span>Authorize Initiative</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Layers className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Accessing Strategic Databank...</span>
            </div>
          </div>
        ) : projects?.length > 0 ? (
          projects.map((project: any) => (
            <ProjectRow key={project.id} project={project} />
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded-lg opacity-40">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">All strategic sectors cleared. No active initiatives.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const ProjectRow = ({ project }: { project: any }) => {
    // Calculate total progress from contribution goals
    const totalProgress = project.contribution_goals?.length > 0
        ? project.contribution_goals.reduce((acc: number, goal: any) => acc + (goal.current_amount / goal.target_amount), 0) / project.contribution_goals.length * 100
        : 0;

    return (
        <div className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden group hover:border-sc-blue/30 transition-all duration-500 shadow-xl flex flex-col md:flex-row">
            {/* Status Side */}
            <div className="md:w-48 bg-sc-dark border-r border-sc-grey/5 p-8 flex flex-col items-center justify-center space-y-3 group-hover:bg-black/40 transition-colors relative">
                <div className="relative h-20 w-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={226.2} strokeDashoffset={226.2 - (226.2 * totalProgress) / 100} className="text-sc-blue transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-white font-mono">{Math.round(totalProgress)}%</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[8px] font-black text-sc-blue uppercase tracking-widest px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded-full">{project.status}</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight italic group-hover:text-sc-blue transition-colors">{project.title}</h3>
                        <p className="text-[10px] text-sc-grey/60 font-bold uppercase tracking-widest max-w-2xl line-clamp-1">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="text-right">
                            <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Target Date</div>
                            <div className="text-[10px] font-bold text-white font-mono">{project.target_date ? new Date(project.target_date).toLocaleDateString() : 'TBD'}</div>
                        </div>
                    </div>
                </div>

                {/* Sub-Items (Contribution Goals Preview) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.contribution_goals?.slice(0, 3).map((goal: any) => (
                        <div key={goal.id} className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-sc-grey/40">
                                <span>{goal.resource_type}</span>
                                <span>{Math.round((goal.current_amount / goal.target_amount) * 100)}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-sc-blue/40 transition-all duration-1000" style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                    {!project.contribution_goals?.length && (
                        <div className="col-span-full text-[9px] text-sc-grey/20 uppercase font-black italic">Waiting for resource allocation...</div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="p-8 bg-black/20 md:w-48 flex items-center justify-center">
                <Link 
                    href={`/projects/objective?id=${project.id}`}
                    className="w-full py-3 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-[0.2em] rounded text-center hover:bg-sc-blue hover:text-sc-dark transition-all duration-300 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.05)]"
                >
                    Review Intel
                </Link>
            </div>
        </div>
    );
};

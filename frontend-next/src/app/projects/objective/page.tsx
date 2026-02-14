'use client';

import React, { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Target, 
  BarChart3, 
  Database,
  Calendar,
  Layers,
  CheckSquare,
  X,
  TrendingUp,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ProjectContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submission, setSubmission] = useState({
    goal_id: 0,
    amount: 0,
    notes: ''
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/contributions`, {
        ...submission,
        project_id: Number(id)
      });
    },
    onSuccess: () => {
      setShowSubmitModal(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      alert('Strategic contribution synchronized with organization ledger.');
    }
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

            <button 
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]"
            >
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

      {/* Submit Resource Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-lg shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Resource Contribution Authorization</h3>
                    </div>
                    <button onClick={() => setShowSubmitModal(false)} className="text-sc-grey hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Objective Goal</label>
                            <select 
                                value={submission.goal_id}
                                onChange={(e) => setSubmission({...submission, goal_id: Number(e.target.value)})}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                            >
                                <option value="0">Select target resource...</option>
                                {project?.contribution_goals?.map((goal: any) => (
                                    <option key={goal.id} value={goal.id}>{goal.resource_type} (Target: {goal.target_amount})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Allocated Quantity</label>
                            <input 
                                type="number"
                                value={submission.amount}
                                onChange={(e) => setSubmission({...submission, amount: Number(e.target.value)})}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Manifest Notes</label>
                            <textarea 
                                value={submission.notes}
                                onChange={(e) => setSubmission({...submission, notes: e.target.value})}
                                rows={3}
                                placeholder="Logistical details of the transfer..."
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-start space-x-3">
                        <TrendingUp className="w-4 h-4 text-sc-blue mt-0.5" />
                        <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                            Authorized submission will update the organization's strategic reserves and contribute to overall objective health.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowSubmitModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || !submission.goal_id || !submission.amount}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {submitMutation.isPending ? 'Synchronizing...' : 'Authorize Transfer'}
                    </button>
                </div>
            </div>
        </div>
      )}
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

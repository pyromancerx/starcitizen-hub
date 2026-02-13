'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Rocket, 
  Shield, 
  Trophy, 
  TrendingUp, 
  Activity as ActivityIcon,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/stats/dashboard');
      return res.data;
    },
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const res = await api.get('/activity/feed');
      return res.data;
    },
  });

  const statCards = [
    { label: 'Fleet Readiness', value: `${stats?.fleet_readiness || 0}%`, icon: Rocket, color: 'text-sc-blue' },
    { label: 'Active Operations', value: stats?.active_operations || 0, icon: Shield, color: 'text-yellow-500' },
    { label: 'Treasury Balance', value: `${(stats?.org_treasury_balance || 0).toLocaleString()} aUEC`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Total Vessels', value: stats?.total_ships || 0, icon: Rocket, color: 'text-sc-light-blue' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
          Command Dashboard
        </h2>
        <div className="text-xs text-sc-grey font-mono">
          System Status: <span className="text-green-500 font-bold">OPERATIONAL</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-sc-panel border border-sc-grey/10 p-6 rounded relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-sc-grey/40 uppercase tracking-[0.2em] mb-1">
                {stat.label}
              </span>
              <span className={`text-2xl font-bold ${stat.color}`}>
                {statsLoading ? '---' : stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <ActivityIcon className="w-4 h-4 text-sc-blue" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Activity Feed</h3>
          </div>
          
          <div className="bg-sc-panel border border-sc-grey/10 rounded divide-y divide-sc-grey/5">
            {activityLoading ? (
              <div className="p-8 text-center text-sc-grey/40 text-xs italic">Synchronizing neural link...</div>
            ) : activityData?.activities?.length > 0 ? (
              activityData.activities.map((activity: any) => (
                <div key={activity.id} className="p-4 flex items-start space-x-4 hover:bg-white/5 transition-colors group">
                  <div className="h-8 w-8 rounded bg-sc-dark border border-sc-blue/20 flex items-center justify-center text-sc-blue flex-shrink-0">
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">
                      <span className="font-bold text-sc-blue">{activity.user?.display_name || 'System'}</span>
                      {' '}{activity.content?.message || 'performed an action'}
                    </p>
                    <span className="text-[10px] text-sc-grey/40 font-mono">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sc-grey/20 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sc-grey/40 text-xs italic">No active signals detected.</div>
            )}
          </div>
        </div>

        {/* Quick Actions / Announcements */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-sc-blue" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Rapid Deployment</h3>
            </div>
            <div className="bg-sc-panel border border-sc-grey/10 rounded p-4 space-y-3">
              <button className="w-full py-2 px-4 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-sc-blue text-xs font-bold uppercase tracking-widest transition-all">
                Register New Vessel
              </button>
              <button className="w-full py-2 px-4 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-sc-blue text-xs font-bold uppercase tracking-widest transition-all">
                Log Trade Run
              </button>
              <button className="w-full py-2 px-4 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-xs font-bold uppercase tracking-widest transition-all">
                Request Operation Access
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-sc-blue" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Top Contributors</h3>
            </div>
            <div className="bg-sc-panel border border-sc-grey/10 rounded p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-sc-dark border border-sc-grey/20 flex items-center justify-center text-[10px] font-bold text-sc-grey">
                      {i}
                    </div>
                    <span className="text-xs text-white font-bold">Pilot_{i}00</span>
                  </div>
                  <span className="text-[10px] text-sc-blue font-mono font-bold">4.{4-i}k pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
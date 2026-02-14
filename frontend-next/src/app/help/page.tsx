'use client';

import React from 'react';
import { 
  BookOpen, 
  Rocket, 
  Radio, 
  ShieldCheck, 
  Database, 
  MessageSquare, 
  Settings, 
  Info,
  ChevronRight,
  Monitor,
  Lock,
  Mail,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HelpManualPage() {
  const sections = [
    {
      title: 'Sub-Space Social Hub',
      icon: <Radio className="w-5 h-5" />,
      content: [
        {
          sub: 'Voice & Video Comm Frequencies',
          desc: 'The Social Hub provides real-time WebRTC-based peer-to-peer communication. You can join persistent organization frequencies listed in the "Social Matrix" or establish direct links with other citizens.'
        },
        {
          sub: 'Signal Presence',
          desc: 'Active personnel on any frequency are visible via the "Citizens Active" indicator. A green pulse indicates a live, stable signal.'
        },
        {
          sub: 'Media Controls',
          desc: 'Use the prominent control bar to toggle your microphone (Audio), camera (Video), or share your tactical display (Screen Share) with the group.'
        }
      ]
    },
    {
      title: 'Fleet & Asset Management',
      icon: <Rocket className="w-5 h-5" />,
      content: [
        {
          sub: 'Fleet Registry',
          desc: 'Track every vessel in your personal hangar. Use the "HangarXPLORER Import" feature to quickly synchronize your RSI hangar with the organization database.'
        },
        {
          sub: 'Org Stockpiles',
          desc: 'Centralized tracking for shared resources, commodities, and gear. View total organization holdings and recent inventory movements.'
        }
      ]
    },
    {
      title: 'Logistics & Operations',
      icon: <ShieldCheck className="w-5 h-5" />,
      content: [
        {
          sub: 'Operation Signups',
          desc: 'View upcoming organization events and combat operations. Sign up to secure your slot in the flight wing and receive pre-op briefings.'
        },
        {
          sub: 'Trade Runs & Contracts',
          desc: 'Plan profitable cargo routes and manage escrowed trade contracts. Ensure every credit is accounted for in the Org Treasury.'
        }
      ]
    },
    {
      title: 'Communication Protocols',
      icon: <MessageSquare className="w-5 h-5" />,
      content: [
        {
          sub: 'Spectrum Forum',
          desc: 'Asynchronous discussion boards for permanent organization records, strategy planning, and general citizen chat.'
        },
        {
          sub: 'Comms Preferences',
          desc: 'Configure how you receive transmissions in your User Profile. You can opt-in to Email alerts, In-App HUD notifications, or Discord relays for announcements and private messages.'
        }
      ]
    },
    {
      title: 'Administrative Systems',
      icon: <Settings className="w-5 h-5" />,
      content: [
        {
          sub: 'Institutional Branding',
          desc: 'Admins can customize the Hub insignia, global interface colors, and inject custom neural overrides (CSS) to match the organization's identity.'
        },
        {
          sub: 'Data Integrity',
          desc: 'Generate "Cold Storage Backups" from the Admin Panel to bundle the core database and tactical assets into a secure archive for off-site storage.'
        },
        {
          sub: 'System Maintenance',
          desc: 'Execute system-wide upgrades and monitor kernel outputs (logs) directly through the administrative interface without requiring low-level console access.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="relative p-12 bg-sc-panel border border-sc-blue/20 rounded-lg overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <BookOpen className="w-48 h-48 text-sc-blue" />
        </div>
        <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-sc-blue animate-pulse" />
                <span className="text-[10px] font-black text-sc-blue uppercase tracking-[0.4em]">Manual v1.0.0-PRO</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight italic">Operations & Tactical Manual</h1>
            <p className="max-w-2xl text-xs text-sc-grey/60 uppercase tracking-widest leading-relaxed font-bold">
                Welcome to the primary intelligence core of the Star Citizen Hub. This document contains the necessary protocols for navigating organization assets, communication frequencies, and administrative modules.
            </p>
        </div>
      </div>

      {/* Manual Sections */}
      <div className="grid grid-cols-1 gap-8">
        {sections.map((section, idx) => (
            <div key={idx} className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden group">
                <div className="p-6 bg-black/20 border-b border-white/5 flex items-center space-x-4">
                    <div className="p-2 bg-sc-blue/10 border border-sc-blue/20 rounded text-sc-blue group-hover:bg-sc-blue group-hover:text-sc-dark transition-all duration-500">
                        {section.icon}
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">{section.title}</h2>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {section.content.map((item, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex items-center space-x-2 text-sc-blue/60">
                                <ChevronRight className="w-3 h-3" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-sc-blue">{item.sub}</h3>
                            </div>
                            <p className="text-[11px] text-sc-grey/60 leading-relaxed font-medium uppercase tracking-tighter">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
        <div className="p-6 bg-sc-panel border border-sc-grey/10 rounded flex items-center space-x-4">
            <Monitor className="w-5 h-5 text-sc-grey/40" />
            <span className="text-[9px] font-bold text-sc-grey/40 uppercase tracking-widest">Optimized for Aegis HUD Systems</span>
        </div>
        <div className="p-6 bg-sc-panel border border-sc-grey/10 rounded flex items-center space-x-4">
            <Lock className="w-5 h-5 text-sc-grey/40" />
            <span className="text-[9px] font-bold text-sc-grey/40 uppercase tracking-widest">End-to-End Signal Encryption Active</span>
        </div>
        <div className="p-6 bg-sc-panel border border-sc-grey/10 rounded flex items-center space-x-4">
            <Mail className="w-5 h-5 text-sc-grey/40" />
            <span className="text-[9px] font-bold text-sc-grey/40 uppercase tracking-widest">Support: core-relay@nova-corp.hub</span>
        </div>
      </div>
    </div>
  );
}

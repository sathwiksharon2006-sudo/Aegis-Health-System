import React from 'react';
import { Activity, Plus, ShieldAlert, Users, Stethoscope, BarChart3 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'patients' | 'diseases' | 'hologram';
  setActiveTab: (tab: 'overview' | 'patients' | 'diseases' | 'hologram') => void;
  onOpenNewIntake: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenNewIntake }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-left font-bold tracking-tight text-white hover:text-emerald-400 transition-colors cursor-pointer text-base sm:text-lg whitespace-nowrap shrink-0"
            >
              Aegis Health System
            </button>
          </div>

          {/* Zone 2: 4 Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>1. Visits Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'patients'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Patients Database</span>
            </button>

            <button
              onClick={() => setActiveTab('diseases')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'diseases'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>3. Diseases & Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('hologram')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'hologram'
                  ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>4. Hologram Risk Scanner</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewIntake}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Patient Intake</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'overview' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'patients' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Patients
          </button>
          <button
            onClick={() => setActiveTab('diseases')}
            className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'diseases' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Diseases & Roster
          </button>
          <button
            onClick={() => setActiveTab('hologram')}
            className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'hologram' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
          >
            Hologram Scanner
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Activity, Plus, ShieldAlert, Users, Stethoscope, BarChart3, LogIn, UserPlus, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'overview' | 'patients' | 'diseases' | 'hologram';
  setActiveTab: (tab: 'overview' | 'patients' | 'diseases' | 'hologram') => void;
  onOpenNewIntake: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenNewIntake }) => {
  const { user, userProfile, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
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

          {/* Zone 2: Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'hologram'
                  ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>4. Hologram Scanner</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Auth Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Patient Intake Button */}
            <button
              onClick={onOpenNewIntake}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Patient Intake</span>
            </button>

            {/* Auth State Control */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'M')}
                  </div>
                  <div className="hidden md:block text-left text-xs leading-tight">
                    <div className="font-semibold text-white max-w-[120px] truncate">
                      {userProfile?.displayName || user.displayName || user.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {userProfile?.role || 'Staff'} · {userProfile?.department ? userProfile.department.split(' ')[0] : 'Cardiology'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign out of hospital session"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-800/60 overflow-x-auto text-xs gap-1">
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
            Patients DB
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
            Hologram
          </button>
          <button
            onClick={onOpenNewIntake}
            className="sm:hidden px-2 py-1 rounded whitespace-nowrap bg-emerald-400 text-slate-950 font-bold"
          >
            + Intake
          </button>
        </div>
      </div>
    </header>
  );
};

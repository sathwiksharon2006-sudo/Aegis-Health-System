import React, { useState } from 'react';
import { OverviewTimeframe } from '../types/hospital';
import { VISIT_OVERVIEW_METRICS } from '../data/mockHospitalData';
import { Users, Clock, BedDouble, AlertCircle, TrendingUp, Building2, Calendar, ChevronRight } from 'lucide-react';

interface Module1OverviewProps {
  onNavigateToPatients: () => void;
  onNavigateToHologram: () => void;
}

export const Module1Overview: React.FC<Module1OverviewProps> = ({
  onNavigateToPatients,
  onNavigateToHologram,
}) => {
  const [timeframe, setTimeframe] = useState<OverviewTimeframe>('weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const currentData = VISIT_OVERVIEW_METRICS[timeframe];

  // Graph data based on selected timeframe
  const chartItems =
    timeframe === 'yearly'
      ? VISIT_OVERVIEW_METRICS.yearly.monthlyBreakdown
      : timeframe === 'weekly'
      ? VISIT_OVERVIEW_METRICS.weekly.dailyBreakdown
      : VISIT_OVERVIEW_METRICS.daily.hourlyBreakdown;

  // Maximum value for scaling the bar chart
  const maxTotal = Math.max(...chartItems.map((item) => item.total));

  return (
    <div className="space-y-8">
      {/* Module Title & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
            <span>Module 01</span>
            <span aria-hidden="true">·</span>
            <span>Hospital Operational Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hospital Visits & Admissions Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time aggregate patient intake, emergency admissions, bed occupancy, and visit volume analytics across daily, weekly, and yearly operational cycles.
          </p>
        </div>

        {/* Timeframe Switcher (Interactive Segmented Control) */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
          <button
            onClick={() => {
              setTimeframe('daily');
              setHoveredBarIndex(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              timeframe === 'daily'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Visits
          </button>
          <button
            onClick={() => {
              setTimeframe('weekly');
              setHoveredBarIndex(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              timeframe === 'weekly'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Visits
          </button>
          <button
            onClick={() => {
              setTimeframe('yearly');
              setHoveredBarIndex(null);
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              timeframe === 'yearly'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly Visits
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'Year to Date'} Visits
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{currentData.growthRate}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
              {currentData.totalVisits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">patient encounters</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Prior period:</span>
            <span className="font-mono tabular-nums text-slate-300">
              {'previousYearVisits' in currentData
                ? currentData.previousYearVisits.toLocaleString()
                : 'previousWeekVisits' in currentData
                ? currentData.previousWeekVisits.toLocaleString()
                : currentData.previousDayVisits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Emergency Triage Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Emergency & Trauma</span>
            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-rose-400 tabular-nums tracking-tight">
              {currentData.emergencyVisits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">
              ({((currentData.emergencyVisits / currentData.totalVisits) * 100).toFixed(1)}% of total)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Priority 1 / Immediate:</span>
            <span className="font-mono tabular-nums text-rose-300">
              {Math.round(currentData.emergencyVisits * 0.28).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Outpatient Consultations */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Outpatient (OPD)</span>
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tabular-nums tracking-tight">
              {currentData.outpatientVisits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">consultations</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Specialty Clinics:</span>
            <span className="font-mono tabular-nums text-cyan-300">
              {Math.round(currentData.outpatientVisits * 0.72).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Inpatients & Bed Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bed Occupancy Rate</span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums tracking-tight">
              {currentData.bedOccupancyRate}%
            </span>
            <span className="text-xs text-slate-400">operational capacity</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Inpatient Census:</span>
            <span className="font-mono tabular-nums text-amber-300">
              {currentData.inpatientAdmissions.toLocaleString()} admitted
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar Graph Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>
                {timeframe === 'yearly'
                  ? 'Yearly Visit Trajectory (Monthly Distribution)'
                  : timeframe === 'weekly'
                  ? 'Weekly Visit Rhythm (Daily Patient Influx)'
                  : 'Daily 24-Hour Patient Arrival Curve (Hourly Load)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive bar graph showing proportional breakdown of Outpatient, Emergency, and Inpatient admissions.
            </p>
          </div>

          {/* Graph Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-400"></span>
              <span>Outpatient (OPD)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
              <span>Emergency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
              <span>Inpatient</span>
            </div>
          </div>
        </div>

        {/* Bar Graph Canvas / SVG Container */}
        <div className="h-72 w-full pt-6 pb-2 flex items-end gap-2 sm:gap-4 md:gap-6 border-b border-slate-800">
          {chartItems.map((item, idx) => {
            const heightPercent = Math.round((item.total / maxTotal) * 100);
            const opdPercent = (item.outpatient / item.total) * 100;
            const emPercent = (item.emergency / item.total) * 100;
            const inPercent = (item.inpatient / item.total) * 100;
            const isHovered = hoveredBarIndex === idx;

            return (
              <div
                key={item.period}
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-[calc(100%+8px)] z-30 bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl shadow-black/60 text-xs w-48 pointer-events-none transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                      <span>{item.period}</span>
                      <span className="text-emerald-400 tabular-nums">{item.total.toLocaleString()} total</span>
                    </div>
                    <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Outpatient:</span>
                        <span className="tabular-nums">{item.outpatient.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Emergency:</span>
                        <span className="tabular-nums">{item.emergency.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-400">Inpatient:</span>
                        <span className="tabular-nums">{item.inpatient.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total label above bar */}
                <span className="text-[10px] sm:text-xs font-mono tabular-nums text-slate-400 group-hover:text-emerald-300 font-medium mb-1.5 transition-colors">
                  {item.total > 999 ? `${(item.total / 1000).toFixed(1)}k` : item.total}
                </span>

                {/* Stacked Segmented Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 ${
                    isHovered ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 scale-y-[1.02]' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 12)}%` }}
                >
                  {/* Outpatient segment */}
                  <div
                    style={{ height: `${opdPercent}%` }}
                    className="bg-cyan-500 hover:bg-cyan-400 transition-colors w-full"
                    title={`Outpatient: ${item.outpatient}`}
                  />
                  {/* Emergency segment */}
                  <div
                    style={{ height: `${emPercent}%` }}
                    className="bg-rose-500 hover:bg-rose-400 transition-colors w-full"
                    title={`Emergency: ${item.emergency}`}
                  />
                  {/* Inpatient segment */}
                  <div
                    style={{ height: `${inPercent}%` }}
                    className="bg-amber-400 hover:bg-amber-300 transition-colors w-full"
                    title={`Inpatient: ${item.inpatient}`}
                  />
                </div>

                {/* X Axis label */}
                <span className="mt-2.5 text-[10px] sm:text-xs font-semibold text-slate-400 group-hover:text-white transition-colors truncate max-w-full text-center">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Chart Metadata Note */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Avg. Triage Wait: <strong className="text-white font-mono">{currentData.avgWaitMinutes} mins</strong></span>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Data synced: <span className="font-mono text-slate-300">Live Hospital EHR Server</span></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPatients}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Admitted Patients in Database</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Department Capacity Load & Hologram Risk Quick-Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Capacity Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Hospital Department Occupancy & Bed Census</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current patient distribution across primary clinical wards.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">8 Active Wards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {VISIT_OVERVIEW_METRICS.departmentLoad.map((dept) => {
              const isHigh = dept.occupancy >= 90;
              const isModerate = dept.occupancy >= 85 && dept.occupancy < 90;

              return (
                <div
                  key={dept.name}
                  className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{dept.name}</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isHigh ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {dept.occupancy}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-rose-500' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${dept.occupancy}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Active: <strong className="text-slate-200">{dept.activePatients}</strong>
                    </span>
                    <span>
                      Capacity: <strong className="text-slate-200">{dept.capacity} beds</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hologram Risk Banner / Cross-Link Card */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <span>Holographic Scanner Alert</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Anatomical Risk Visualizer
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Real-time cybernetic anatomical scanner monitoring organs and systems at critical risk across the patient population.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span>Cardiovascular / Cor:</span>
                <span className="font-mono font-bold">Critical (92%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span>Pulmonary & Renal:</span>
                <span className="font-mono font-bold">High Risk (84%)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={onNavigateToHologram}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <span>Open Module 4: Hologram Scanner</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

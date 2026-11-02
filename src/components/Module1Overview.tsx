import React, { useMemo, useState } from 'react';
import { OverviewTimeframe, Patient } from '../types/hospital';
import { VISIT_OVERVIEW_METRICS } from '../data/mockHospitalData';
import {
  Users,
  Clock,
  BedDouble,
  AlertCircle,
  TrendingUp,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

interface Module1OverviewProps {
  onNavigateToPatients: () => void;
  onNavigateToHologram: () => void;
  overviewMetrics?: typeof VISIT_OVERVIEW_METRICS;
  patients?: Patient[];
}

interface ChartItem {
  period: string;
  total: number;
  outpatient: number;
  emergency: number;
  inpatient: number;
}

export const Module1Overview: React.FC<Module1OverviewProps> = ({
  onNavigateToPatients,
  onNavigateToHologram,
  overviewMetrics = VISIT_OVERVIEW_METRICS,
  patients = [],
}) => {
  const [timeframe, setTimeframe] = useState<OverviewTimeframe>('weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Calculate live additions from registered patients
  const extraVisitsCount = useMemo(() => {
    return patients.reduce((acc, p) => acc + (p.visits?.length || 1), 0);
  }, [patients]);

  const currentDataset = overviewMetrics[timeframe];

  const totalVisits = currentDataset.totalVisits + (timeframe === 'yearly' ? extraVisitsCount : 0);
  const emergencyVisits = currentDataset.emergencyVisits;
  const outpatientVisits = currentDataset.outpatientVisits + (timeframe === 'yearly' ? extraVisitsCount : 0);
  const inpatientVisits = currentDataset.inpatientAdmissions;
  const occupancyRate = currentDataset.bedOccupancyRate;
  const avgWait = currentDataset.avgWaitMinutes;
  const growthRate = currentDataset.growthRate;

  // Chart items based on timeframe breakdown
  const chartItems: ChartItem[] = useMemo(() => {
    if (timeframe === 'yearly') {
      return overviewMetrics.yearly.monthlyBreakdown;
    }
    if (timeframe === 'weekly') {
      return overviewMetrics.weekly.dailyBreakdown;
    }
    return overviewMetrics.daily.hourlyBreakdown;
  }, [timeframe, overviewMetrics]);

  const maxTotal = useMemo(() => {
    return Math.max(...chartItems.map((item) => item.total), 1);
  }, [chartItems]);

  const departmentLoad = overviewMetrics.departmentLoad;

  const currentLabel =
    timeframe === 'daily'
      ? 'Today'
      : timeframe === 'weekly'
      ? 'This Week'
      : 'Year to Date';

  return (
    <div className="space-y-8">
      {/* Module Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Module 01</span>
            <span aria-hidden="true">·</span>
            <span>Hospital Operational Telemetry</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hospital Visits & Admissions Overview
          </h1>

          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time longitudinal telemetry across all emergency, outpatient, and inpatient admissions.
            Data synchronized via Firestore cloud database.
          </p>
        </div>

        {/* Timeframe Buttons */}
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
            Daily (Hourly)
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
            Weekly (Daily)
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
            Yearly (Monthly)
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Visits */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total {currentLabel} Visits
            </span>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{growthRate}% YoY
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
              {totalVisits.toLocaleString()}
            </span>

            <span className="text-xs text-slate-400">
              patient visits
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Database:</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Live
            </span>
          </div>
        </div>

        {/* Card 2: Emergency & Trauma */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Emergency & Trauma
            </span>

            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-rose-400 tabular-nums tracking-tight">
              {emergencyVisits.toLocaleString()}
            </span>

            <span className="text-xs text-slate-400">
              {totalVisits > 0
                ? `(${((emergencyVisits / totalVisits) * 100).toFixed(1)}% of total)`
                : '(0%)'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Critical Triage:</span>
            <span className="text-rose-400 font-medium">Priority 1 Active</span>
          </div>
        </div>

        {/* Card 3: Outpatient (OPD) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Outpatient (OPD)
            </span>

            <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tabular-nums tracking-tight">
              {outpatientVisits.toLocaleString()}
            </span>

            <span className="text-xs text-slate-400">
              consultations
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Avg Wait Time:</span>
            <span className="font-mono tabular-nums text-cyan-300">
              {avgWait} mins
            </span>
          </div>
        </div>

        {/* Card 4: Inpatient & Bed Occupancy */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Inpatient & Ward
            </span>

            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums tracking-tight">
              {inpatientVisits.toLocaleString()}
            </span>

            <span className="text-xs text-slate-400">
              admissions
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Bed Occupancy:</span>
            <span className="font-mono tabular-nums text-amber-300">
              {occupancyRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Bar Graph */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>
                {timeframe === 'yearly'
                  ? 'Yearly Hospital Visits Breakdown (Jan - Dec)'
                  : timeframe === 'weekly'
                  ? 'Weekly Patient Flow Rhythm (Mon - Sun)'
                  : 'Daily Patient Arrival Curve (24-Hour Periods)'}
              </span>
            </h2>

            <p className="text-xs text-slate-400 mt-0.5">
              Live stratified visit telemetry comparing outpatient, emergency, and inpatient volume.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-400" />
              <span>Outpatient (OPD)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span>Emergency</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span>Inpatient</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-72 w-full pt-6 pb-2 flex items-end gap-2 sm:gap-4 md:gap-6 border-b border-slate-800">
          {chartItems.map((item, idx) => {
            const heightPercent = Math.round((item.total / maxTotal) * 100);

            const opdPercent =
              item.total > 0 ? (item.outpatient / item.total) * 100 : 0;
            const emPercent =
              item.total > 0 ? (item.emergency / item.total) * 100 : 0;
            const inPercent =
              item.total > 0 ? (item.inpatient / item.total) * 100 : 0;

            const isHovered = hoveredBarIndex === idx;

            return (
              <div
                key={item.period}
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Popover Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-[calc(100%+8px)] z-30 bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl shadow-black/60 text-xs w-48 pointer-events-none transform -translate-x-1/2 left-1/2">
                    <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                      <span>{item.period}</span>
                      <span className="text-emerald-400 tabular-nums">
                        {item.total.toLocaleString()} visits
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Outpatient:</span>
                        <span className="tabular-nums">
                          {item.outpatient.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-rose-400">Emergency:</span>
                        <span className="tabular-nums">
                          {item.emergency.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-amber-400">Inpatient:</span>
                        <span className="tabular-nums">
                          {item.inpatient.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Number Above Bar */}
                <span className="text-[10px] sm:text-xs font-mono tabular-nums text-slate-400 group-hover:text-emerald-300 font-medium mb-1.5 transition-colors">
                  {item.total > 999
                    ? `${(item.total / 1000).toFixed(1)}k`
                    : item.total}
                </span>

                {/* Stacked Bar Body */}
                <div
                  className={`w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 ${
                    isHovered
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 scale-y-[1.02]'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    height: `${Math.max(heightPercent, 12)}%`,
                  }}
                >
                  <div
                    style={{ height: `${opdPercent}%` }}
                    className="bg-cyan-500 hover:bg-cyan-400 transition-colors w-full"
                    title={`Outpatient: ${item.outpatient}`}
                  />
                  <div
                    style={{ height: `${emPercent}%` }}
                    className="bg-rose-500 hover:bg-rose-400 transition-colors w-full"
                    title={`Emergency: ${item.emergency}`}
                  />
                  <div
                    style={{ height: `${inPercent}%` }}
                    className="bg-amber-400 hover:bg-amber-300 transition-colors w-full"
                    title={`Inpatient: ${item.inpatient}`}
                  />
                </div>

                {/* Period Label (Mon, Tue, etc.) */}
                <span className="mt-2.5 text-[10px] sm:text-xs font-semibold text-slate-400 group-hover:text-white transition-colors truncate max-w-full text-center">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Meta under Chart */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Average wait time:{' '}
                <strong className="text-white font-mono">{avgWait} mins</strong>
              </span>
            </span>

            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>

            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Live Source:{' '}
                <span className="font-mono text-emerald-300">
                  Cloud Firestore Real-Time
                </span>
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPatients}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage Patients & Record Visits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Department Breakdown & Hologram Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Load Grid */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Hospital Department Visit Distribution</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active clinical load and bed allocation across specialty wards.
              </p>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {departmentLoad.length} Departments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {departmentLoad.map((dept) => {
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
                        isHigh
                          ? 'text-rose-400'
                          : isModerate
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {dept.activePatients} / {dept.capacity} ({dept.occupancy}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh
                          ? 'bg-rose-500'
                          : isModerate
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{
                        width: `${dept.occupancy}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Active:{' '}
                      <strong className="text-slate-200">
                        {dept.activePatients}
                      </strong>
                    </span>
                    <span>
                      Capacity:{' '}
                      <strong className="text-slate-200">
                        {dept.capacity}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anatomical Hologram Scanner Gateway */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Module 04 Integration</span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Anatomical Risk Hologram
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Explore the interactive whole-body holographic projection highlighting high-risk organs
              (Heart, Brain, Lungs, Liver, Kidneys) with live telemetry and linked patient dossiers.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={onNavigateToHologram}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <span>Launch Hologram HUD</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

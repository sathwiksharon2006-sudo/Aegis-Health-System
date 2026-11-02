import React, { useEffect, useMemo, useState } from 'react';
import { OverviewTimeframe } from '../types/hospital';
import {
  Users,
  Clock,
  BedDouble,
  AlertCircle,
  TrendingUp,
  Building2,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface Module1OverviewProps {
  onNavigateToPatients: () => void;
  onNavigateToHologram: () => void;
}

interface Visit {
  visit_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  department_name: string;
  visit_date: string;
  visit_type: string;
  symptoms: string;
  notes: string;
}

interface ChartItem {
  period: string;
  total: number;
  outpatient: number;
  emergency: number;
  inpatient: number;
}

interface DepartmentData {
  name: string;
  activePatients: number;
  capacity: number;
  occupancy: number;
}

export const Module1Overview: React.FC<Module1OverviewProps> = ({
  onNavigateToPatients,
  onNavigateToHologram,
}) => {
  const [timeframe, setTimeframe] = useState<OverviewTimeframe>('weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('http://127.0.0.1:5000/api/visits');

        if (!response.ok) {
          throw new Error('Failed to fetch visits');
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to load visits');
        }

        setVisits(data.visits || []);
      } catch (err) {
        console.error('Error loading visits:', err);
        setError('Unable to load live visit data from the hospital database.');
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, []);

  const totalVisits = visits.length;

  const outpatientVisits = visits.filter(
    (visit) =>
      visit.visit_type?.toLowerCase() === 'consultation' ||
      visit.visit_type?.toLowerCase() === 'follow-up'
  ).length;

  const emergencyVisits = visits.filter(
    (visit) => visit.visit_type?.toLowerCase() === 'emergency'
  ).length;

  const inpatientVisits = visits.filter(
    (visit) => visit.visit_type?.toLowerCase() === 'inpatient'
  ).length;

  const chartItems = useMemo<ChartItem[]>(() => {
    if (timeframe === 'yearly') {
      const monthlyData: Record<string, ChartItem> = {};

      visits.forEach((visit) => {
        const date = new Date(visit.visit_date);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const month = date.toLocaleString('en-US', {
          month: 'short',
        });

        if (!monthlyData[month]) {
          monthlyData[month] = {
            period: month,
            total: 0,
            outpatient: 0,
            emergency: 0,
            inpatient: 0,
          };
        }

        monthlyData[month].total += 1;

        const type = visit.visit_type?.toLowerCase();

        if (type === 'emergency') {
          monthlyData[month].emergency += 1;
        } else if (type === 'inpatient') {
          monthlyData[month].inpatient += 1;
        } else {
          monthlyData[month].outpatient += 1;
        }
      });

      return Object.values(monthlyData).sort((a, b) => {
        const dateA = new Date(`2026 ${a.period} 1`).getTime();
        const dateB = new Date(`2026 ${b.period} 1`).getTime();
        return dateA - dateB;
      });
    }

    if (timeframe === 'weekly') {
      const weeklyData: Record<string, ChartItem> = {};

      visits.forEach((visit) => {
        const date = new Date(visit.visit_date);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const day = date.toLocaleString('en-US', {
          weekday: 'short',
        });

        if (!weeklyData[day]) {
          weeklyData[day] = {
            period: day,
            total: 0,
            outpatient: 0,
            emergency: 0,
            inpatient: 0,
          };
        }

        weeklyData[day].total += 1;

        const type = visit.visit_type?.toLowerCase();

        if (type === 'emergency') {
          weeklyData[day].emergency += 1;
        } else if (type === 'inpatient') {
          weeklyData[day].inpatient += 1;
        } else {
          weeklyData[day].outpatient += 1;
        }
      });

      return Object.values(weeklyData);
    }

    const hourlyData: Record<string, ChartItem> = {};

    visits.forEach((visit) => {
      const date = new Date(visit.visit_date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const hour = `${date.getHours().toString().padStart(2, '0')}:00`;

      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          period: hour,
          total: 0,
          outpatient: 0,
          emergency: 0,
          inpatient: 0,
        };
      }

      hourlyData[hour].total += 1;

      const type = visit.visit_type?.toLowerCase();

      if (type === 'emergency') {
        hourlyData[hour].emergency += 1;
      } else if (type === 'inpatient') {
        hourlyData[hour].inpatient += 1;
      } else {
        hourlyData[hour].outpatient += 1;
      }
    });

    return Object.values(hourlyData).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [visits, timeframe]);

  const maxTotal = Math.max(
    ...chartItems.map((item) => item.total),
    1
  );

  const departmentLoad = useMemo<DepartmentData[]>(() => {
    const departments: Record<string, number> = {};

    visits.forEach((visit) => {
      const department = visit.department_name || 'Unknown';

      departments[department] = (departments[department] || 0) + 1;
    });

    return Object.entries(departments).map(([name, activePatients]) => ({
      name,
      activePatients,
      capacity: Math.max(activePatients, 1),
      occupancy: 100,
    }));
  }, [visits]);

  const currentLabel =
    timeframe === 'daily'
      ? 'Today'
      : timeframe === 'weekly'
      ? 'This Week'
      : 'Year to Date';

  return (
    <div className="space-y-8">
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
            Live visit information retrieved from the Aegis Health MySQL
            database through the Flask backend.
          </p>
        </div>

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

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-400">
          Loading live visit data from MySQL...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total {currentLabel} Visits
            </span>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Live
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight">
              {totalVisits.toLocaleString()}
            </span>

            <span className="text-xs text-slate-400">
              database encounters
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Source:</span>

            <span className="font-mono tabular-nums text-slate-300">
              MySQL
            </span>
          </div>
        </div>

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
                : '(0% of total)'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>
              Based on actual visit types stored in MySQL.
            </span>
          </div>
        </div>

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
              consultations / follow-ups
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Database records:</span>

            <span className="font-mono tabular-nums text-cyan-300">
              {outpatientVisits}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Inpatient Records
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
              database records
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            Bed occupancy requires a separate bed/admission table.
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />

              <span>
                {timeframe === 'yearly'
                  ? 'Yearly Visit Trajectory'
                  : timeframe === 'weekly'
                  ? 'Weekly Visit Rhythm'
                  : 'Daily Patient Arrival Curve'}
              </span>
            </h2>

            <p className="text-xs text-slate-400 mt-0.5">
              Visit distribution calculated from the records returned by the
              MySQL database.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-400"></span>
              <span>Outpatient</span>
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

        {chartItems.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm text-slate-500">
            No visit records available for this view.
          </div>
        ) : (
          <div className="h-72 w-full pt-6 pb-2 flex items-end gap-2 sm:gap-4 md:gap-6 border-b border-slate-800">
            {chartItems.map((item, idx) => {
              const heightPercent = Math.round(
                (item.total / maxTotal) * 100
              );

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
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+8px)] z-30 bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl shadow-black/60 text-xs w-48 pointer-events-none transform -translate-x-1/2 left-1/2">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                        <span>{item.period}</span>

                        <span className="text-emerald-400 tabular-nums">
                          {item.total.toLocaleString()} total
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-cyan-400">
                            Outpatient:
                          </span>

                          <span className="tabular-nums">
                            {item.outpatient.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-rose-400">
                            Emergency:
                          </span>

                          <span className="tabular-nums">
                            {item.emergency.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-amber-400">
                            Inpatient:
                          </span>

                          <span className="tabular-nums">
                            {item.inpatient.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] sm:text-xs font-mono tabular-nums text-slate-400 group-hover:text-emerald-300 font-medium mb-1.5 transition-colors">
                    {item.total > 999
                      ? `${(item.total / 1000).toFixed(1)}k`
                      : item.total}
                  </span>

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
                    />

                    <div
                      style={{ height: `${emPercent}%` }}
                      className="bg-rose-500 hover:bg-rose-400 transition-colors w-full"
                    />

                    <div
                      style={{ height: `${inPercent}%` }}
                      className="bg-amber-400 hover:bg-amber-300 transition-colors w-full"
                    />
                  </div>

                  <span className="mt-2.5 text-[10px] sm:text-xs font-semibold text-slate-400 group-hover:text-white transition-colors truncate max-w-full text-center">
                    {item.period}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />

              <span>
                Average wait time:{' '}
                <strong className="text-white font-mono">
                  Not available
                </strong>
              </span>
            </span>

            <span
              aria-hidden="true"
              className="text-slate-700"
            >
              ·
            </span>

            <span>
              Data source:{' '}
              <span className="font-mono text-slate-300">
                MySQL via Flask
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPatients}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Patients in Database</span>

              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />

                <span>
                  Hospital Department Visit Distribution
                </span>
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Current distribution of database visit records by department.
              </p>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {departmentLoad.length} Departments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {departmentLoad.map((dept) => {
              const isHigh = dept.occupancy >= 90;
              const isModerate =
                dept.occupancy >= 85 && dept.occupancy < 90;

              return (
                <div
                  key={dept.name}
                  className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">
                      {dept.name}
                    </span>

                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isHigh
                          ? 'text-rose-400'
                          : isModerate
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {dept.activePatients} visits
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
                        width: `${Math.min(
                          dept.activePatients * 10,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Visits:{' '}
                      <strong className="text-slate-200">
                        {dept.activePatients}
                      </strong>
                    </span>

                    <span>
                      Data:{' '}
                      <strong className="text-slate-200">
                        MySQL
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
              Open the anatomical scanner to review the existing patient risk
              visualization module.
            </p>
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

import React, { useState, useMemo } from 'react';
import { DiseaseReport, Doctor } from '../types/hospital';
import { DISEASE_REPORTS, DOCTORS_ROSTER } from '../data/mockHospitalData';
import {
  Stethoscope,
  Activity,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  UserCheck,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Search,
  BedDouble
} from 'lucide-react';

interface Module3DiseaseReportsProps {
  onAssignDoctorToIntake: (doctorName: string, department: string) => void;
}

export const Module3DiseaseReports: React.FC<Module3DiseaseReportsProps> = ({
  onAssignDoctorToIntake,
}) => {
  // Disease Timeframe state
  const [diseaseTimeframe, setDiseaseTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [diseaseSearch, setDiseaseSearch] = useState('');

  // Doctor roster filters
  const [doctorDeptFilter, setDoctorDeptFilter] = useState<string>('all');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<string>('all');
  const [doctorSearch, setDoctorSearch] = useState('');

  // Selected disease detail modal
  const [selectedDisease, setSelectedDisease] = useState<DiseaseReport | null>(null);

  // Filtered diseases
  const filteredDiseases = useMemo(() => {
    return DISEASE_REPORTS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
        item.icd10.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(diseaseSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, diseaseSearch]);

  // Aggregate totals for the active timeframe
  const totalCasesInPeriod = useMemo(() => {
    return filteredDiseases.reduce((acc, curr) => {
      const count =
        diseaseTimeframe === 'daily'
          ? curr.dailyCount
          : diseaseTimeframe === 'weekly'
          ? curr.weeklyCount
          : diseaseTimeframe === 'monthly'
          ? curr.monthlyCount
          : curr.yearlyCount;
      return acc + count;
    }, 0);
  }, [filteredDiseases, diseaseTimeframe]);

  const maxDiseaseCount = useMemo(() => {
    return Math.max(
      ...filteredDiseases.map((d) =>
        diseaseTimeframe === 'daily'
          ? d.dailyCount
          : diseaseTimeframe === 'weekly'
          ? d.weeklyCount
          : diseaseTimeframe === 'monthly'
          ? d.monthlyCount
          : d.yearlyCount
      ),
      1
    );
  }, [filteredDiseases, diseaseTimeframe]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return DOCTORS_ROSTER.filter((doc) => {
      const matchesDept = doctorDeptFilter === 'all' || doc.department === doctorDeptFilter;
      const matchesStatus = doctorStatusFilter === 'all' || doc.status === doctorStatusFilter;
      const matchesSearch =
        doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        doc.roomNumber.toLowerCase().includes(doctorSearch.toLowerCase());
      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [doctorDeptFilter, doctorStatusFilter, doctorSearch]);

  // Doctor status breakdown
  const availableDocsCount = DOCTORS_ROSTER.filter((d) => d.status === 'Available').length;
  const inConsultCount = DOCTORS_ROSTER.filter((d) => d.status === 'In Consultation').length;
  const inSurgeryCount = DOCTORS_ROSTER.filter((d) => d.status === 'In Surgery').length;

  return (
    <div className="space-y-10">
      {/* Module Title Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
          <span>Module 03</span>
          <span aria-hidden="true">·</span>
          <span>Epidemiological Reports & Clinical Staffing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Disease Incidence Analytics & Doctor Availability
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Multi-cadence disease surveillance reports (yearly, monthly, weekly, daily) paired with live hospital doctor rosters, consultation queues, and specialty ward availability.
        </p>
      </div>

      {/* SECTION 1: DISEASE REPORTS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Disease Surveillance & Case Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review disease incidence across Daily, Weekly, Monthly, and Yearly operational periods.
            </p>
          </div>

          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setDiseaseTimeframe('daily')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                diseaseTimeframe === 'daily'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Reports
            </button>
            <button
              onClick={() => setDiseaseTimeframe('weekly')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                diseaseTimeframe === 'weekly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Reports
            </button>
            <button
              onClick={() => setDiseaseTimeframe('monthly')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                diseaseTimeframe === 'monthly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Reports
            </button>
            <button
              onClick={() => setDiseaseTimeframe('yearly')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                diseaseTimeframe === 'yearly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly Reports
            </button>
          </div>
        </div>

        {/* Disease Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400">Total {diseaseTimeframe.toUpperCase()} Cases</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {totalCasesInPeriod.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">diagnosed</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400">Active Hospital Admissions</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400 tabular-nums">
                {filteredDiseases.reduce((a, b) => a + b.activeCases, 0)}
              </span>
              <span className="text-xs text-slate-400">under treatment</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400">Bed Occupancy by Condition</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-400 tabular-nums">
                {filteredDiseases.reduce((a, b) => a + b.bedOccupancy, 0)}
              </span>
              <span className="text-xs text-slate-400">beds dedicated</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400">Average Clinical Recovery Rate</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 tabular-nums">
                {(
                  filteredDiseases.reduce((a, b) => a + b.recoveryRate, 0) / (filteredDiseases.length || 1)
                ).toFixed(1)}
                %
              </span>
              <span className="text-xs text-slate-400">overall</span>
            </div>
          </div>
        </div>

        {/* Disease Category Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search diseases by name, ICD-10 code, or condition..."
              value={diseaseSearch}
              onChange={(e) => setDiseaseSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Disease Categories</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Infectious & Viral">Infectious & Viral</option>
              <option value="Endocrine & Metabolic">Endocrine & Metabolic</option>
              <option value="Orthopedic">Orthopedic</option>
              <option value="Neurological">Neurological</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </select>
          </div>
        </div>

        {/* Disease Visual Incidence Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>
              Comparative Disease Incidence ({diseaseTimeframe.toUpperCase()} Cadence)
            </span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              Showing {filteredDiseases.length} condition categories
            </span>
          </h3>

          <div className="space-y-3">
            {filteredDiseases.map((disease) => {
              const currentCount =
                diseaseTimeframe === 'daily'
                  ? disease.dailyCount
                  : diseaseTimeframe === 'weekly'
                  ? disease.weeklyCount
                  : diseaseTimeframe === 'monthly'
                  ? disease.monthlyCount
                  : disease.yearlyCount;

              const percent = Math.round((currentCount / maxDiseaseCount) * 100);

              return (
                <div
                  key={disease.id}
                  onClick={() => setSelectedDisease(disease)}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 hover:bg-slate-800/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {disease.name}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {disease.icd10}
                      </span>
                      <span className="text-[11px] text-slate-400">· {disease.category}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {currentCount.toLocaleString()} {diseaseTimeframe} cases
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Recovery: <strong className="text-white">{disease.recoveryRate}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        disease.severity === 'Critical'
                          ? 'bg-rose-500'
                          : disease.severity === 'Severe'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Disease Registry Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Disease / ICD-10</th>
                  <th className="py-3 px-4">Category & Severity</th>
                  <th className="py-3 px-4 text-right">Daily</th>
                  <th className="py-3 px-4 text-right">Weekly</th>
                  <th className="py-3 px-4 text-right">Monthly</th>
                  <th className="py-3 px-4 text-right">Yearly</th>
                  <th className="py-3 px-4 text-right">Active / Beds</th>
                  <th className="py-3 px-4 text-right">Recovery Rate</th>
                  <th className="py-3 px-4">Lead Ward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                {filteredDiseases.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDisease(d)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {d.name}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400">{d.icd10}</div>
                    </td>

                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <div className="text-slate-300">{d.category}</div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                          d.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : d.severity === 'Severe'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {d.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-200">
                      {d.dailyCount}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-200 font-bold">
                      {d.weeklyCount}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {d.monthlyCount}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-cyan-300 font-semibold">
                      {d.yearlyCount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-amber-300">
                      {d.activeCases} ({d.bedOccupancy} beds)
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400 font-bold">
                      {d.recoveryRate}%
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap">
                      {d.primaryDepartment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: DOCTOR AVAILABILITY IN THE HOSPITAL */}
      <div className="pt-8 border-t border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Doctor Availability & Shift Roster</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status, consultation room assignments, current queue lengths, and direct consult booking.
            </p>
          </div>

          {/* Quick Roster Status Indicators */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{availableDocsCount} Available</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>{inConsultCount} In Consult</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{inSurgeryCount} In Surgery</span>
            </span>
          </div>
        </div>

        {/* Doctor Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor by name, specialty, room number..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={doctorDeptFilter}
              onChange={(e) => setDoctorDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="Neurology">Neurology</option>
              <option value="Nephrology">Nephrology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Oncology">Oncology</option>
            </select>

            <select
              value={doctorStatusFilter}
              onChange={(e) => setDoctorStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available Now</option>
              <option value="In Consultation">In Consultation</option>
              <option value="In Surgery">In Surgery</option>
              <option value="On Break">On Break</option>
              <option value="Off Duty">Off Duty</option>
            </select>
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const isAvailable = doc.status === 'Available';
            const isInSurgery = doc.status === 'In Surgery';
            const isInConsult = doc.status === 'In Consultation';

            return (
              <div
                key={doc.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{doc.name}</h3>
                      <p className="text-xs text-emerald-400 font-medium">{doc.title}</p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isInSurgery
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isInConsult
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4">{doc.specialty}</p>

                  <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>Room / Wing:</span>
                      </span>
                      <strong className="text-slate-200">{doc.roomNumber}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Shift Hours:</span>
                      </span>
                      <span className="text-slate-300 font-mono">{doc.shiftHours}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Current Waiting Queue:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-300 tabular-nums">
                        {doc.currentQueue} patients (~{doc.avgWaitMins}m wait)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Internal Contact:</span>
                      <span className="font-mono text-slate-300">{doc.contactExtension}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Dept: <span className="text-slate-300">{doc.department}</span>
                  </div>

                  <button
                    onClick={() => onAssignDoctorToIntake(doc.name, doc.department)}
                    disabled={doc.status === 'Off Duty'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      doc.status === 'Off Duty'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 cursor-pointer'
                    }`}
                  >
                    <span>Assign Patient</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disease Detail Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {selectedDisease.icd10}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{selectedDisease.name}</h3>
                <p className="text-xs text-slate-400">{selectedDisease.category} · Severity: {selectedDisease.severity}</p>
              </div>
              <button
                onClick={() => setSelectedDisease(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Multi-Cadence Frequency Breakdown
                </h4>
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950 rounded-xl text-center font-mono">
                  <div className="border-r border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Daily</span>
                    <span className="text-white font-bold text-sm">{selectedDisease.dailyCount}</span>
                  </div>
                  <div className="border-r border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Weekly</span>
                    <span className="text-white font-bold text-sm">{selectedDisease.weeklyCount}</span>
                  </div>
                  <div className="border-r border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Monthly</span>
                    <span className="text-white font-bold text-sm">{selectedDisease.monthlyCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Yearly</span>
                    <span className="text-cyan-400 font-bold text-sm">{selectedDisease.yearlyCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5">Primary Symptoms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDisease.primarySymptoms.map((symp) => (
                    <span key={symp} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs">
                      {symp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recovery Rate:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedDisease.recoveryRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dedicated Bed Occupancy:</span>
                  <span className="font-bold text-amber-300 font-mono">{selectedDisease.bedOccupancy} beds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Ward:</span>
                  <span className="font-bold text-white">{selectedDisease.primaryDepartment}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDisease(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

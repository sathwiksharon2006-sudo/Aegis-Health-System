
import React, { useEffect, useMemo, useState } from 'react';
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
  TrendingUp,
  Search,
  Users,
  Database,
  X,
} from 'lucide-react';

interface DiseaseReport {
  patient_id: number;
  patient_name: string;
  disease_id: number;
  disease_name: string;
  description: string | null;
  diagnosed_date: string | null;
  status: string | null;
}

interface DoctorRecord {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  department_name: string;
}

interface Module3DiseaseReportsProps {
  onAssignDoctorToIntake: (doctorName: string, department: string) => void;
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DiseaseSummary {
  diseaseId: number;
  name: string;
  description: string;
  totalCases: number;
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  yearlyCount: number;
  activeCases: number;
  monitoringCases: number;
  recoveringCases: number;
  patients: DiseaseReport[];
}

export const Module3DiseaseReports: React.FC<Module3DiseaseReportsProps> = ({
  onAssignDoctorToIntake,
}) => {
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);

  const [loadingDiseases, setLoadingDiseases] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [diseaseError, setDiseaseError] = useState('');
  const [doctorError, setDoctorError] = useState('');

  const [diseaseTimeframe, setDiseaseTimeframe] =
    useState<Timeframe>('weekly');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [diseaseSearch, setDiseaseSearch] = useState('');

  const [doctorDeptFilter, setDoctorDeptFilter] = useState('all');
  const [doctorSearch, setDoctorSearch] = useState('');

  const [selectedDisease, setSelectedDisease] =
    useState<DiseaseSummary | null>(null);

  useEffect(() => {
    const loadDiseaseReports = async () => {
      try {
        setLoadingDiseases(true);
        setDiseaseError('');

        const response = await fetch(
          'http://127.0.0.1:5000/api/disease-reports'
        );

        if (!response.ok) {
          throw new Error('Failed to load disease reports');
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to load disease reports');
        }

        setDiseaseReports(data.reports || []);
      } catch (error) {
        console.error('Disease reports error:', error);
        setDiseaseError(
          error instanceof Error
            ? error.message
            : 'Unable to load disease reports'
        );
      } finally {
        setLoadingDiseases(false);
      }
    };

    loadDiseaseReports();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setDoctorError('');

        const response = await fetch(
          'http://127.0.0.1:5000/api/doctors'
        );

        if (!response.ok) {
          throw new Error('Failed to load doctors');
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to load doctors');
        }

        setDoctors(data.doctors || []);
      } catch (error) {
        console.error('Doctors error:', error);
        setDoctorError(
          error instanceof Error
            ? error.message
            : 'Unable to load doctors'
        );
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  const getDateFromString = (value: string | null) => {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const isWithinDays = (
    value: string | null,
    days: number
  ) => {
    const date = getDateFromString(value);

    if (!date) return false;

    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    return (
      difference >= 0 &&
      difference <= days * 24 * 60 * 60 * 1000
    );
  };

  const isWithinCurrentMonth = (value: string | null) => {
    const date = getDateFromString(value);

    if (!date) return false;

    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  };

  const isWithinCurrentYear = (value: string | null) => {
    const date = getDateFromString(value);

    if (!date) return false;

    const now = new Date();

    return date.getFullYear() === now.getFullYear();
  };

  const diseaseSummaries = useMemo<DiseaseSummary[]>(() => {
    const grouped = new Map<number, DiseaseReport[]>();

    diseaseReports.forEach((report) => {
      const existing = grouped.get(report.disease_id) || [];
      existing.push(report);
      grouped.set(report.disease_id, existing);
    });

    return Array.from(grouped.entries()).map(
      ([diseaseId, reports]) => {
        const dailyCount = reports.filter((report) =>
          isWithinDays(report.diagnosed_date, 1)
        ).length;

        const weeklyCount = reports.filter((report) =>
          isWithinDays(report.diagnosed_date, 7)
        ).length;

        const monthlyCount = reports.filter((report) =>
          isWithinCurrentMonth(report.diagnosed_date)
        ).length;

        const yearlyCount = reports.filter((report) =>
          isWithinCurrentYear(report.diagnosed_date)
        ).length;

        const activeCases = reports.filter(
          (report) =>
            report.status?.toLowerCase() === 'active'
        ).length;

        const monitoringCases = reports.filter(
          (report) =>
            report.status?.toLowerCase() ===
            'under monitoring'
        ).length;

        const recoveringCases = reports.filter(
          (report) =>
            report.status?.toLowerCase() ===
            'recovering'
        ).length;

        return {
          diseaseId,
          name: reports[0].disease_name,
          description: reports[0].description || 'No description available',
          totalCases: reports.length,
          dailyCount,
          weeklyCount,
          monthlyCount,
          yearlyCount,
          activeCases,
          monitoringCases,
          recoveringCases,
          patients: reports,
        };
      }
    );
  }, [diseaseReports]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        diseaseSummaries.map((disease) => {
          const name = disease.name.toLowerCase();

          if (
            name.includes('heart') ||
            name.includes('hypertension')
          ) {
            return 'Cardiovascular';
          }

          if (
            name.includes('asthma') ||
            name.includes('pneumonia')
          ) {
            return 'Respiratory';
          }

          if (
            name.includes('diabetes') ||
            name.includes('obesity')
          ) {
            return 'Metabolic';
          }

          if (
            name.includes('migraine')
          ) {
            return 'Neurological';
          }

          if (
            name.includes('arthritis')
          ) {
            return 'Musculoskeletal';
          }

          if (
            name.includes('kidney')
          ) {
            return 'Renal';
          }

          if (
            name.includes('anemia')
          ) {
            return 'Blood';
          }

          return 'Other';
        })
      ),
    ];
  }, [diseaseSummaries]);

  const getCategory = (diseaseName: string) => {
    const name = diseaseName.toLowerCase();

    if (
      name.includes('heart') ||
      name.includes('hypertension')
    ) {
      return 'Cardiovascular';
    }

    if (
      name.includes('asthma') ||
      name.includes('pneumonia')
    ) {
      return 'Respiratory';
    }

    if (
      name.includes('diabetes') ||
      name.includes('obesity')
    ) {
      return 'Metabolic';
    }

    if (name.includes('migraine')) {
      return 'Neurological';
    }

    if (name.includes('arthritis')) {
      return 'Musculoskeletal';
    }

    if (name.includes('kidney')) {
      return 'Renal';
    }

    if (name.includes('anemia')) {
      return 'Blood';
    }

    return 'Other';
  };

  const filteredDiseases = useMemo(() => {
    const search = diseaseSearch.toLowerCase();

    return diseaseSummaries.filter((disease) => {
      const category = getCategory(disease.name);

      const matchesCategory =
        selectedCategory === 'all' ||
        category === selectedCategory;

      const matchesSearch =
        disease.name.toLowerCase().includes(search) ||
        disease.description.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [
    diseaseSummaries,
    selectedCategory,
    diseaseSearch,
  ]);

  const getTimeframeCount = (
    disease: DiseaseSummary
  ) => {
    if (diseaseTimeframe === 'daily') {
      return disease.dailyCount;
    }

    if (diseaseTimeframe === 'weekly') {
      return disease.weeklyCount;
    }

    if (diseaseTimeframe === 'monthly') {
      return disease.monthlyCount;
    }

    return disease.yearlyCount;
  };

  const totalCasesInPeriod = useMemo(() => {
    return filteredDiseases.reduce(
      (total, disease) =>
        total + getTimeframeCount(disease),
      0
    );
  }, [filteredDiseases, diseaseTimeframe]);

  const totalActiveCases = useMemo(() => {
    return filteredDiseases.reduce(
      (total, disease) =>
        total + disease.activeCases,
      0
    );
  }, [filteredDiseases]);

  const totalMonitoringCases = useMemo(() => {
    return filteredDiseases.reduce(
      (total, disease) =>
        total + disease.monitoringCases,
      0
    );
  }, [filteredDiseases]);

  const totalRecoveringCases = useMemo(() => {
    return filteredDiseases.reduce(
      (total, disease) =>
        total + disease.recoveringCases,
      0
    );
  }, [filteredDiseases]);

  const maxDiseaseCount = useMemo(() => {
    return Math.max(
      ...filteredDiseases.map(
        (disease) => getTimeframeCount(disease)
      ),
      1
    );
  }, [filteredDiseases, diseaseTimeframe]);

  const departmentList = useMemo(() => {
    return [
      ...new Set(
        doctors.map(
          (doctor) => doctor.department_name
        )
      ),
    ].sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const search = doctorSearch.toLowerCase();

    return doctors.filter((doctor) => {
      const matchesDepartment =
        doctorDeptFilter === 'all' ||
        doctor.department_name ===
          doctorDeptFilter;

      const matchesSearch =
        doctor.doctor_name
          .toLowerCase()
          .includes(search) ||
        doctor.specialization
          .toLowerCase()
          .includes(search) ||
        doctor.department_name
          .toLowerCase()
          .includes(search);

      return (
        matchesDepartment &&
        matchesSearch
      );
    });
  }, [
    doctors,
    doctorDeptFilter,
    doctorSearch,
  ]);

  const statusCounts = useMemo(() => {
    const active = diseaseReports.filter(
      (report) =>
        report.status?.toLowerCase() === 'active'
    ).length;

    const monitoring = diseaseReports.filter(
      (report) =>
        report.status?.toLowerCase() ===
        'under monitoring'
    ).length;

    const recovering = diseaseReports.filter(
      (report) =>
        report.status?.toLowerCase() ===
        'recovering'
    ).length;

    return {
      active,
      monitoring,
      recovering,
    };
  }, [diseaseReports]);

  return (
    <div className="space-y-8 pb-10">
      {/* SECTION 1 */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />

              <h2 className="text-xl font-bold text-white">
                Disease Reports & Registry
              </h2>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Disease records and patient associations
              retrieved from the hospital database.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <Database className="w-3.5 h-3.5" />
              MySQL via Flask
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              {diseaseReports.length} records
            </span>
          </div>
        </div>

        {diseaseError && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{diseaseError}</span>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total Records
              </span>

              <Users className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="text-2xl font-bold text-white mt-2">
              {diseaseReports.length}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Patient-disease associations
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Active
              </span>

              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="text-2xl font-bold text-emerald-300 mt-2">
              {statusCounts.active}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Status from database
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Monitoring
              </span>

              <Clock className="w-4 h-4 text-amber-400" />
            </div>

            <div className="text-2xl font-bold text-amber-300 mt-2">
              {statusCounts.monitoring}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Under monitoring
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Recovering
              </span>

              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="text-2xl font-bold text-cyan-300 mt-2">
              {statusCounts.recovering}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Recovering status
            </div>
          </div>
        </div>

        {/* TIMEFRAME */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">
                Diagnosed Cases by Timeframe
              </div>

              <div className="text-[11px] text-slate-500 mt-1">
                Calculated from diagnosed_date stored
                in MySQL.
              </div>
            </div>

            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(
                [
                  'daily',
                  'weekly',
                  'monthly',
                  'yearly',
                ] as Timeframe[]
              ).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() =>
                    setDiseaseTimeframe(timeframe)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                    diseaseTimeframe === timeframe
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                {totalCasesInPeriod}
              </div>

              <div className="text-xs text-slate-500">
                Records in selected period
              </div>
            </div>

            <Calendar className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search disease or description..."
              value={diseaseSearch}
              onChange={(e) =>
                setDiseaseSearch(e.target.value)
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />

            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* INCIDENCE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">
                Disease Incidence
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Based on real diagnosis records.
              </p>
            </div>

            <span className="text-[11px] text-slate-500">
              {filteredDiseases.length} diseases
            </span>
          </div>

          {loadingDiseases ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading disease records...
            </div>
          ) : filteredDiseases.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No disease records match your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDiseases.map((disease) => {
                const count =
                  getTimeframeCount(disease);

                const percent =
                  maxDiseaseCount > 0
                    ? (count / maxDiseaseCount) * 100
                    : 0;

                return (
                  <div key={disease.diseaseId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {disease.name}
                        </span>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                          {getCategory(disease.name)}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-emerald-300">
                        {count}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* REGISTRY TABLE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">
              Detailed Disease Registry
            </h3>

            <p className="text-[11px] text-slate-500 mt-1">
              Values below are derived only from fields
              available in the MySQL schema.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">
                    Disease
                  </th>

                  <th className="py-3 px-4">
                    Category
                  </th>

                  <th className="py-3 px-4 text-right">
                    Daily
                  </th>

                  <th className="py-3 px-4 text-right">
                    Weekly
                  </th>

                  <th className="py-3 px-4 text-right">
                    Monthly
                  </th>

                  <th className="py-3 px-4 text-right">
                    Yearly
                  </th>

                  <th className="py-3 px-4 text-right">
                    Total
                  </th>

                  <th className="py-3 px-4 text-right">
                    Active
                  </th>

                  <th className="py-3 px-4">
                    Data Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                {filteredDiseases.map((disease) => (
                  <tr
                    key={disease.diseaseId}
                    onClick={() =>
                      setSelectedDisease(disease)
                    }
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {disease.name}
                      </div>

                      <div className="text-[11px] text-slate-500 max-w-xs">
                        {disease.description}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-300">
                      {getCategory(disease.name)}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-200">
                      {disease.dailyCount}
                    </td>

                    <td className="py-3 px-4 text-right text-emerald-300 font-bold">
                      {disease.weeklyCount}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-300">
                      {disease.monthlyCount}
                    </td>

                    <td className="py-3 px-4 text-right text-cyan-300 font-semibold">
                      {disease.yearlyCount}
                    </td>

                    <td className="py-3 px-4 text-right text-white font-bold">
                      {disease.totalCases}
                    </td>

                    <td className="py-3 px-4 text-right text-emerald-300">
                      {disease.activeCases}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] text-slate-500">
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DATA LIMITATIONS */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />

            <div>
              <h4 className="text-sm font-semibold text-amber-300">
                Database Coverage
              </h4>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The current database contains disease
                names, descriptions, diagnosis dates,
                patient associations, and status values.
                ICD-10 codes, clinical severity, recovery
                percentages, and bed occupancy are not
                currently stored, so this dashboard does
                not fabricate those values.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="pt-8 border-t border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />

              <span>
                Hospital Doctors & Departments
              </span>
            </h2>

            <p className="text-xs text-slate-400 mt-0.5">
              Doctor identities and department assignments
              retrieved from MySQL.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              <UserCheck className="w-3.5 h-3.5" />

              <span>
                {doctors.length} Doctors
              </span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
              {departmentList.length} Departments
            </span>
          </div>
        </div>

        {doctorError && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />

            <span>{doctorError}</span>
          </div>
        )}

        {/* DOCTOR FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search doctor, specialty, or department..."
              value={doctorSearch}
              onChange={(e) =>
                setDoctorSearch(e.target.value)
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={doctorDeptFilter}
            onChange={(e) =>
              setDoctorDeptFilter(e.target.value)
            }
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">
              All Departments
            </option>

            {departmentList.map((department) => (
              <option
                key={department}
                value={department}
              >
                {department}
              </option>
            ))}
          </select>
        </div>

        {/* DOCTOR CARDS */}
        {loadingDoctors ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-500">
            Loading doctors...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-500">
            No doctors match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.doctor_id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {doctor.doctor_name}
                      </h3>

                      <p className="text-xs text-emerald-400 font-medium">
                        Doctor
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      Database
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4">
                    {doctor.specialization}
                  </p>

                  <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        Department
                      </span>

                      <span className="text-slate-200 text-right">
                        {doctor.department_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        Doctor ID
                      </span>

                      <span className="text-slate-300 font-mono">
                        {doctor.doctor_id}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onAssignDoctorToIntake(
                      doctor.doctor_name,
                      doctor.department_name
                    )
                  }
                  className="mt-4 w-full px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs font-semibold"
                >
                  Assign Doctor
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />

            <div>
              <h4 className="text-sm font-semibold text-cyan-300">
                Doctor Availability
              </h4>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The current doctors table stores doctor
                identity, specialization, and department.
                It does not contain live availability,
                consultation status, room assignment, shift,
                or queue length. Those values are therefore
                not displayed as if they were real-time data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DISEASE DETAIL MODAL */}
      {selectedDisease && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedDisease(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedDisease.name}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {selectedDisease.description}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedDisease(null)
                }
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">
                    Total
                  </div>

                  <div className="text-xl font-bold text-white mt-1">
                    {selectedDisease.totalCases}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">
                    Active
                  </div>

                  <div className="text-xl font-bold text-emerald-300 mt-1">
                    {selectedDisease.activeCases}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">
                    Monitoring
                  </div>

                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {selectedDisease.monitoringCases}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">
                    Recovering
                  </div>

                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {selectedDisease.recoveringCases}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">
                  Patients with this condition
                </h4>

                <div className="space-y-2">
                  {selectedDisease.patients.map(
                    (patient) => (
                      <div
                        key={`${patient.patient_id}-${patient.disease_id}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-200">
                            {patient.patient_name}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Patient ID: {patient.patient_id}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500">
                            Diagnosed:{' '}
                            {patient.diagnosed_date ||
                              'Not recorded'}
                          </span>

                          <span className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                            {patient.status ||
                              'Not recorded'}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

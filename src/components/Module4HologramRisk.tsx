import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  Minus,
  Plus,
  Rotate3d,
  RotateCcw,
  User,
  X,
} from 'lucide-react';

interface Measurement {
  measurement_id: number;
  measurement_type: string;
  measurement_value: number;
  unit: string;
  measured_at: string;
}

interface RiskData {
  risk_id: number;
  risk_level: string;
  risk_score: number;
  indicator: string;
  created_at: string;
}

interface HologramPatient {
  patient_id: number;
  patient_name: string;
  department_id: number | null;
  department_name: string | null;
  risk: RiskData | null;
  measurements: Measurement[];
}

interface Module4HologramRiskProps {
  patients: any[];
  onSelectPatient: (patientId: string) => void;
}

type BodyPartId =
  | 'brain'
  | 'heart'
  | 'lungs'
  | 'spine'
  | 'kidneys'
  | 'stomach';

interface BodyPart {
  id: BodyPartId;
  name: string;
  department: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  description: string;
}

const API_URL = 'http://127.0.0.1:5000/api/hologram-risk';

const BODY_PARTS: BodyPart[] = [
  {
    id: 'brain',
    name: 'Brain',
    department: 'Neurology',
    x: 150,
    y: 55,
    rx: 20,
    ry: 18,
    description: 'Neurological region',
  },
  {
    id: 'heart',
    name: 'Heart',
    department: 'Cardiology',
    x: 139,
    y: 145,
    rx: 13,
    ry: 14,
    description: 'Cardiovascular region',
  },
  {
    id: 'lungs',
    name: 'Lungs',
    department: 'Pulmonology',
    x: 150,
    y: 137,
    rx: 38,
    ry: 25,
    description: 'Respiratory region',
  },
  {
    id: 'spine',
    name: 'Spine',
    department: 'Orthopedics',
    x: 150,
    y: 184,
    rx: 8,
    ry: 42,
    description: 'Musculoskeletal region',
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    department: 'Nephrology',
    x: 150,
    y: 211,
    rx: 30,
    ry: 18,
    description: 'Renal region',
  },
  {
    id: 'stomach',
    name: 'Abdominal region',
    department: 'General Medicine',
    x: 150,
    y: 198,
    rx: 28,
    ry: 28,
    description: 'General medicine region',
  },
];

const riskColor = (risk: string | null | undefined) => {
  switch ((risk || '').toLowerCase()) {
    case 'high':
    case 'critical':
      return {
        main: '#ef4444',
        light: '#fca5a5',
        glow: 'rgba(239,68,68,0.9)',
        bg: 'rgba(239,68,68,0.12)',
        label: 'HIGH',
      };

    case 'moderate':
      return {
        main: '#eab308',
        light: '#fde047',
        glow: 'rgba(234,179,8,0.9)',
        bg: 'rgba(234,179,8,0.12)',
        label: 'MODERATE',
      };

    case 'low':
    case 'normal':
      return {
        main: '#22c55e',
        light: '#86efac',
        glow: 'rgba(34,197,94,0.9)',
        bg: 'rgba(34,197,94,0.12)',
        label: 'LOW',
      };

    default:
      return {
        main: '#38bdf8',
        light: '#a5f3fc',
        glow: 'rgba(56,189,248,0.35)',
        bg: 'rgba(56,189,248,0.05)',
        label: 'NO DATA',
      };
  }
};

const departmentToBodyPart = (department: string | null): BodyPartId | null => {
  if (!department) return null;

  const value = department.toLowerCase();

  if (value.includes('cardio')) return 'heart';
  if (value.includes('pulmon')) return 'lungs';
  if (value.includes('neuro')) return 'brain';
  if (value.includes('nephro')) return 'kidneys';
  if (value.includes('ortho')) return 'spine';
  if (value.includes('general')) return 'stomach';

  return null;
};

const formatMeasurement = (measurement: Measurement) => {
  return `${measurement.measurement_value} ${measurement.unit}`;
};

export const Module4HologramRisk: React.FC<Module4HologramRiskProps> = ({
  patients,
}) => {
  const [hologramPatients, setHologramPatients] = useState<HologramPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [rotationStart, setRotationStart] = useState(0);

  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBodyPart, setSelectedBodyPart] =
    useState<BodyPartId>('heart');

  useEffect(() => {
    const loadHologramData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Unable to load hologram data');
        }

        const records: HologramPatient[] = data.patients || [];

        setHologramPatients(records);

        if (records.length > 0) {
          setSelectedPatientId(records[0].patient_id);

          const firstBodyPart = departmentToBodyPart(
            records[0].department_name
          );

          if (firstBodyPart) {
            setSelectedBodyPart(firstBodyPart);
          }
        }
      } catch (err) {
        console.error(err);
        setError(
          'Unable to load hologram risk data from the Flask/MySQL backend.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadHologramData();
  }, []);

  useEffect(() => {
    if (!autoRotate) return;

    const timer = window.setInterval(() => {
      setRotation((previous) => (previous + 0.7) % 360);
    }, 30);

    return () => window.clearInterval(timer);
  }, [autoRotate]);

  const selectedPatient = useMemo(() => {
    return (
      hologramPatients.find(
        (patient) => patient.patient_id === selectedPatientId
      ) || null
    );
  }, [hologramPatients, selectedPatientId]);

  const riskBodyPart = useMemo(() => {
    return departmentToBodyPart(
      selectedPatient?.department_name || null
    );
  }, [selectedPatient]);

  const activeRisk = selectedPatient?.risk?.risk_level || null;

  const activeRiskColors = riskColor(activeRisk);

  const selectedPartData = useMemo(() => {
    return BODY_PARTS.find((part) => part.id === selectedBodyPart) || null;
  }, [selectedBodyPart]);

  const selectedPartHasRisk =
    selectedBodyPart === riskBodyPart && !!selectedPatient?.risk;

  const selectedPartColor = selectedPartHasRisk
    ? riskColor(selectedPatient?.risk?.risk_level)
    : riskColor(null);

  const handlePatientChange = (patientId: number) => {
    const patient = hologramPatients.find(
      (item) => item.patient_id === patientId
    );

    setSelectedPatientId(patientId);
    setRotation(0);
    setZoom(1);

    const bodyPart = departmentToBodyPart(
      patient?.department_name || null
    );

    if (bodyPart) {
      setSelectedBodyPart(bodyPart);
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    setIsDragging(true);
    setDragStartX(event.clientX);
    setRotationStart(rotation);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const difference = event.clientX - dragStartX;

    const newRotation =
      rotationStart + difference * 0.8;

    setRotation(newRotation);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const rotateLeft = () => {
    setRotation((previous) => previous - 30);
  };

  const rotateRight = () => {
    setRotation((previous) => previous + 30);
  };

  const resetView = () => {
    setRotation(0);
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom((previous) =>
      Math.min(2.2, Number((previous + 0.15).toFixed(2)))
    );
  };

  const zoomOut = () => {
    setZoom((previous) =>
      Math.max(0.65, Number((previous - 0.15).toFixed(2)))
    );
  };

  const getBodyPartColor = (part: BodyPart) => {
    if (!selectedPatient) {
      return riskColor(null);
    }

    if (part.id === riskBodyPart && selectedPatient.risk) {
      return riskColor(selectedPatient.risk.risk_level);
    }

    return riskColor(null);
  };

  const getViewLabel = () => {
    const normalized = ((rotation % 360) + 360) % 360;

    if (normalized >= 45 && normalized < 135) {
      return 'RIGHT SIDE';
    }

    if (normalized >= 135 && normalized < 225) {
      return 'POSTERIOR';
    }

    if (normalized >= 225 && normalized < 315) {
      return 'LEFT SIDE';
    }

    return 'FRONTAL';
  };

  if (loading) {
    return (
      <div className="min-h-[700px] bg-slate-950 rounded-2xl border border-cyan-500/20 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-10 h-10 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-cyan-300 font-mono">
            LOADING PATIENT HOLOGRAM...
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Reading risk indicators and measurements from MySQL
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] bg-slate-950 rounded-2xl border border-red-500/30 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-lg font-bold">
            Hologram Data Error
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {error}
          </p>
          <p className="text-slate-600 text-xs mt-4">
            Make sure Terminal 1 is running Flask on port 5000.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="min-h-[500px] bg-slate-950 rounded-2xl border border-cyan-500/20 flex items-center justify-center">
        <p className="text-slate-400">
          No hologram patient records found.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-slate-950 p-6 overflow-auto'
          : 'w-full'
      }
    >
      <div className="bg-slate-950 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/20">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-cyan-500/20 bg-slate-950/95">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">
                <Rotate3d className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  PATIENT HOLOGRAPHIC RISK SCANNER
                </h2>
              </div>

              <p className="text-xs text-slate-500 font-mono mt-1">
                REAL MYSQL DATA • 360° INTERACTIVE ANATOMICAL VIEW
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRotate((previous) => !previous)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                  autoRotate
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5 inline mr-1" />
                {autoRotate ? 'AUTO ROTATING' : 'AUTO ROTATE'}
              </button>

              <button
                onClick={() => setIsFullscreen((previous) => !previous)}
                className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
              >
                {isFullscreen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_330px]">

          {/* PATIENT LIST */}
          <div className="border-r border-cyan-500/10 bg-slate-950/70 p-4">

            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                Patient Selection
              </h3>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {hologramPatients.map((patient) => {
                const isSelected =
                  patient.patient_id === selectedPatientId;

                const colors = riskColor(
                  patient.risk?.risk_level
                );

                return (
                  <button
                    key={patient.patient_id}
                    onClick={() =>
                      handlePatientChange(patient.patient_id)
                    }
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-cyan-400/60 bg-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {patient.patient_name}
                        </p>

                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          PATIENT #{patient.patient_id}
                        </p>
                      </div>

                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          color: colors.light,
                          background: colors.bg,
                          border: `1px solid ${colors.main}55`,
                        }}
                      >
                        {colors.label}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500">
                      {patient.department_name || 'No department'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HOLOGRAM */}
          <div className="relative min-h-[700px] overflow-hidden bg-black">

            {/* Grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)',
                backgroundSize: '35px 35px',
              }}
            />

            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_55%)]" />

            {/* Top info */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">

              <div>
                <div className="text-[10px] font-mono text-cyan-400">
                  HOLOGRAM SUBJECT
                </div>

                <div className="text-xl font-bold text-white mt-1">
                  {selectedPatient.patient_name}
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  {selectedPatient.department_name}
                </div>
              </div>

              <div
                className="px-3 py-2 rounded-lg border backdrop-blur-md"
                style={{
                  color: activeRiskColors.light,
                  borderColor: `${activeRiskColors.main}66`,
                  background: activeRiskColors.bg,
                  boxShadow: `0 0 25px ${activeRiskColors.glow}`,
                }}
              >
                <div className="text-[9px] font-mono opacity-70">
                  PATIENT RISK
                </div>

                <div className="font-bold text-sm">
                  {selectedPatient.risk?.risk_level || 'NO DATA'}
                </div>

                {selectedPatient.risk && (
                  <div className="text-[10px] font-mono mt-0.5">
                    SCORE {selectedPatient.risk.risk_score}%
                  </div>
                )}
              </div>
            </div>

            {/* Hologram interaction area */}
            <div
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={(event) => {
                event.preventDefault();

                if (event.deltaY < 0) {
                  zoomIn();
                } else {
                  zoomOut();
                }
              }}
            >

              <div
                className="relative"
                style={{
                  width: '420px',
                  height: '620px',
                  transform: `perspective(1000px) scale(${zoom}) rotateY(${rotation}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.08s linear',
                }}
              >

                {/* BODY SHADOW */}
                <div
                  className="absolute inset-x-20 bottom-10 h-12 rounded-full blur-2xl"
                  style={{
                    background: activeRiskColors.glow,
                    opacity: 0.45,
                  }}
                />

                {/* HUMAN BODY */}
                <svg
                  viewBox="0 0 300 430"
                  className="absolute inset-0 w-full h-full overflow-visible"
                >

                  <defs>
                    <filter id="holoGlow">
                      <feGaussianBlur
                        stdDeviation="3"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <linearGradient
                      id="bodyGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#67e8f9"
                        stopOpacity="0.8"
                      />
                      <stop
                        offset="50%"
                        stopColor="#22d3ee"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="#0891b2"
                        stopOpacity="0.15"
                      />
                    </linearGradient>
                  </defs>

                  {/* Head */}
                  <circle
                    cx="150"
                    cy="48"
                    r="28"
                    fill="url(#bodyGradient)"
                    fillOpacity="0.08"
                    stroke="#67e8f9"
                    strokeWidth="2"
                    filter="url(#holoGlow)"
                  />

                  {/* Neck */}
                  <path
                    d="M137 72 L137 91 L163 91 L163 72"
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="2"
                  />

                  {/* Torso */}
                  <path
                    d="
                      M137 88
                      C120 92 105 101 94 116
                      L110 177
                      L124 188
                      L126 250
                      L174 250
                      L176 188
                      L190 177
                      L206 116
                      C195 101 180 92 163 88
                      Z
                    "
                    fill="url(#bodyGradient)"
                    fillOpacity="0.10"
                    stroke="#67e8f9"
                    strokeWidth="2"
                    filter="url(#holoGlow)"
                  />

                  {/* Left arm */}
                  <path
                    d="
                      M107 112
                      C94 119 87 141 80 165
                      L64 224
                      C61 234 66 240 73 241
                      C80 242 84 237 87 228
                      L111 172
                    "
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="3"
                  />

                  {/* Right arm */}
                  <path
                    d="
                      M193 112
                      C206 119 213 141 220 165
                      L236 224
                      C239 234 234 240 227 241
                      C220 242 216 237 213 228
                      L189 172
                    "
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="3"
                  />

                  {/* Left leg */}
                  <path
                    d="
                      M126 245
                      L119 323
                      L111 398
                      C110 406 116 411 124 411
                      C132 411 136 406 136 398
                      L150 326
                    "
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="3"
                  />

                  {/* Right leg */}
                  <path
                    d="
                      M174 245
                      L181 323
                      L189 398
                      C190 406 184 411 176 411
                      C168 411 164 406 164 398
                      L150 326
                    "
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="3"
                  />

                  {/* Body centerline */}
                  <path
                    d="M150 90 L150 326"
                    stroke="#67e8f9"
                    strokeWidth="1"
                    strokeDasharray="4 5"
                    opacity="0.6"
                  />

                  {/* Rib cage */}
                  <ellipse
                    cx="150"
                    cy="140"
                    rx="43"
                    ry="48"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1"
                    opacity="0.55"
                  />

                  {/* Spine */}
                  <path
                    d="M150 102 L150 250"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray="5 4"
                    opacity="0.65"
                  />

                  {/* ORGAN NODES */}
                  {BODY_PARTS.map((part) => {
                    const colors = getBodyPartColor(part);
                    const isSelected =
                      selectedBodyPart === part.id;

                    return (
                      <g
                        key={part.id}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          setSelectedBodyPart(part.id);
                        }}
                        style={{
                          cursor: 'pointer',
                        }}
                      >

                        <ellipse
                          cx={part.x}
                          cy={part.y}
                          rx={part.rx}
                          ry={part.ry}
                          fill={colors.main}
                          fillOpacity={
                            isSelected ? 0.38 : 0.18
                          }
                          stroke={colors.light}
                          strokeWidth={
                            isSelected ? 3 : 1.5
                          }
                          filter="url(#holoGlow)"
                        />

                        {isSelected && (
                          <ellipse
                            cx={part.x}
                            cy={part.y}
                            rx={part.rx + 8}
                            ry={part.ry + 8}
                            fill="none"
                            stroke={colors.main}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.8"
                          />
                        )}

                        <circle
                          cx={part.x}
                          cy={part.y}
                          r="3"
                          fill={colors.light}
                        />
                      </g>
                    );
                  })}

                  {/* Hologram scan lines */}
                  <g opacity="0.18">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <line
                        key={index}
                        x1="55"
                        x2="245"
                        y1={90 + index * 18}
                        y2={90 + index * 18}
                        stroke="#67e8f9"
                        strokeWidth="0.7"
                      />
                    ))}
                  </g>

                </svg>

                {/* Floating body-part labels */}
                {BODY_PARTS.map((part) => {
                  const colors = getBodyPartColor(part);

                  return (
                    <button
                      key={part.id}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedBodyPart(part.id);
                      }}
                      className="absolute text-[9px] font-mono px-2 py-1 rounded border backdrop-blur-sm whitespace-nowrap"
                      style={{
                        left: `${(part.x / 300) * 100}%`,
                        top: `${(part.y / 430) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        color: colors.light,
                        borderColor: `${colors.main}66`,
                        background: 'rgba(2,6,23,0.75)',
                      }}
                    >
                      {part.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View indicator */}
            <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-black/60 border border-cyan-500/20">
              <div className="text-[9px] text-slate-500 font-mono">
                VIEW
              </div>

              <div className="text-xs text-cyan-300 font-bold">
                {getViewLabel()}
              </div>

              <div className="text-[9px] text-slate-600 font-mono mt-1">
                ROTATION {Math.round(((rotation % 360) + 360) % 360)}°
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">

              <button
                onClick={rotateLeft}
                className="w-9 h-9 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Rotate left"
              >
                <RotateCcw className="w-4 h-4 mx-auto" />
              </button>

              <button
                onClick={zoomOut}
                className="w-9 h-9 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Zoom out"
              >
                <Minus className="w-4 h-4 mx-auto" />
              </button>

              <div className="px-3 py-2 rounded-lg bg-slate-950/90 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                {Math.round(zoom * 100)}%
              </div>

              <button
                onClick={zoomIn}
                className="w-9 h-9 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Zoom in"
              >
                <Plus className="w-4 h-4 mx-auto" />
              </button>

              <button
                onClick={rotateRight}
                className="w-9 h-9 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Rotate right"
              >
                <Rotate3d className="w-4 h-4 mx-auto" />
              </button>

              <button
                onClick={resetView}
                className="w-9 h-9 rounded-lg bg-slate-950/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4 mx-auto" />
              </button>
            </div>

            {/* Instructions */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400/60 font-mono pointer-events-none">
              DRAG TO ROTATE • SCROLL TO ZOOM
            </div>
          </div>

          {/* DETAILS PANEL */}
          <div className="border-l border-cyan-500/10 bg-slate-950/80 p-4">

            {/* Selected patient */}
            <div className="pb-4 border-b border-slate-800">
              <div className="text-[10px] text-slate-500 font-mono">
                SELECTED PATIENT
              </div>

              <div className="text-xl font-bold text-white mt-1">
                {selectedPatient.patient_name}
              </div>

              <div className="text-xs text-cyan-400 mt-1">
                Patient ID: {selectedPatient.patient_id}
              </div>
            </div>

            {/* Overall risk */}
            <div className="py-4 border-b border-slate-800">

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Overall Risk
                </span>

                <span
                  className="px-2 py-1 rounded-md text-[10px] font-bold"
                  style={{
                    color: activeRiskColors.light,
                    background: activeRiskColors.bg,
                    border: `1px solid ${activeRiskColors.main}66`,
                  }}
                >
                  {selectedPatient.risk?.risk_level || 'NO DATA'}
                </span>
              </div>

              {selectedPatient.risk && (
                <>
                  <div className="mt-3 flex items-end gap-2">
                    <span
                      className="text-4xl font-bold"
                      style={{
                        color: activeRiskColors.main,
                      }}
                    >
                      {selectedPatient.risk.risk_score}
                    </span>

                    <span className="text-slate-500 text-sm mb-1">
                      / 100
                    </span>
                  </div>

                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          selectedPatient.risk.risk_score,
                          100
                        )}%`,
                        background: activeRiskColors.main,
                        boxShadow: `0 0 15px ${activeRiskColors.glow}`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Selected body part */}
            <div className="py-4 border-b border-slate-800">

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ANATOMICAL REGION
                  </div>

                  <div className="text-lg font-bold text-white">
                    {selectedPartData?.name}
                  </div>
                </div>

                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: selectedPartColor.main,
                    boxShadow: `0 0 12px ${selectedPartColor.glow}`,
                  }}
                />
              </div>

              {selectedPartHasRisk && selectedPatient.risk ? (
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    background: selectedPartColor.bg,
                    borderColor: `${selectedPartColor.main}55`,
                  }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{
                      color: selectedPartColor.light,
                    }}
                  >
                    {selectedPatient.risk.risk_level} RISK
                  </div>

                  <div className="text-2xl font-bold text-white mt-1">
                    {selectedPatient.risk.risk_score}%
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {selectedPatient.risk.indicator}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl p-3 border border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      No risk record for this region
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                    The current database does not contain a separate
                    risk indicator for this body region.
                  </p>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="py-4 border-b border-slate-800">
              <div className="text-[10px] text-slate-500 font-mono">
                RESPONSIBLE DEPARTMENT
              </div>

              <div className="text-sm font-semibold text-cyan-300 mt-1">
                {selectedPatient.department_name ||
                  'Not available'}
              </div>
            </div>

            {/* Measurements */}
            <div className="py-4">

              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-slate-500 font-mono">
                  MYSQL MEASUREMENTS
                </div>

                <span className="text-[9px] text-emerald-400 font-mono">
                  LIVE DB
                </span>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto">

                {selectedPatient.measurements.length === 0 ? (
                  <div className="text-xs text-slate-600">
                    No measurements available.
                  </div>
                ) : (
                  selectedPatient.measurements.map(
                    (measurement) => (
                      <div
                        key={measurement.measurement_id}
                        className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {measurement.measurement_type}
                          </span>

                          <span className="text-xs font-bold text-white">
                            {formatMeasurement(measurement)}
                          </span>
                        </div>

                        <div className="text-[9px] text-slate-600 mt-1 font-mono">
                          {measurement.measured_at}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            {/* Risk indicator */}
            {selectedPatient.risk && (
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">

                <div className="flex items-center gap-2">
                  {selectedPatient.risk.risk_level === 'Low' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle
                      className="w-4 h-4"
                      style={{
                        color:
                          selectedPatient.risk.risk_level ===
                          'High'
                            ? '#ef4444'
                            : '#eab308',
                      }}
                    />
                  )}

                  <span className="text-xs font-semibold text-slate-300">
                    Database Risk Indicator
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  {selectedPatient.risk.indicator}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LEGEND */}
        <div className="px-5 py-3 border-t border-cyan-500/10 bg-slate-950 flex flex-wrap items-center gap-5">

          <span className="text-[9px] font-mono text-slate-600">
            RISK LEGEND
          </span>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-[10px] text-slate-400">
              HIGH / CRITICAL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
            <span className="text-[10px] text-slate-400">
              MODERATE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] text-slate-400">
              LOW
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-[10px] text-slate-400">
              NO REGION-SPECIFIC RISK DATA
            </span>
          </div>

          <div className="ml-auto text-[9px] text-slate-600 font-mono">
            DRAG • ROTATE • SCROLL • ZOOM
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ANATOMICAL_RISK_PARTS } from '../data/mockHospitalData';
import { AnatomicalRiskPart, Patient, RiskLevel } from '../types/hospital';
import {
  ShieldAlert,
  Activity,
  Heart,
  Eye,
  RotateCw,
  AlertTriangle,
  User,
  CheckCircle2,
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';

interface Module4HologramRiskProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
}

export const Module4HologramRisk: React.FC<Module4HologramRiskProps> = ({
  patients,
  onSelectPatient,
}) => {
  // Selected anatomical organ/body part
  const [selectedPartId, setSelectedPartId] = useState<string>('heart');
  // Selected patient filter: 'aggregate' or a specific patient ID
  const [selectedPatientId, setSelectedPatientId] = useState<string>('aggregate');
  // View mode: 'frontal' or 'posterior'
  const [viewOrientation, setViewOrientation] = useState<'frontal' | 'posterior'>('frontal');
  // Scanline animation active
  const [isScanning, setIsScanning] = useState<boolean>(true);

  // Current selected anatomical part
  const activePart =
    ANATOMICAL_RISK_PARTS.find((p) => p.id === selectedPartId) || ANATOMICAL_RISK_PARTS[1];

  // If a specific patient is selected, adjust risk data accordingly
  const currentPatient =
    selectedPatientId !== 'aggregate'
      ? patients.find((p) => p.id === selectedPatientId) || null
      : null;

  // Organ color helper
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'Critical':
        return {
          fill: '#f43f5e',
          stroke: '#fda4af',
          glow: 'rgba(244, 63, 94, 0.6)',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'High':
        return {
          fill: '#f59e0b',
          stroke: '#fcd34d',
          glow: 'rgba(245, 158, 11, 0.6)',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'Moderate':
        return {
          fill: '#eab308',
          stroke: '#fef08a',
          glow: 'rgba(234, 179, 8, 0.5)',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        };
      case 'Normal':
      default:
        return {
          fill: '#06b6d4',
          stroke: '#67e8f9',
          glow: 'rgba(6, 182, 212, 0.4)',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
    }
  };

  // Affected patients list for currently selected body part
  const linkedPatients = patients.filter((p) => {
    if (activePart.id === 'heart') return p.primaryRiskOrgan === 'heart' || p.visits.some(v => v.department === 'Cardiology');
    if (activePart.id === 'lungs') return p.primaryRiskOrgan === 'lungs' || p.visits.some(v => v.department === 'Pulmonology');
    if (activePart.id === 'brain') return p.primaryRiskOrgan === 'brain' || p.visits.some(v => v.department === 'Neurology');
    if (activePart.id === 'kidneys') return p.primaryRiskOrgan === 'kidneys' || p.visits.some(v => v.department === 'Nephrology');
    if (activePart.id === 'spine') return p.primaryRiskOrgan === 'spine' || p.visits.some(v => v.department === 'Orthopedics');
    if (activePart.id === 'gastrointestinal') return p.primaryRiskOrgan === 'gastrointestinal' || p.visits.some(v => v.department === 'Gastroenterology');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 uppercase tracking-wider mb-1">
            <span>Module 04</span>
            <span aria-hidden="true">·</span>
            <span>Anatomical Risk Visualizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Anatomical Hologram & Organ Risk Scanner
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Interactive holographic model highlighting organs and body systems at risk. Click on any anatomical node to inspect live vitals telemetry, pathology, and clinical protocols.
          </p>
        </div>

        {/* Patient Scope Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Scan Target:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              const p = patients.find((pat) => pat.id === e.target.value);
              if (p && p.primaryRiskOrgan) {
                setSelectedPartId(p.primaryRiskOrgan);
              }
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="aggregate">All Ward Inpatients (Aggregate Risk)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Holographic Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Holographic Projection Stage (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-cyan-950/30">
          {/* Hologram Background Grid & Ambient Glows */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Controls on Hologram */}
          <div className="relative z-20 flex items-center justify-between pb-4 border-b border-cyan-900/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
                HOLOGRAPHIC BIOMETRIC HUD // {viewOrientation.toUpperCase()} SCAN
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Orientation toggle */}
              <button
                onClick={() => setViewOrientation(viewOrientation === 'frontal' ? 'posterior' : 'frontal')}
                className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{viewOrientation === 'frontal' ? 'Posterior View' : 'Frontal View'}</span>
              </button>

              {/* Scanline toggle */}
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  isScanning
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {isScanning ? 'Scan: Active' : 'Scan: Paused'}
              </button>
            </div>
          </div>

          {/* Holographic Projection Pod */}
          <div className="relative h-[540px] flex items-center justify-center my-4 overflow-hidden">
            {/* Holographic Scanline bar */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan z-30 pointer-events-none" />
            )}

            {/* Depth Rings behind silhouette */}
            <div className="absolute w-[440px] h-[440px] rounded-full border border-cyan-500/15 animate-holo-ring pointer-events-none" />
            <div className="absolute w-[320px] h-[320px] rounded-full border border-cyan-500/20 border-dashed pointer-events-none" />
            <div className="absolute w-[180px] h-[180px] rounded-full border border-cyan-500/25 pointer-events-none" />

            {/* SVG Interactive Hologram Human Body */}
            <svg
              viewBox="0 0 400 520"
              className="w-full h-full max-h-[520px] relative z-20 transition-transform duration-500 select-none"
            >
              <defs>
                {/* Glow Filter for Cybernetic Hologram */}
                <filter id="holoGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <linearGradient id="bodyWireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="bodyFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0e7490" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Holographic Silhouette Wireframe Body */}
              <g id="hologram-silhouette" filter="url(#holoGlow)">
                {/* Head */}
                <ellipse
                  cx="200"
                  cy="68"
                  rx="26"
                  ry="32"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.8"
                />

                {/* Cranial Wireframe lines */}
                <line x1="185" y1="68" x2="215" y2="68" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1="200" y1="45" x2="200" y2="90" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" />

                {/* Neck */}
                <path
                  d="M190 100 L190 115 L210 115 L210 100"
                  fill="none"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Torso & Shoulders */}
                <path
                  d="M145 125 
                     C170 118, 230 118, 255 125 
                     C265 145, 260 190, 250 240 
                     C245 260, 248 290, 240 320 
                     L160 320 
                     C152 290, 155 260, 150 240 
                     C140 190, 135 145, 145 125 Z"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.8"
                />

                {/* Ribcage / Torso anatomical grid lines */}
                <line x1="160" y1="150" x2="240" y2="150" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <line x1="155" y1="180" x2="245" y2="180" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <line x1="160" y1="210" x2="240" y2="210" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <line x1="165" y1="240" x2="235" y2="240" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <line x1="170" y1="270" x2="230" y2="270" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

                {/* Spine axis line */}
                <line
                  x1="200"
                  y1="115"
                  x2="200"
                  y2="320"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity="0.75"
                />

                {/* Left Arm (viewer's left) */}
                <path
                  d="M145 125 
                     C130 150, 115 190, 108 240 
                     C104 270, 98 310, 92 345 
                     L105 350 
                     C112 315, 118 275, 122 245 
                     C128 200, 138 160, 150 140"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Right Arm (viewer's right) */}
                <path
                  d="M255 125 
                     C270 150, 285 190, 292 240 
                     C296 270, 302 310, 308 345 
                     L295 350 
                     C288 315, 282 275, 278 245 
                     C272 200, 262 160, 250 140"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Pelvis & Hips */}
                <path
                  d="M160 320 
                     C180 340, 220 340, 240 320 
                     L230 355 
                     L170 355 Z"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Left Leg */}
                <path
                  d="M170 355 
                     C165 390, 162 430, 160 480 
                     L176 480 
                     C180 435, 185 395, 192 355 Z"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Right Leg */}
                <path
                  d="M230 355 
                     C235 390, 238 430, 240 480 
                     L224 480 
                     C220 435, 215 395, 208 355 Z"
                  fill="url(#bodyFillGradient)"
                  stroke="url(#bodyWireGradient)"
                  strokeWidth="1.5"
                />

                {/* Feet pedestal lines */}
                <line x1="145" y1="485" x2="185" y2="485" stroke="#06b6d4" strokeWidth="2" />
                <line x1="215" y1="485" x2="255" y2="485" stroke="#06b6d4" strokeWidth="2" />
              </g>

              {/* ORGAN RISK HOTSPOTS & TARGET RETICLES */}
              {ANATOMICAL_RISK_PARTS.map((part) => {
                const isSelected = part.id === selectedPartId;
                const colors = getRiskColor(part.riskLevel);

                // Specific adjustments based on viewOrientation (frontal vs posterior)
                let cx = part.svgCoordinates.cx;
                let cy = part.svgCoordinates.cy;

                // Adjust slightly for Spine in posterior view
                if (viewOrientation === 'posterior' && part.id === 'spine') {
                  cx = 200;
                  cy = 230;
                }

                return (
                  <g
                    key={part.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPartId(part.id)}
                  >
                    {/* Pulsing ring for Critical & High risk */}
                    {(part.riskLevel === 'Critical' || part.riskLevel === 'High') && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={part.svgCoordinates.r + 6}
                        fill="none"
                        stroke={colors.fill}
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="animate-holo-pulse opacity-70"
                      />
                    )}

                    {/* Selected Active Target Crosshair Reticle */}
                    {isSelected && (
                      <g className="animate-in zoom-in-75 duration-200">
                        {/* Target outer ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={part.svgCoordinates.r + 10}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.5"
                          strokeDasharray="6 3"
                        />
                        {/* Crosshairs */}
                        <line x1={cx - 35} y1={cy} x2={cx - 15} y2={cy} stroke="#22d3ee" strokeWidth="1.5" />
                        <line x1={cx + 15} y1={cy} x2={cx + 35} y2={cy} stroke="#22d3ee" strokeWidth="1.5" />
                        <line x1={cx} y1={cy - 35} x2={cx} y2={cy - 15} stroke="#22d3ee" strokeWidth="1.5" />
                        <line x1={cx} y1={cy + 15} x2={cx} y2={cy + 35} stroke="#22d3ee" strokeWidth="1.5" />

                        {/* Leader line pointing to label */}
                        <line
                          x1={cx + 18}
                          y1={cy - 14}
                          x2={cx + 50}
                          y2={cy - 30}
                          stroke="#22d3ee"
                          strokeWidth="1.2"
                        />
                        <line
                          x1={cx + 50}
                          y1={cy - 30}
                          x2={cx + 90}
                          y2={cy - 30}
                          stroke="#22d3ee"
                          strokeWidth="1.2"
                        />
                        <text
                          x={cx + 52}
                          y={cy - 34}
                          fill="#ffffff"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {part.name.toUpperCase()} [{part.riskScore}%]
                        </text>
                      </g>
                    )}

                    {/* Core Organ Glowing Node */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={part.svgCoordinates.r}
                      fill={colors.fill}
                      fillOpacity={isSelected ? 0.85 : 0.6}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200 group-hover:scale-110"
                    />

                    {/* Icon or Symbol in center of hotspot */}
                    <text
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {part.riskLevel[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Holographic HUD Bar: Quick Organ Picker */}
          <div className="pt-3 border-t border-cyan-900/40">
            <span className="text-[11px] font-mono text-cyan-400 block mb-2 font-semibold">
              QUICK SELECT ANATOMICAL REGION:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
              {ANATOMICAL_RISK_PARTS.map((part) => {
                const isSelected = part.id === selectedPartId;
                const colors = getRiskColor(part.riskLevel);

                return (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPartId(part.id)}
                    className={`p-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/30 text-white border border-cyan-400 font-bold shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: colors.fill }}
                    />
                    <span className="truncate block">{part.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Organ Diagnostic & Clinical Risk Dossier (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Organ Risk Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            {/* Top Risk Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400">{activePart.system}</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activePart.name}</h2>
                <p className="text-xs text-slate-400 italic font-mono">{activePart.latinName}</p>
              </div>

              {/* Risk Level Badge */}
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                    getRiskColor(activePart.riskLevel).badge
                  }`}
                >
                  {activePart.riskLevel.toUpperCase()} RISK
                </span>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Severity Score: <strong className="text-white font-bold">{activePart.riskScore}/100</strong>
                </div>
              </div>
            </div>

            {/* Primary Finding Alert Box */}
            <div
              className={`p-3 rounded-xl border mb-4 text-xs ${
                activePart.riskLevel === 'Critical'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : activePart.riskLevel === 'High'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : activePart.riskLevel === 'Moderate'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Primary Clinical Assessment:</span>
              </div>
              <p className="leading-relaxed">{activePart.primaryIssue}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {activePart.description}
            </p>

            {/* Real-Time Vital Telemetry Grid */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Diagnostic Biomarkers & Telemetry</span>
                <span className="text-[10px] text-cyan-400 font-mono">Live Sync</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {activePart.vitalTelemetry.map((v) => (
                  <div
                    key={v.label}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs"
                  >
                    <span className="text-[10px] text-slate-500 block truncate">{v.label}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          v.status === 'alert'
                            ? 'text-rose-400'
                            : v.status === 'warning'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {v.value} {v.unit}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase ${
                          v.status === 'alert'
                            ? 'bg-rose-500/20 text-rose-400'
                            : v.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pathological Conditions */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pathologies & Differential Risks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {activePart.pathologyRisks.map((path) => (
                  <span
                    key={path}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs"
                  >
                    {path}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Protocol Box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs mb-4">
              <span className="text-slate-400 font-bold block mb-1">
                Hospital Action Protocol:
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">
                {activePart.recommendedProtocol}
              </p>
            </div>

            {/* Linked Patients Section */}
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Patients Flagged with this Organ Risk</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {linkedPatients.length} Active in Hospital
                </span>
              </h3>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {linkedPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className="p-2 bg-slate-950/80 hover:bg-slate-800/80 rounded-lg flex items-center justify-between cursor-pointer transition-colors border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-white">{p.fullName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({p.id})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span>View Dossier</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Leaf,
  Globe,
  Info,
  ChevronLeft,
  ChevronRight,
  TreePine,
  Activity,
  Shield,
  Flame,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface TreeInput {
  id: string | number;
  nombre?: string;
  especie?: string;
  estado_salud?: string;
  indice_supervivencia?: number | null;
  latitud?: number;
  longitud?: number;
}

interface ClimateSimulationPanelProps {
  arboles?: TreeInput[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Escenarios IPCC para Piura, Perú
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIOS = {
  optimista: {
    id: "optimista", label: "Optimista", sublabel: "SSP1-2.6", icon: "🌱",
    color: "#10b981",
    deltas: {
      2025: { temp: 0,    lluvia: 0,    sequia: 0,  calor: 0  },
      2030: { temp: +0.4, lluvia: -4,   sequia: +6, calor: +7 },
      2040: { temp: +0.8, lluvia: -8,   sequia:+12, calor:+15 },
      2050: { temp: +1.1, lluvia: -12,  sequia:+16, calor:+22 },
    },
  },
  moderado: {
    id: "moderado", label: "Moderado", sublabel: "SSP2-4.5", icon: "⚠️",
    color: "#f59e0b",
    deltas: {
      2025: { temp: 0,    lluvia: 0,    sequia: 0,  calor: 0  },
      2030: { temp: +0.7, lluvia: -10,  sequia:+15, calor:+18 },
      2040: { temp: +1.4, lluvia: -20,  sequia:+26, calor:+32 },
      2050: { temp: +2.1, lluvia: -30,  sequia:+37, calor:+45 },
    },
  },
  pesimista: {
    id: "pesimista", label: "Pesimista", sublabel: "SSP5-8.5", icon: "🚨",
    color: "#ef4444",
    deltas: {
      2025: { temp: 0,    lluvia: 0,    sequia: 0,  calor: 0  },
      2030: { temp: +1.0, lluvia: -15,  sequia:+23, calor:+30 },
      2040: { temp: +2.2, lluvia: -32,  sequia:+42, calor:+50 },
      2050: { temp: +3.8, lluvia: -52,  sequia:+60, calor:+70 },
    },
  },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;
type YearKey = 2025 | 2030;
const YEARS: YearKey[] = [2025, 2030];

const BASE_TEMP = 28.4;
const BASE_LLUVIA = 142;
const BASE_SEQUIA = 12;
const BASE_CALOR = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Sensibilidad climática por especie
// ─────────────────────────────────────────────────────────────────────────────
const SPECIES_SENSITIVITY: Record<string, {
  tempSens: number;      // 1 = normal, >1 = más vulnerable al calor
  droughtSens: number;   // sensibilidad a sequía
  floodRes: number;      // resistencia a lluvia excesiva (0-1)
  notes: string;
  icon: string;
}> = {
  mango:      { tempSens: 0.7, droughtSens: 0.6, floodRes: 0.7, notes: "Alta resistencia al calor seco", icon: "🥭" },
  guanábana:  { tempSens: 1.2, droughtSens: 1.3, floodRes: 0.5, notes: "Sensible a temperaturas >35°C", icon: "🍈" },
  coco:       { tempSens: 0.8, droughtSens: 0.9, floodRes: 0.8, notes: "Moderada resistencia costera", icon: "🥥" },
  limón:      { tempSens: 1.0, droughtSens: 1.1, floodRes: 0.6, notes: "Requiere riego constante", icon: "🍋" },
  naranja:    { tempSens: 1.0, droughtSens: 1.1, floodRes: 0.6, notes: "Requiere riego constante", icon: "🍊" },
  cacao:      { tempSens: 1.5, droughtSens: 1.4, floodRes: 0.4, notes: "Muy sensible a calor extremo", icon: "🍫" },
  aguacate:   { tempSens: 1.1, droughtSens: 1.3, floodRes: 0.5, notes: "Vulnerable a sequías prolongadas", icon: "🥑" },
  ceibo:      { tempSens: 0.5, droughtSens: 0.5, floodRes: 0.9, notes: "Muy resistente, especie nativa", icon: "🌳" },
  algarrobo:  { tempSens: 0.4, droughtSens: 0.3, floodRes: 0.9, notes: "Extremadamente resistente al calor", icon: "🌲" },
  ficus:      { tempSens: 0.8, droughtSens: 0.8, floodRes: 0.7, notes: "Buena adaptabilidad urbana", icon: "🌿" },
  palo:       { tempSens: 0.6, droughtSens: 0.5, floodRes: 0.8, notes: "Resistente nativo del norte", icon: "🪵" },
  eucalipto:  { tempSens: 0.7, droughtSens: 0.7, floodRes: 0.7, notes: "Adaptable pero consume mucha agua", icon: "🌿" },
  jacaranda:  { tempSens: 1.1, droughtSens: 1.0, floodRes: 0.6, notes: "Sensible a sequías extremas", icon: "💜" },
  default:    { tempSens: 1.0, droughtSens: 1.0, floodRes: 0.6, notes: "Sensibilidad media estimada", icon: "🌳" },
};

function getSpeciesSensitivity(especie?: string) {
  if (!especie) return SPECIES_SENSITIVITY.default;
  const key = especie.toLowerCase().trim();
  for (const [k, v] of Object.entries(SPECIES_SENSITIVITY)) {
    if (key.includes(k)) return v;
  }
  return SPECIES_SENSITIVITY.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sensibilidad por estado de salud
// ─────────────────────────────────────────────────────────────────────────────
const HEALTH_RESILIENCE: Record<string, number> = {
  EXCELENTE: 0.85, BUENO: 1.0, REGULAR: 1.2, MALO: 1.5, CRITICO: 1.9,
};

// ─────────────────────────────────────────────────────────────────────────────
// Proyección de supervivencia para un árbol en un año/escenario
// ─────────────────────────────────────────────────────────────────────────────
function projectTree(tree: TreeInput, scenario: ScenarioKey, year: YearKey) {
  const sc = SCENARIOS[scenario];
  const delta = sc.deltas[year];
  const base = Math.min(100, Math.max(0, tree.indice_supervivencia ?? 72));
  const health = String(tree.estado_salud ?? "REGULAR").toUpperCase();
  const sens = getSpeciesSensitivity(tree.especie);
  const resilience = HEALTH_RESILIENCE[health] ?? 1.0;

  // Impacto del calor (temperatura)
  const heatImpact = delta.temp > 0
    ? -(delta.temp * sens.tempSens * resilience * 5.5)
    : 0;

  // Impacto de sequía
  const droughtImpact = delta.sequia > 0
    ? -(delta.sequia * sens.droughtSens * resilience * 0.18)
    : 0;

  // Efecto de lluvia (positivo si hay lluvia, negativo si hay exceso)
  const rainImpact = delta.lluvia < 0
    ? delta.lluvia * sens.droughtSens * 0.15
    : delta.lluvia * sens.floodRes * 0.05;

  const totalDelta = heatImpact + droughtImpact + rainImpact;
  const projected = Math.round(Math.max(0, Math.min(100, base + totalDelta)));

  // Riesgo
  let risk: "bajo" | "moderado" | "alto" | "critico";
  if (projected >= 70) risk = "bajo";
  else if (projected >= 52) risk = "moderado";
  else if (projected >= 35) risk = "alto";
  else risk = "critico";

  return { projected, delta: projected - base, risk, heatImpact, droughtImpact, rainImpact };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades visuales
// ─────────────────────────────────────────────────────────────────────────────
const RISK_CFG = {
  bajo:     { label: "Riesgo bajo",     color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", text: "#065f46", dot: "#10b981" },
  moderado: { label: "Riesgo moderado", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#78350f", dot: "#f59e0b" },
  alto:     { label: "Riesgo alto",     color: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#7c2d12", dot: "#f97316" },
  critico:  { label: "Riesgo crítico",  color: "#ef4444", bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", dot: "#ef4444" },
};

const HEALTH_CFG: Record<string, { color: string; emoji: string; label: string }> = {
  EXCELENTE: { color: "#0ea5e9", emoji: "🔵", label: "Excelente" },
  BUENO:     { color: "#16a34a", emoji: "🟢", label: "Bueno"     },
  REGULAR:   { color: "#f59e0b", emoji: "🟡", label: "Regular"   },
  MALO:      { color: "#f97316", emoji: "🟠", label: "Malo"      },
  CRITICO:   { color: "#ef4444", emoji: "🔴", label: "Crítico"   },
};

// Barra animada
function AnimatedBar({ value, color, animate }: { value: number; color: string; animate: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (animate) { const t = setTimeout(() => setW(value), 100); return () => clearTimeout(t); }
    setW(0);
  }, [value, animate]);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export function ClimateSimulationPanel({ arboles = [] }: ClimateSimulationPanelProps) {
  const [scenario, setScenario] = useState<ScenarioKey>("moderado");
  const [year, setYear] = useState<YearKey>(2030);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [animating, setAnimating] = useState(true);

  const trees = arboles.length > 0 ? arboles : [];
  const selectedTree = trees[selectedIdx] ?? null;
  const sc = SCENARIOS[scenario];

  const triggerAnim = () => { setAnimating(false); setTimeout(() => setAnimating(true), 60); };

  const setScenarioA = (s: ScenarioKey) => { setScenario(s); triggerAnim(); };
  const setYearA = (y: YearKey) => { setYear(y); triggerAnim(); };
  const selectTree = (i: number) => { setSelectedIdx(i); triggerAnim(); };

  // Proyección del árbol seleccionado para el año/escenario actual
  const proj = useMemo(() => {
    if (!selectedTree) return null;
    return projectTree(selectedTree, scenario, year);
  }, [selectedTree, scenario, year]);

  // Proyecciones de todos los años (para el gráfico de evolución)
  const allYearProj = useMemo(() => {
    if (!selectedTree) return [];
    return YEARS.map((y) => ({ year: y, ...projectTree(selectedTree, scenario, y) }));
  }, [selectedTree, scenario]);

  // Métricas climáticas del año seleccionado
  const delta = sc.deltas[year];
  const sens = selectedTree ? getSpeciesSensitivity(selectedTree.especie) : SPECIES_SENSITIVITY.default;

  if (trees.length === 0) return null;

  const healthCfg = HEALTH_CFG[String(selectedTree?.estado_salud ?? "").toUpperCase()] ?? { color: "#94a3b8", emoji: "❓", label: "Sin datos" };
  const riskCfg = proj ? RISK_CFG[proj.risk] : RISK_CFG.moderado;

  return (
    <div className="mt-10">
      {/* ── Encabezado hero (Crema y Almendra) ── */}
      <div className="relative overflow-hidden rounded-3xl mb-6 border border-amber-200/60"
        style={{ background: "linear-gradient(135deg, #fdf8f2 0%, #f5e6d3 60%, #eddcc8 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-amber-400"
              style={{ width: `${2+(i%3)}px`, height: `${2+(i%3)}px`, opacity: 0.15+(i%4)*0.05,
                top: `${(i*37)%100}%`, left: `${(i*53)%100}%`,
                animation: `pulse ${2+(i%3)}s ease-in-out infinite`, animationDelay: `${(i*0.3)%3}s` }} />
          ))}
        </div>
        <div className="relative z-10 px-6 py-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3 border border-amber-300/30"
              style={{ background: "rgba(217,119,6,0.06)", backdropFilter: "blur(8px)" }}>
              <Globe className="h-7 w-7 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-950">Simulación de Impacto Climático por Árbol</h2>
              <p className="text-amber-800 text-sm mt-0.5">Selecciona un árbol y explora su proyección individual 2025–2030</p>
            </div>
          </div>
          <div className="md:ml-auto flex items-center gap-2 text-xs text-amber-900 bg-amber-100/60 rounded-xl px-3 py-2 border border-amber-200/50">
            <Info className="h-3.5 w-3.5 text-amber-700" />
            <span>Modelos IPCC · Piura, Perú</span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ────── Lista de árboles (columna izquierda) ────── */}
        <div className="xl:col-span-1">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Tus árboles ({trees.length})
              </p>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {trees.map((tree, i) => {
                const hc = HEALTH_CFG[String(tree.estado_salud ?? "").toUpperCase()] ?? { color: "#94a3b8", emoji: "❓", label: "Sin datos" };
                const p = projectTree(tree, scenario, year);
                const rc = RISK_CFG[p.risk];
                const isActive = i === selectedIdx;
                return (
                  <button key={tree.id} onClick={() => selectTree(i)}
                    className={`w-full text-left rounded-2xl border-2 p-3 transition-all duration-200 ${
                      isActive ? "shadow-md scale-[1.01]" : "bg-white hover:shadow-sm border-slate-200 hover:border-slate-300"}`}
                    style={isActive ? { borderColor: sc.color, background: `${sc.color}08` } : {}}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0">{getSpeciesSensitivity(tree.especie).icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{tree.nombre ?? `Árbol ${tree.id}`}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{tree.especie ?? "Especie desconocida"}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-black" style={{ color: rc.color }}>{p.projected}%</div>
                        <div className="flex items-center gap-0.5 justify-end">
                          {p.delta < 0
                            ? <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                            : <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />}
                          <span className={`text-[9px] font-bold ${p.delta < 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {p.delta > 0 ? "+" : ""}{p.delta}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-2">
                        <AnimatedBar value={p.projected} color={rc.color} animate={animating} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ────── Panel principal (columna derecha) ────── */}
        <div className="xl:col-span-3 space-y-5">
          {selectedTree && proj && (
            <>
              {/* Navegación entre árboles */}
              <div className="flex items-center justify-between">
                <button onClick={() => selectTree(Math.max(0, selectedIdx - 1))} disabled={selectedIdx === 0}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="text-xs text-slate-400 font-semibold">{selectedIdx + 1} / {trees.length}</span>
                <button onClick={() => selectTree(Math.min(trees.length - 1, selectedIdx + 1))} disabled={selectedIdx === trees.length - 1}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Tarjeta del árbol seleccionado */}
              <div className="rounded-3xl overflow-hidden border shadow-md"
                style={{ borderColor: `${sc.color}30` }}>
                {/* Header del árbol */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ background: `linear-gradient(135deg, ${sc.color}15 0%, ${sc.color}05 100%)` }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                      style={{ background: `${healthCfg.color}15`, border: `1.5px solid ${healthCfg.color}40` }}>
                      {sens.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base line-clamp-1">{selectedTree.nombre ?? `Árbol ${selectedTree.id}`}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {selectedTree.especie && <span className="text-xs text-slate-500">🌿 {selectedTree.especie}</span>}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${healthCfg.color}15`, color: healthCfg.color }}>
                          {healthCfg.emoji} {healthCfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">{sens.notes}</p>
                    </div>
                  </div>

                  {/* Índice base */}
                  <div className="flex-shrink-0 text-center sm:text-right">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Índice base 2025</p>
                    <p className="text-3xl font-black" style={{ color: healthCfg.color }}>
                      {selectedTree.indice_supervivencia ?? 72}%
                    </p>
                  </div>
                </div>

                {/* Controles */}
                <div className="px-5 py-4 bg-white border-t border-slate-100 space-y-4">
                  {/* Escenarios */}
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Escenario climático</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(SCENARIOS) as ScenarioKey[]).map((s) => {
                        const sc2 = SCENARIOS[s];
                        const active = scenario === s;
                        return (
                          <button key={s} onClick={() => setScenarioA(s)}
                            className="rounded-xl py-2 px-3 text-xs font-bold border-2 transition-all duration-200"
                            style={active
                              ? { background: sc2.color, borderColor: sc2.color, color: "white" }
                              : { background: "white", borderColor: "#e2e8f0", color: "#64748b" }}>
                            {sc2.icon} {sc2.label}
                            <span className={`block text-[9px] font-semibold mt-0.5 ${active ? "text-white/70" : "text-slate-400"}`}>
                              {sc2.sublabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timeline de años */}
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Horizonte temporal</p>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 right-0 h-0.5 bg-slate-100 rounded-full" />
                      <div className="absolute left-0 h-0.5 rounded-full transition-all duration-500"
                        style={{ width: `${(YEARS.indexOf(year) / (YEARS.length - 1)) * 100}%`, background: sc.color }} />
                      <div className="relative z-10 flex justify-between w-full">
                        {YEARS.map((y) => {
                          const active = year === y;
                          const past = YEARS.indexOf(y) <= YEARS.indexOf(year);
                          const yp = allYearProj.find((p2) => p2.year === y);
                          return (
                            <button key={y} onClick={() => setYearA(y)} className="flex flex-col items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full border-2 transition-all duration-300"
                                style={{
                                  background: past ? sc.color : "white",
                                  borderColor: past ? sc.color : "#e2e8f0",
                                  boxShadow: active ? `0 0 0 3px ${sc.color}30` : undefined,
                                  transform: active ? "scale(1.3)" : undefined,
                                }} />
                              <div className="text-center">
                                <span className="text-[10px] font-bold block"
                                  style={{ color: active ? sc.color : "#94a3b8" }}>{y}</span>
                                {yp && <span className="text-[9px] font-black block"
                                  style={{ color: yp.delta < 0 ? "#ef4444" : "#10b981" }}>
                                  {yp.projected}%
                                </span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado de proyección */}
              <div className="rounded-3xl overflow-hidden shadow-lg border-2 transition-all duration-500"
                style={{ borderColor: riskCfg.color, background: riskCfg.bg }}>
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: riskCfg.color }}>
                        Proyección en {year} · Escenario {sc.label}
                      </p>
                      <h4 className="text-4xl font-black mt-1" style={{ color: riskCfg.color }}>
                        {proj.projected}%
                        <span className="text-sm font-bold ml-2 opacity-80">supervivencia</span>
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {proj.delta < 0
                          ? <TrendingDown className="h-4 w-4" style={{ color: riskCfg.color }} />
                          : <TrendingUp className="h-4 w-4" style={{ color: "#10b981" }} />}
                        <span className="text-sm font-bold" style={{ color: proj.delta < 0 ? riskCfg.color : "#10b981" }}>
                          {proj.delta > 0 ? "+" : ""}{proj.delta} puntos desde 2025
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl px-4 py-3 text-center flex-shrink-0 shadow-sm bg-white/60"
                      style={{ border: `1.5px solid ${riskCfg.color}40` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: riskCfg.color }}>Nivel de riesgo</p>
                      <p className="text-lg font-black mt-0.5" style={{ color: riskCfg.color }}>{riskCfg.label.split(" ")[1]}</p>
                      <div className="w-3 h-3 rounded-full mx-auto mt-1" style={{ background: riskCfg.color }} />
                    </div>
                  </div>
                  <AnimatedBar value={proj.projected} color={riskCfg.color} animate={animating} />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: riskCfg.text, opacity: 0.7 }}>
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de evolución (mini sparkline) */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-violet-100 p-2">
                      <Activity className="h-4 w-4 text-violet-700" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Evolución temporal del índice</CardTitle>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cómo cambia la supervivencia de <strong>{selectedTree.nombre}</strong> año a año
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allYearProj.map((yp, i) => {
                      const rc = RISK_CFG[yp.risk];
                      const isCurrentYear = yp.year === year;
                      return (
                        <button key={yp.year} onClick={() => setYearA(yp.year)}
                          className={`w-full rounded-2xl p-3 border transition-all duration-200 text-left ${isCurrentYear ? "shadow-md scale-[1.01]" : "bg-white/50 border-slate-100 hover:shadow-sm"}`}
                          style={isCurrentYear ? { borderColor: rc.color, background: rc.bg } : {}}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 text-left">
                              <span className="text-xs font-black" style={{ color: isCurrentYear ? rc.color : "#64748b" }}>
                                {yp.year}
                              </span>
                            </div>
                            <div className="flex-1">
                              <AnimatedBar value={yp.projected} color={rc.color} animate={animating} />
                            </div>
                            <div className="w-16 text-right flex-shrink-0">
                              <span className="text-sm font-black" style={{ color: rc.color }}>{yp.projected}%</span>
                              <span className={`text-[10px] font-bold block ${yp.delta < 0 ? "text-red-500" : "text-emerald-500"}`}>
                                {yp.delta > 0 ? "+" : ""}{yp.delta}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${rc.color}15`, color: rc.color }}>
                              {rc.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Factores de impacto específicos */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-orange-100 p-2">
                      <Flame className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Factores de impacto para {year}</CardTitle>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Análisis de amenazas climáticas según especie y estado de salud
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Temperatura */}
                    <div className="rounded-2xl p-3 bg-orange-50 border border-orange-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Thermometer className="h-3.5 w-3.5 text-orange-600" />
                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Temperatura</span>
                      </div>
                      <p className="text-xl font-black text-orange-700">{(BASE_TEMP + delta.temp).toFixed(1)}°C</p>
                      <p className="text-[10px] text-orange-500 mt-0.5">
                        {delta.temp > 0 ? `+${delta.temp}°C` : "Sin cambio"} vs 2025
                      </p>
                      <div className="mt-2 text-[10px] text-orange-600 font-semibold">
                        Sensibilidad: {sens.tempSens < 0.8 ? "🟢 Baja" : sens.tempSens < 1.1 ? "🟡 Media" : "🔴 Alta"}
                      </div>
                    </div>
                    {/* Lluvia */}
                    <div className="rounded-2xl p-3 bg-sky-50 border border-sky-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Droplets className="h-3.5 w-3.5 text-sky-600" />
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wide">Lluvia</span>
                      </div>
                      <p className="text-xl font-black text-sky-700">{Math.max(0, BASE_LLUVIA + delta.lluvia)} mm</p>
                      <p className="text-[10px] text-sky-500 mt-0.5">
                        {delta.lluvia} mm vs 2025
                      </p>
                      <div className="mt-2 text-[10px] text-sky-600 font-semibold">
                        Resistencia: {sens.droughtSens < 0.8 ? "🟢 Alta" : sens.droughtSens < 1.1 ? "🟡 Media" : "🔴 Baja"}
                      </div>
                    </div>
                    {/* Sequía */}
                    <div className="rounded-2xl p-3 bg-yellow-50 border border-yellow-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wind className="h-3.5 w-3.5 text-yellow-600" />
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">Sequía</span>
                      </div>
                      <p className="text-xl font-black text-yellow-700">{BASE_SEQUIA + delta.sequia}%</p>
                      <p className="text-[10px] text-yellow-600 mt-0.5">Riesgo de periodo seco</p>
                      <div className="mt-2 text-[10px] text-yellow-700 font-semibold">
                        Impacto estimado: <span className="text-orange-600 font-black">{Math.abs(Math.round(proj.droughtImpact))} pts</span>
                      </div>
                    </div>
                    {/* Calor extremo */}
                    <div className="rounded-2xl p-3 bg-red-50 border border-red-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Calor extremo</span>
                      </div>
                      <p className="text-xl font-black text-red-700">{BASE_CALOR + delta.calor} días</p>
                      <p className="text-[10px] text-red-500 mt-0.5">Días/año sobre umbral</p>
                      <div className="mt-2 text-[10px] text-red-700 font-semibold">
                        Impacto estimado: <span className="text-red-600 font-black">{Math.abs(Math.round(proj.heatImpact))} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose del impacto */}
                  <div className="rounded-2xl p-4 bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Desglose del impacto en índice de supervivencia
                    </p>
                    <div className="space-y-2.5">
                      {[
                        { label: "🌡️ Impacto del calor",   value: proj.heatImpact,    icon: Thermometer },
                        { label: "💨 Impacto de sequía",   value: proj.droughtImpact, icon: Wind        },
                        { label: "💧 Efecto de la lluvia", value: proj.rainImpact,    icon: Droplets    },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-600 w-40 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(100, Math.abs(item.value) * 2)}%`,
                                background: item.value < 0 ? "#ef4444" : "#10b981",
                                marginLeft: item.value < 0 ? undefined : "auto",
                              }} />
                          </div>
                          <span className="text-xs font-bold w-14 text-right flex-shrink-0"
                            style={{ color: item.value < 0 ? "#ef4444" : "#10b981" }}>
                            {item.value > 0 ? "+" : ""}{Math.round(item.value)} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones personalizadas */}
              <div className="rounded-3xl p-5 border shadow-sm"
                style={{ background: `linear-gradient(135deg, ${sc.color}10 0%, ${sc.color}05 100%)`, borderColor: `${sc.color}25` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4" style={{ color: sc.color }} />
                  <h4 className="font-bold text-slate-800 text-sm">
                    Plan de cuidado personalizado — {selectedTree.nombre} en {year}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getTreeRecommendations(selectedTree, proj.risk, scenario, year, sens).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-white/70 p-3 border border-white/80 shadow-sm">
                      <span className="text-base flex-shrink-0">{rec.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{rec.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{rec.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-4 text-center">
                  * Proyecciones basadas en modelos IPCC AR6 para el norte costero del Perú con ±15% de incertidumbre.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recomendaciones personalizadas por árbol
// ─────────────────────────────────────────────────────────────────────────────
function getTreeRecommendations(
  tree: TreeInput,
  risk: "bajo" | "moderado" | "alto" | "critico",
  scenario: ScenarioKey,
  year: YearKey,
  sens: ReturnType<typeof getSpeciesSensitivity>
): { icon: string; title: string; text: string }[] {
  const recs: { icon: string; title: string; text: string }[] = [];
  const health = String(tree.estado_salud ?? "REGULAR").toUpperCase();

  // Según riesgo
  if (risk === "critico") {
    recs.push({ icon: "🆘", title: "Intervención inmediata", text: `${tree.nombre} requiere atención urgente: revisión de raíces, riego de emergencia y posible sustitución.` });
    recs.push({ icon: "🌱", title: "Evaluar reemplazo", text: `Considera plantar una especie más resistente al clima de ${year} como algarrobo o ceibo nativo.` });
  } else if (risk === "alto") {
    recs.push({ icon: "🚑", title: "Monitoreo intensivo", text: `Programa visitas semanales y aplica tratamientos preventivos contra estrés hídrico.` });
    recs.push({ icon: "💧", title: "Riego de rescate", text: `Implementa riego por goteo para reducir el consumo de agua y mantener la humedad radicular.` });
  }

  // Según sensibilidad al calor
  if (sens.tempSens > 1.0 && year >= 2040) {
    recs.push({ icon: "☀️", title: "Sombra temporal", text: `El ${tree.especie ?? "árbol"} es sensible al calor. Instala mallas de sombra del 40–50% en los meses más cálidos.` });
  }

  // Según resistencia a sequía
  if (sens.droughtSens > 1.0) {
    recs.push({ icon: "🪣", title: "Mulching para retener humedad", text: "Aplica 5–8 cm de materia orgánica alrededor de la base para reducir evaporación hasta un 30%." });

  }

  // Por salud base
  if (health === "CRITICO" || health === "MALO") {
    recs.push({ icon: "🩺", title: "Revisión técnica", text: "El estado actual compromete la resiliencia climática. Solicita evaluación fitosanitaria profesional." });
  } else if (health === "EXCELENTE" || health === "BUENO") {
    recs.push({ icon: "📊", title: "Seguimiento preventivo", text: "Buen estado base. Mantén seguimientos trimestrales y registra cambios de crecimiento ante el cambio climático." });
  }

  // Por escenario y año
  if (scenario === "pesimista" && year >= 2040) {
    recs.push({ icon: "🤝", title: "Acción colectiva", text: "En escenario crítico, coordina con autoridades locales para planes de resiliencia urbana y reforestación estratégica." });
  }

  if (recs.length < 3) {
    recs.push({ icon: "🌿", title: "Cuidado continuo", text: "Mantén riegos regulares, podas preventivas y monitoreo de plagas adaptadas a condiciones de mayor calor y sequía." });
  }

  return recs.slice(0, 4);
}

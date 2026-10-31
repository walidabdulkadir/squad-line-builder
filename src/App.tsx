import { useState, useEffect, useCallback, useRef, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { Football, Users, ShieldCheck, GearSix, ArrowsClockwise, Monitor, Desktop, FrameCorners } from "@phosphor-icons/react";
import { Player, TacticalSetup, Substitution, MatchResponsibilities } from "./types";
import { FORMATIONS, INITIAL_SQUAD, DEFAULT_SETUP, STORAGE_KEY } from "./constants";
import PitchView, { PitchSize } from "./components/PitchView";
import BenchAndSubstitutions from "./components/BenchAndSubstitutions";
import SquadManagerDialog from "./components/SquadManagerDialog";
import TacticsAndResponsibilities from "./components/TacticsAndResponsibilities";

type TabId = "bench" | "tactics" | "settings";

function normalizeSetup(raw: unknown): TacticalSetup {
  const base = DEFAULT_SETUP;
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<TacticalSetup>;

  const starters = Array.isArray(s.starters)
    ? s.starters.slice(0, 11).map((id) => (typeof id === "string" ? id : null))
    : [...base.starters];
  while (starters.length < 11) starters.push(null);

  return {
    teamName: typeof s.teamName === "string" && s.teamName.trim() ? s.teamName : base.teamName,
    kitColor: typeof s.kitColor === "string" ? s.kitColor : base.kitColor,
    formationId: FORMATIONS.some((f) => f.id === s.formationId) ? (s.formationId as string) : base.formationId,
    customPositions:
      s.customPositions && typeof s.customPositions === "object" ? s.customPositions : {},
    starters,
    substitutes: Array.isArray(s.substitutes)
      ? s.substitutes.filter((id): id is string => typeof id === "string")
      : [...base.substitutes],
    responsibilities: {
      ...base.responsibilities,
      ...(s.responsibilities && typeof s.responsibilities === "object" ? s.responsibilities : {}),
    },
    substitutions: Array.isArray(s.substitutions) ? s.substitutions.filter(Boolean) : [],
  };
}

function normalizePlayers(raw: unknown): Player[] {
  if (!Array.isArray(raw)) return INITIAL_SQUAD;
  const valid = raw.filter(
    (p): p is Player =>
      !!p && typeof p.id === "string" && typeof p.name === "string" && typeof p.number === "number",
  );
  return valid.length ? valid : INITIAL_SQUAD;
}

function loadState(): { setup: TacticalSetup; players: Player[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { setup: normalizeSetup(parsed?.setup), players: normalizePlayers(parsed?.players) };
    }
  } catch { /* corrupt or unreadable storage: fall back to defaults */ }
  return { setup: DEFAULT_SETUP, players: INITIAL_SQUAD };
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#0B132B] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
          <Football size={44} className="text-emerald-400" />
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-400 max-w-sm">The tactics board hit an unexpected error. Reset the saved data to recover.</p>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Reset &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [{ setup, players }, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState<TabId>("bench");
  const [showSquadManager, setShowSquadManager] = useState(false);
  const [pitchSize, setPitchSize] = useState<PitchSize>("standard");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ setup, players }));
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [setup, players]);

  const formation = FORMATIONS.find((f) => f.id === setup.formationId) || FORMATIONS[0];

  const handlePositionChange = useCallback((slotId: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      setup: { ...prev.setup, customPositions: { ...prev.setup.customPositions, [slotId]: { x, y } } },
    }));
  }, []);

  const handleSlotClick = useCallback((_slotId: string, _index: number) => {
    setActiveTab("bench");
  }, []);

  const handleFormationChange = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      setup: { ...prev.setup, formationId: id, customPositions: {} },
    }));
    toast.success(`Formation switched to ${FORMATIONS.find((f) => f.id === id)?.name}`);
  }, []);

  const handleSubstitute = useCallback((offId: string, onId: string) => {
    setState((prev) => {
      const starters = prev.setup.starters.map((s) => (s === offId ? onId : s));
      const substitutes = prev.setup.substitutes.filter((s) => s !== onId).concat(offId);
      const sub: Substitution = {
        id: `sub_${Date.now()}`, offPlayerId: offId, onPlayerId: onId,
        minute: (prev.setup.substitutions.length + 1) * 15, timestamp: Date.now(),
      };
      const playersUpdated = prev.players.map((p) => {
        if (p.id === offId) return { ...p, isStarter: false };
        if (p.id === onId) return { ...p, isStarter: true };
        return p;
      });
      return {
        players: playersUpdated,
        setup: { ...prev.setup, starters, substitutes, substitutions: [...prev.setup.substitutions, sub] },
      };
    });
    const offName = players.find((p) => p.id === offId)?.name;
    const onName = players.find((p) => p.id === onId)?.name;
    toast.success(`${onName} in for ${offName}`);
  }, [players]);

  const handleAutoFill = useCallback(() => {
    setState((prev) => {
      const sorted = [...prev.players].sort((a, b) => b.rating - a.rating);
      const starters = sorted.slice(0, 11).map((p) => p.id);
      const substitutes = sorted.slice(11).map((p) => p.id);
      const playersUpdated = prev.players.map((p) => ({ ...p, isStarter: starters.includes(p.id) }));
      return { players: playersUpdated, setup: { ...prev.setup, starters, substitutes, customPositions: {} } };
    });
    toast.success("Starting XI auto-filled by rating");
  }, []);

  const handleClearLineup = useCallback(() => {
    setState((prev) => ({
      ...prev,
      setup: { ...prev.setup, starters: Array(11).fill(null), substitutes: prev.players.map((p) => p.id), customPositions: {} },
      players: prev.players.map((p) => ({ ...p, isStarter: false })),
    }));
    toast.success("Lineup cleared");
  }, []);

  const handleResponsibilityChange = useCallback((key: keyof MatchResponsibilities, playerId: string | null) => {
    setState((prev) => ({
      ...prev,
      setup: { ...prev.setup, responsibilities: { ...prev.setup.responsibilities, [key]: playerId } },
    }));
  }, []);

  const handleAddPlayer = useCallback((player: Player) => {
    setState((prev) => ({
      players: [...prev.players, player],
      setup: { ...prev.setup, substitutes: [...prev.setup.substitutes, player.id] },
    }));
    toast.success(`${player.name} added to squad`);
  }, []);

  const handleUpdatePlayer = useCallback((updated: Player) => {
    setState((prev) => ({
      setup: prev.setup,
      players: prev.players.map((p) => (p.id === updated.id ? updated : p)),
    }));
    toast.success(`${updated.name} updated`);
  }, []);

  const handleDeletePlayer = useCallback((id: string) => {
    setState((prev) => ({
      players: prev.players.filter((p) => p.id !== id),
      setup: {
        ...prev.setup,
        starters: prev.setup.starters.map((s) => (s === id ? null : s)),
        substitutes: prev.setup.substitutes.filter((s) => s !== id),
      },
    }));
    toast.success("Player removed from squad");
  }, []);

  const handleTeamNameChange = useCallback((name: string) => {
    setState((prev) => ({ ...prev, setup: { ...prev.setup, teamName: name } }));
  }, []);

  const handleKitColorChange = useCallback((color: string) => {
    setState((prev) => ({ ...prev, setup: { ...prev.setup, kitColor: color } }));
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ setup: DEFAULT_SETUP, players: INITIAL_SQUAD });
    toast.success("Reset to defaults");
  }, []);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "bench", label: "Bench", icon: <Users size={14} /> },
    { id: "tactics", label: "Tactics", icon: <Football size={14} /> },
    { id: "settings", label: "Settings", icon: <GearSix size={14} /> },
  ];

  return (
    <ErrorBoundary>
    <div className="min-h-[100dvh] bg-[#0B132B] text-white font-sans">
      <Toaster richColors position="top-right" closeButton />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Football size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{setup.teamName}</h1>
              <p className="text-[10px] text-gray-500">{formation.name} | {setup.starters.filter(Boolean).length}/11 filled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSquadManager(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-xs text-gray-300 hover:border-emerald-500/40 hover:text-white transition-colors">
              <ShieldCheck size={14} /> Squad
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-xs text-gray-300 hover:border-amber-500/40 hover:text-white transition-colors">
              <ArrowsClockwise size={14} /> Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Pitch */}
        <div className="order-1 flex flex-col items-center">
          {/* Pitch size controls */}
          <div className="flex items-center gap-1 mb-3 bg-[#1E293B] border border-[#334155] rounded-lg p-1">
            {([
              { id: "compact" as PitchSize, label: "Compact", icon: <FrameCorners size={13} /> },
              { id: "standard" as PitchSize, label: "Standard", icon: <Desktop size={13} /> },
              { id: "expanded" as PitchSize, label: "Wide", icon: <Monitor size={13} /> },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPitchSize(opt.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  pitchSize === opt.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-[#334155]/50"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <PitchView
            formation={formation}
            starters={setup.starters}
            players={players}
            customPositions={setup.customPositions}
            responsibilities={setup.responsibilities}
            kitColor={setup.kitColor}
            pitchSize={pitchSize}
            onPositionChange={handlePositionChange}
            onSlotClick={handleSlotClick}
          />
        </div>

        {/* Side panel */}
        <aside className="order-2 lg:order-2">
          <div className="bg-[#111E38] border border-[#1E293B] rounded-xl overflow-hidden sticky top-[72px]">
            {/* Tab bar */}
            <div className="flex border-b border-[#1E293B]">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === tab.id ? "text-emerald-400 bg-emerald-500/5 border-b-2 border-emerald-400" : "text-gray-500 hover:text-gray-300"
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 max-h-[calc(100dvh-180px)] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "bench" && (
                    <BenchAndSubstitutions
                      players={players}
                      starters={setup.starters}
                      substitutes={setup.substitutes}
                      substitutions={setup.substitutions}
                      onSubstitute={handleSubstitute}
                      onAutoFill={handleAutoFill}
                      onClearLineup={handleClearLineup}
                    />
                  )}
                  {activeTab === "tactics" && (
                    <TacticsAndResponsibilities
                      formations={FORMATIONS}
                      currentFormationId={setup.formationId}
                      responsibilities={setup.responsibilities}
                      players={players}
                      onFormationChange={handleFormationChange}
                      onResponsibilityChange={handleResponsibilityChange}
                    />
                  )}
                  {activeTab === "settings" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Team Name</label>
                        <input value={setup.teamName} onChange={(e) => handleTeamNameChange(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Kit Color</label>
                        <div className="flex gap-2 mt-2">
                          {["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"].map((c) => (
                            <button key={c} onClick={() => handleKitColorChange(c)}
                              className={`w-7 h-7 rounded-full border-2 transition-transform ${setup.kitColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-[#1E293B]">
                        <p className="text-xs text-gray-500">Data auto-saves to browser storage. Changes persist across sessions.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </main>

      {/* Squad Manager Modal */}
      <AnimatePresence>
        {showSquadManager && (
          <SquadManagerDialog
            players={players}
            teamName={setup.teamName}
            kitColor={setup.kitColor}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onTeamNameChange={handleTeamNameChange}
            onKitColorChange={handleKitColorChange}
            onClose={() => setShowSquadManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
import { useState, useEffect, useCallback, useRef, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  SoccerBall, Users, GearSix, UserPlus, ShieldCheck,
  FrameCorners, Desktop, Monitor, GithubLogo, LinkedinLogo, InstagramLogo,
} from "@phosphor-icons/react";
import { Player, TacticalSetup, Substitution, MatchResponsibilities } from "./types";
import { FORMATIONS, INITIAL_SQUAD, DEFAULT_SETUP, STORAGE_KEY } from "./constants";
import PitchView, { PitchSize } from "./components/PitchView";
import BenchAndSubstitutions from "./components/BenchAndSubstitutions";
import SquadManagerDialog from "./components/SquadManagerDialog";
import AddPlayerDialog from "./components/AddPlayerDialog";
import SlotPickerSheet from "./components/SlotPickerSheet";
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
    customPositions: s.customPositions && typeof s.customPositions === "object" ? s.customPositions : {},
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
  } catch { /* corrupt storage */ }
  return { setup: DEFAULT_SETUP, players: INITIAL_SQUAD };
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#0B132B] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
          <SoccerBall size={44} className="text-emerald-400" />
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-400 max-w-sm">The tactics board hit an unexpected error.</p>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Clear &amp; reload
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
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [pitchSize, setPitchSize] = useState<PitchSize>("compact");
  const [pendingSlot, setPendingSlot] = useState<{ slotId: string; slotIndex: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSlotClick = useCallback((slotId: string, slotIndex: number) => {
    if (setup.starters[slotIndex] !== null) return;
    setPendingSlot({ slotId, slotIndex });
  }, [setup.starters]);

  const handleSlotPick = useCallback((playerId: string) => {
    if (!pendingSlot) return;
    setState((prev) => {
      const newStarters = [...prev.setup.starters];
      newStarters[pendingSlot.slotIndex] = playerId;
      const newSubstitutes = prev.setup.substitutes.filter((id) => id !== playerId);
      const playersUpdated = prev.players.map((p) =>
        p.id === playerId ? { ...p, isStarter: true } : p
      );
      return {
        players: playersUpdated,
        setup: { ...prev.setup, starters: newStarters, substitutes: newSubstitutes },
      };
    });
    setPendingSlot(null);
  }, [pendingSlot]);

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

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "bench", label: "Bench", icon: <Users size={16} /> },
    { id: "tactics", label: "Tactics", icon: <SoccerBall size={16} /> },
    { id: "settings", label: "Settings", icon: <GearSix size={16} /> },
  ];

  const HEADER_H = 56; // px — keep in sync with header py

  return (
    <ErrorBoundary>
      {/* ── Root shell ── */}
      <div className="min-h-[100dvh] bg-[#0B132B] text-white font-sans">
        <Toaster richColors position="top-center" closeButton />

        {/* ══════════ HEADER ══════════ */}
        <header
          className="sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-md border-b border-[#1E293B]"
          style={{ height: HEADER_H }}
        >
          <div className="h-full max-w-7xl mx-auto px-3 sm:px-5 flex items-center justify-between gap-2">
            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <SoccerBall size={17} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white leading-tight truncate max-w-[140px] sm:max-w-none">
                  {setup.teamName}
                </h1>
                <p className="text-[10px] text-gray-500 hidden sm:block">
                  {formation.name} · {setup.starters.filter(Boolean).length}/11
                </p>
              </div>
            </div>

            {/* Actions — joined pill */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setShowSquadManager(true)}
                className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-l-lg bg-[#1E293B] border border-[#334155] text-xs font-semibold text-gray-300 hover:bg-[#273548] hover:text-white transition-colors"
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Squad</span>
              </button>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-r-lg bg-emerald-500 border border-emerald-500 text-xs font-semibold text-white hover:bg-emerald-400 transition-colors"
              >
                <UserPlus size={14} />
                <span className="hidden sm:inline">Add Player</span>
              </button>
            </div>
          </div>
        </header>

        {/* ══════════ MAIN ══════════
            Mobile  : single column, pitch → panel (panel has fixed bottom tabs)
            Tablet  : single column with better sizing
            Desktop : two columns side-by-side
        ══════════ */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6
                         pb-[72px] sm:pb-4           {/* space for mobile bottom tab bar */}
                         pt-4
                         grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-6
                         lg:items-start">

          {/* ── Pitch column ── */}
          <div className="order-1 flex flex-col items-center gap-3">

            {/* Pitch size toggle — hidden on mobile (auto compact) */}
            <div className="hidden sm:flex items-center gap-1 bg-[#1E293B] border border-[#334155] rounded-lg p-1 self-center">
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

            {/* Pitch — fluid on mobile, capped on larger screens */}
            <div className="w-full flex justify-center">
              <PitchView
                formation={formation}
                starters={setup.starters}
                players={players}
                customPositions={setup.customPositions}
                responsibilities={setup.responsibilities}
                kitColor={setup.kitColor}
                pitchSize={pitchSize}
                substitutes={setup.substitutes}
                onPositionChange={handlePositionChange}
                onSlotClick={handleSlotClick}
                onSubstitute={handleSubstitute}
              />
            </div>
          </div>

          {/* ── Side panel (desktop: right column; mobile/tablet: below pitch) ── */}
          <aside className="order-2 lg:sticky lg:top-[calc(56px+1rem)]">
            {/* Desktop card */}
            <div className="hidden sm:block bg-[#111E38] border border-[#1E293B] rounded-2xl overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-[#1E293B]">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors ${
                      activeTab === tab.id
                        ? "text-emerald-400 bg-emerald-500/5 border-b-2 border-emerald-400"
                        : "text-gray-500 hover:text-gray-300"
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(100dvh-160px)]">
                <TabContent
                  activeTab={activeTab}
                  players={players}
                  setup={setup}
                  formations={FORMATIONS}
                  onSubstitute={handleSubstitute}
                  onAutoFill={handleAutoFill}
                  onClearLineup={handleClearLineup}
                  onFormationChange={handleFormationChange}
                  onResponsibilityChange={handleResponsibilityChange}
                  onTeamNameChange={handleTeamNameChange}
                  onKitColorChange={handleKitColorChange}
                />
              </div>
            </div>

            {/* Mobile: flat content below pitch (tabs handled by fixed bottom bar) */}
            <div className="sm:hidden bg-[#111E38] border border-[#1E293B] rounded-2xl overflow-hidden">
              <div className="p-4">
                <TabContent
                  activeTab={activeTab}
                  players={players}
                  setup={setup}
                  formations={FORMATIONS}
                  onSubstitute={handleSubstitute}
                  onAutoFill={handleAutoFill}
                  onClearLineup={handleClearLineup}
                  onFormationChange={handleFormationChange}
                  onResponsibilityChange={handleResponsibilityChange}
                  onTeamNameChange={handleTeamNameChange}
                  onKitColorChange={handleKitColorChange}
                />
              </div>
            </div>
          </aside>
        </main>

        {/* ══════════ MOBILE BOTTOM TAB BAR ══════════ */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B132B]/95 backdrop-blur-md border-t border-[#1E293B]">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                  activeTab === tab.id ? "text-emerald-400" : "text-gray-500"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <footer className="border-t border-[#1E293B] bg-[#0B132B]">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-6 pb-24 sm:pb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Built by{" "}
                <span className="font-display text-base font-bold tracking-tight text-emerald-400 sm:text-lg">
                  Walid Abdulkadir
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Connect to my socials
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/walidabdulkadir"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub profile (opens in a new tab)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <GithubLogo size={16} aria-hidden="true" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/walid-abdulkadir-70529a2a2"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn profile (opens in a new tab)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <LinkedinLogo size={16} aria-hidden="true" />
                  LinkedIn
                </a>
                <a
                  href="https://www.instagram.com/walidjr_10?igsh=dHdoMnc2aTdyeXN2"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram profile (opens in a new tab)"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <InstagramLogo size={16} aria-hidden="true" />
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* ══════════ MODALS ══════════ */}
        <AnimatePresence>
          {showSquadManager && (
            <SquadManagerDialog
              players={players}
              teamName={setup.teamName}
              kitColor={setup.kitColor}
              onUpdatePlayer={handleUpdatePlayer}
              onDeletePlayer={handleDeletePlayer}
              onTeamNameChange={handleTeamNameChange}
              onKitColorChange={handleKitColorChange}
              onClose={() => setShowSquadManager(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddPlayer && (
            <AddPlayerDialog
              players={players}
              kitColor={setup.kitColor}
              onAddPlayer={handleAddPlayer}
              onClose={() => setShowAddPlayer(false)}
            />
          )}
        </AnimatePresence>

        {pendingSlot && (() => {
          const slot = formation.slots[pendingSlot.slotIndex];
          const benchPlayers = players.filter((p) => setup.substitutes.includes(p.id));
          return (
            <SlotPickerSheet
              slotLabel={slot?.label ?? "Slot"}
              benchPlayers={benchPlayers}
              kitColor={setup.kitColor}
              onPick={handleSlotPick}
              onClose={() => setPendingSlot(null)}
            />
          );
        })()}
      </div>
    </ErrorBoundary>
  );
}

/* ── Extracted tab content so it renders in both desktop card and mobile flat view ── */
function TabContent({
  activeTab, players, setup, formations,
  onSubstitute, onAutoFill, onClearLineup,
  onFormationChange, onResponsibilityChange,
  onTeamNameChange, onKitColorChange,
}: {
  activeTab: TabId;
  players: Player[];
  setup: TacticalSetup;
  formations: typeof FORMATIONS;
  onSubstitute: (a: string, b: string) => void;
  onAutoFill: () => void;
  onClearLineup: () => void;
  onFormationChange: (id: string) => void;
  onResponsibilityChange: (key: keyof MatchResponsibilities, id: string | null) => void;
  onTeamNameChange: (name: string) => void;
  onKitColorChange: (color: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === "bench" && (
          <BenchAndSubstitutions
            players={players}
            starters={setup.starters}
            substitutes={setup.substitutes}
            substitutions={setup.substitutions}
            onSubstitute={onSubstitute}
            onAutoFill={onAutoFill}
            onClearLineup={onClearLineup}
          />
        )}
        {activeTab === "tactics" && (
          <TacticsAndResponsibilities
            formations={formations}
            currentFormationId={setup.formationId}
            responsibilities={setup.responsibilities}
            players={players}
            onFormationChange={onFormationChange}
            onResponsibilityChange={onResponsibilityChange}
          />
        )}
        {activeTab === "settings" && (
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Team Name</label>
              <input
                value={setup.teamName}
                onChange={(e) => onTeamNameChange(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kit Color</label>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"].map((c) => (
                  <button
                    key={c}
                    onClick={() => onKitColorChange(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      setup.kitColor === c ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E293B]">
              <p className="text-xs text-gray-500">Changes auto-save to browser storage.</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

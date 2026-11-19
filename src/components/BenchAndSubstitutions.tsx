import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowsClockwise, Trash, ArrowsLeftRight, X, ArrowDown } from "@phosphor-icons/react";
import { Player, Substitution, positionGroup, PositionGroup } from "../types";

interface BenchProps {
  players: Player[];
  starters: (string | null)[];
  substitutes: string[];
  substitutions: Substitution[];
  onSubstitute: (offId: string, onId: string) => void;
  onAutoFill: () => void;
  onClearLineup: () => void;
}

const GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];
const GROUP_LABELS: Record<PositionGroup, string> = { GK: "GK", DEF: "DEF", MID: "MID", FWD: "FWD" };
const GROUP_COLORS: Record<PositionGroup, { badge: string; dot: string }> = {
  GK:  { badge: "bg-amber-400/10 text-amber-400 border-amber-400/30",       dot: "bg-amber-400" },
  DEF: { badge: "bg-blue-400/10 text-blue-700 border-blue-400/30",           dot: "bg-blue-400" },
  MID: { badge: "bg-blue-400/10 text-blue-700 border-blue-400/30", dot: "bg-blue-400" },
  FWD: { badge: "bg-red-400/10 text-red-400 border-red-400/30",             dot: "bg-red-400" },
};

export default function BenchAndSubstitutions({
  players, starters, substitutes, onSubstitute, onAutoFill, onClearLineup,
}: BenchProps) {
  // Which bench player is "pending" — waiting for user to pick who comes off
  const [pendingOnId, setPendingOnId] = useState<string | null>(null);

  const benchPlayers = players.filter((p) => substitutes.includes(p.id));
  const activeStarters = starters
    .filter(Boolean)
    .map((id) => players.find((p) => p.id === id)!)
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating);

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    players: benchPlayers
      .filter((p) => positionGroup(p.position) === g)
      .sort((a, b) => b.rating - a.rating),
  })).filter((g) => g.players.length > 0);

  const pendingPlayer = pendingOnId ? players.find((p) => p.id === pendingOnId) : null;

  const handleBenchTap = (id: string) => {
    setPendingOnId((prev) => (prev === id ? null : id));
  };

  const handleStarterPick = (offId: string) => {
    if (!pendingOnId) return;
    onSubstitute(offId, pendingOnId);
    setPendingOnId(null);
  };

  return (
    <div className="space-y-4">

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onAutoFill}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-none bg-blue-600/10 border border-blue-600/25 text-sm font-semibold text-blue-700 hover:bg-blue-600/20 hover:border-blue-600/50 transition-all">
          <ArrowsClockwise size={15} /> Auto-fill XI
        </button>
        <button onClick={onClearLineup}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-none bg-red-500/10 border border-red-500/25 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all">
          <Trash size={15} /> Clear XI
        </button>
      </div>

      {/* ── Starting XI ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Starting XI</h4>
          <span className="text-[10px] text-[var(--muted)]">{activeStarters.length}/11</span>
        </div>
        <div className="space-y-1.5">
          {activeStarters.length === 0 && (
            <p className="text-xs text-[var(--muted)] text-center py-4">No starters — use Auto-fill or click pitch slots</p>
          )}
          {activeStarters.map((p) => {
            const c = GROUP_COLORS[positionGroup(p.position)];
            const isSubTarget = !!pendingOnId;
            return (
              <motion.button
                key={p.id}
                onClick={() => isSubTarget && handleStarterPick(p.id)}
                whileTap={isSubTarget ? { scale: 0.97 } : {}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none border transition-all text-left ${
                  isSubTarget
                    ? "bg-red-500/10 border-red-500/40 hover:bg-red-500/20 cursor-pointer ring-1 ring-red-500/20"
                    : "bg-[var(--surface-2)] border-[var(--border)] cursor-default"
                }`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-none flex items-center justify-center text-sm font-bold border ${
                  isSubTarget ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)]"
                }`}>
                  {p.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{p.name}</p>
                  <p className="text-[10px] text-[var(--muted)]">★ {p.rating}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-none border shrink-0 ${c.badge}`}>
                  {p.position}
                </span>
                {isSubTarget && <ArrowDown size={13} className="text-red-400 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Bench ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Bench</h4>
          <span className="text-[10px] text-[var(--muted)]">{benchPlayers.length} available</span>
        </div>

        {/* Inline instruction banner */}
        <AnimatePresence>
          {pendingOnId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-none bg-red-500/10 border border-red-500/30">
                <ArrowsLeftRight size={14} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-200 flex-1">
                  <span className="font-bold text-[var(--fg)]">{pendingPlayer?.name}</span> coming on — tap a starter above to sub them off
                </p>
                <button onClick={() => setPendingOnId(null)}
                  className="w-5 h-5 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-[var(--surface-2)]">
                  <X size={10} className="text-[var(--muted)]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {benchPlayers.length === 0 ? (
          <p className="text-xs text-[var(--muted)] text-center py-4">Bench is empty</p>
        ) : (
          <div className="space-y-3">
            {grouped.map(({ group, players: gp }) => {
              const c = GROUP_COLORS[group];
              return (
                <div key={group}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{GROUP_LABELS[group]}</span>
                  </div>
                  <div className="space-y-1.5">
                    {gp.map((p) => (
                      <motion.button
                        key={p.id}
                        onClick={() => handleBenchTap(p.id)}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none border transition-all text-left group ${
                          pendingOnId === p.id
                            ? "bg-blue-600/15 border-blue-600/50 ring-1 ring-blue-600/30"
                            : "bg-[var(--surface-2)] border-[var(--border)] hover:border-blue-600/30 hover:bg-blue-600/5"
                        }`}
                      >
                        <div className={`w-8 h-8 shrink-0 rounded-none flex items-center justify-center text-sm font-bold border ${
                          pendingOnId === p.id
                            ? "bg-blue-600/20 border-blue-600/40 text-blue-700"
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)]"
                        }`}>
                          {p.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--fg)] truncate">{p.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">★ {p.rating}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-none border shrink-0 ${c.badge}`}>
                          {p.position}
                        </span>
                        {pendingOnId === p.id
                          ? <span className="text-blue-700 text-[10px] font-bold shrink-0">selected ✓</span>
                          : <ArrowsLeftRight size={13} className="text-[var(--muted)] group-hover:text-blue-700 transition-colors shrink-0" />
                        }
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

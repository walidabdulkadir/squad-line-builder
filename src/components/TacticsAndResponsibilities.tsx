import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Target, ArrowsLeftRight, Flag, Shield, CaretDown, X } from "@phosphor-icons/react";
import { Formation, MatchResponsibilities, Player } from "../types";

interface TacticsProps {
  formations: Formation[];
  currentFormationId: string;
  responsibilities: MatchResponsibilities;
  players: Player[];
  onFormationChange: (id: string) => void;
  onResponsibilityChange: (key: keyof MatchResponsibilities, playerId: string | null) => void;
}

const RESP_CONFIG: { key: keyof MatchResponsibilities; label: string; short: string; icon: React.ReactNode }[] = [
  { key: "captainId",        label: "Captain",       short: "C",    icon: <Crown size={14} className="text-amber-400" /> },
  { key: "viceCaptainId",    label: "Vice-Captain",  short: "VC",   icon: <Shield size={14} className="text-[var(--muted)]" /> },
  { key: "penaltyTakerId",   label: "Penalty Taker", short: "PK",   icon: <Target size={14} className="text-red-400" /> },
  { key: "freeKickTakerId",  label: "Free Kick",     short: "FK",   icon: <ArrowsLeftRight size={14} className="text-blue-700" /> },
  { key: "leftCornerTakerId",  label: "Left Corner",  short: "L-CK", icon: <Flag size={14} className="text-blue-700" /> },
  { key: "rightCornerTakerId", label: "Right Corner", short: "R-CK", icon: <Flag size={14} className="text-purple-400" /> },
];

function PlayerDropdown({
  value,
  players,
  onChange,
}: {
  value: string | null;
  players: Player[];
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? players.find((p) => p.id === value) : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-none border text-sm transition-all ${
          open
            ? "bg-[var(--surface-2)] border-blue-600/50 text-[var(--fg)]"
            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] hover:border-[var(--border)]"
        }`}
      >
        <span className="truncate">
          {selected ? (
            <span className="font-medium">{selected.name.split(" ").pop()} <span className="text-[var(--muted)] text-xs">#{selected.number}</span></span>
          ) : (
            <span className="text-[var(--muted)]">Unassigned</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="w-4 h-4 rounded-full bg-[var(--surface-2)] flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              <X size={9} className="text-[var(--muted)]" />
            </span>
          )}
          <CaretDown
            size={12}
            className={`text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--surface-2)] border border-[var(--border)] rounded-none shadow-2xl overflow-hidden"
          >
            {/* Unassigned option */}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-2)] ${
                !value ? "text-blue-700 bg-blue-600/5" : "text-[var(--muted)]"
              }`}
            >
              <span className="w-6 h-6 rounded-none bg-[var(--surface-2)] flex items-center justify-center text-[9px] font-bold text-[var(--muted)]">—</span>
              Unassigned
            </button>

            <div className="border-t border-[var(--border)]" />

            {/* Player options */}
            <div className="max-h-44 overflow-y-auto">
              {players.length === 0 && (
                <p className="px-3 py-3 text-xs text-[var(--muted)] text-center">No players added yet</p>
              )}
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-2)] ${
                    value === p.id ? "bg-blue-600/10 text-blue-700" : "text-[var(--fg)]"
                  }`}
                >
                  <span className="w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-bold text-[var(--accent-fg)] shrink-0"
                    style={{ backgroundColor: "#10B981" + "33", border: "1px solid #10B98133" }}>
                    {p.number}
                  </span>
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  <span className="text-[10px] text-[var(--muted)] shrink-0">{p.position}</span>
                  {value === p.id && (
                    <span className="w-4 h-4 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TacticsAndResponsibilities({
  formations, currentFormationId, responsibilities, players, onFormationChange, onResponsibilityChange,
}: TacticsProps) {
  return (
    <div className="space-y-5">
      {/* Formation selector */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Formation</h4>
        <div className="grid grid-cols-3 gap-2">
          {formations.map((f) => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onFormationChange(f.id)}
              className={`px-3 py-2.5 rounded-none text-sm font-bold text-center transition-all ${
                currentFormationId === f.id
                  ? "bg-blue-600 text-[var(--accent-fg)] shadow-lg shadow-blue-500/25"
                  : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] hover:border-blue-600/40 hover:text-[var(--fg)]"
              }`}
            >
              {f.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Set-Piece Duties</h4>
        <div className="space-y-2">
          {RESP_CONFIG.map(({ key, label, short, icon }) => (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-none bg-[var(--bg)] border border-[var(--border)]">
              <span className="w-7 h-7 shrink-0 rounded-none bg-[var(--surface-2)] flex items-center justify-center">{icon}</span>
              <span className="text-xs text-[var(--muted)] w-[72px] shrink-0">{label}</span>
              <PlayerDropdown
                value={responsibilities[key]}
                players={players}
                onChange={(id) => onResponsibilityChange(key, id)}
              />
              {responsibilities[key] && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 shrink-0">{short}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Matchday summary */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Matchday Summary</h4>
        <div className="flex flex-wrap gap-1.5">
          {RESP_CONFIG.map(({ key, short }) => {
            const pid = responsibilities[key];
            const player = pid ? players.find((p) => p.id === pid) : null;
            if (!player) return null;
            return (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[10px] text-[var(--muted)]">
                <span className="font-bold text-amber-400">{short}</span>
                {player.name.split(" ").pop()}
              </span>
            );
          })}
          {RESP_CONFIG.every(({ key }) => !responsibilities[key]) && (
            <p className="text-xs text-[var(--muted)]">No duties assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

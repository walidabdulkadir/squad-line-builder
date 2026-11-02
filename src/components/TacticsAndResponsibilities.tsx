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
  { key: "viceCaptainId",    label: "Vice-Captain",  short: "VC",   icon: <Shield size={14} className="text-gray-300" /> },
  { key: "penaltyTakerId",   label: "Penalty Taker", short: "PK",   icon: <Target size={14} className="text-red-400" /> },
  { key: "freeKickTakerId",  label: "Free Kick",     short: "FK",   icon: <ArrowsLeftRight size={14} className="text-blue-400" /> },
  { key: "leftCornerTakerId",  label: "Left Corner",  short: "L-CK", icon: <Flag size={14} className="text-emerald-400" /> },
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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
          open
            ? "bg-[#1a2a42] border-emerald-500/50 text-white"
            : "bg-[#0d1829] border-[#1E293B] text-white hover:border-[#334155]"
        }`}
      >
        <span className="truncate">
          {selected ? (
            <span className="font-medium">{selected.name.split(" ").pop()} <span className="text-gray-500 text-xs">#{selected.number}</span></span>
          ) : (
            <span className="text-gray-500">Unassigned</span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="w-4 h-4 rounded-full bg-[#334155] flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              <X size={9} className="text-gray-400" />
            </span>
          )}
          <CaretDown
            size={12}
            className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0d1829] border border-[#334155] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Unassigned option */}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-[#1E293B] ${
                !value ? "text-emerald-400 bg-emerald-500/5" : "text-gray-400"
              }`}
            >
              <span className="w-6 h-6 rounded-md bg-[#1E293B] flex items-center justify-center text-[9px] font-bold text-gray-500">—</span>
              Unassigned
            </button>

            <div className="border-t border-[#1E293B]" />

            {/* Player options */}
            <div className="max-h-44 overflow-y-auto">
              {players.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-600 text-center">No players added yet</p>
              )}
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[#1E293B] ${
                    value === p.id ? "bg-emerald-500/10 text-emerald-300" : "text-white"
                  }`}
                >
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: "#10B981" + "33", border: "1px solid #10B98133" }}>
                    {p.number}
                  </span>
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{p.position}</span>
                  {value === p.id && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Formation</h4>
        <div className="grid grid-cols-3 gap-2">
          {formations.map((f) => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onFormationChange(f.id)}
              className={`px-3 py-2.5 rounded-lg text-sm font-bold text-center transition-all ${
                currentFormationId === f.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-[#1E293B] text-gray-400 border border-[#334155] hover:border-emerald-500/40 hover:text-white"
              }`}
            >
              {f.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Set-Piece Duties</h4>
        <div className="space-y-2">
          {RESP_CONFIG.map(({ key, label, short, icon }) => (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B132B] border border-[#1E293B]">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-[#1E293B] flex items-center justify-center">{icon}</span>
              <span className="text-xs text-gray-400 w-[72px] shrink-0">{label}</span>
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
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Matchday Summary</h4>
        <div className="flex flex-wrap gap-1.5">
          {RESP_CONFIG.map(({ key, short }) => {
            const pid = responsibilities[key];
            const player = pid ? players.find((p) => p.id === pid) : null;
            if (!player) return null;
            return (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#1E293B] border border-[#334155] text-[10px] text-gray-300">
                <span className="font-bold text-amber-400">{short}</span>
                {player.name.split(" ").pop()}
              </span>
            );
          })}
          {RESP_CONFIG.every(({ key }) => !responsibilities[key]) && (
            <p className="text-xs text-gray-600">No duties assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

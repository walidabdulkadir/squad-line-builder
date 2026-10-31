import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUUpLeft, UserPlus, ArrowsClockwise, List } from "@phosphor-icons/react";
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

const GROUP_LABELS: Record<PositionGroup, string> = { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" };
const GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

export default function BenchAndSubstitutions({
  players, starters, substitutes, substitutions, onSubstitute, onAutoFill, onClearLineup,
}: BenchProps) {
  const [subMode, setSubMode] = useState<{ offId: string | null }>({ offId: null });
  const [selectedOff, setSelectedOff] = useState<string | null>(null);

  const benchPlayers = players.filter((p) => substitutes.includes(p.id));
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    players: benchPlayers.filter((p) => positionGroup(p.position) === g),
  })).filter((g) => g.players.length > 0);

  const activeStarters = starters.filter(Boolean).map((id) => players.find((p) => p.id === id)!).filter(Boolean);

  const handleBenchClick = (benchId: string) => {
    if (selectedOff) {
      onSubstitute(selectedOff, benchId);
      setSelectedOff(null);
      setSubMode({ offId: null });
    }
  };

  const handleStarterClick = (starterId: string) => {
    setSelectedOff(starterId);
    setSubMode({ offId: starterId });
  };

  return (
    <div className="space-y-4">
      {/* Substitution mode indicator */}
      <AnimatePresence>
        {selectedOff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
              <ArrowUUpLeft size={16} className="text-emerald-400" />
              <p className="text-xs text-emerald-300">
                Select a bench player to substitute in for{" "}
                <span className="font-semibold text-white">
                  {players.find((p) => p.id === selectedOff)?.name}
                </span>
              </p>
              <button onClick={() => { setSelectedOff(null); setSubMode({ offId: null }); }}
                className="ml-auto text-xs text-gray-400 hover:text-white">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active starters for sub selection */}
      {selectedOff === null && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">On Pitch (tap to sub off)</h4>
          <div className="flex flex-wrap gap-1.5">
            {activeStarters.map((p) => (
              <button key={p.id} onClick={() => handleStarterClick(p.id)}
                className="px-2 py-1 rounded-md bg-[#1E293B] border border-[#334155] text-xs text-gray-300 hover:border-emerald-500/50 hover:text-white transition-colors">
                #{p.number} {p.name.split(" ").pop()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bench players grouped */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bench</h4>
        <div className="space-y-3">
          {grouped.map(({ group, players: gp }) => (
            <div key={group}>
              <p className="text-[10px] text-gray-500 font-medium mb-1">{GROUP_LABELS[group]}</p>
              <div className="space-y-1">
                {gp.map((p) => (
                  <motion.button
                    key={p.id}
                    onClick={() => handleBenchClick(p.id)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedOff ? "bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20" : "bg-[#1E293B] border border-[#334155] hover:border-gray-500"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-[#0B132B] flex items-center justify-center text-xs font-bold text-white border border-[#334155]">
                      {p.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.position} | Rating {p.rating}</p>
                    </div>
                    {selectedOff && <UserPlus size={14} className="text-emerald-400" />}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub log */}
      {substitutions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <List size={12} /> Sub Log
          </h4>
          <div className="space-y-1">
            {substitutions.map((sub) => {
              const off = players.find((p) => p.id === sub.offPlayerId);
              const on = players.find((p) => p.id === sub.onPlayerId);
              return (
                <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#1E293B]/50 text-xs">
                  <span className="text-red-400 line-through">{off?.name.split(" ").pop()}</span>
                  <ArrowUUpLeft size={10} className="text-gray-500" />
                  <span className="text-emerald-400">{on?.name.split(" ").pop()}</span>
                  <span className="ml-auto text-gray-500">{sub.minute}&apos;</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 pt-2 border-t border-[#334155]">
        <button onClick={onAutoFill}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors">
          <ArrowsClockwise size={14} /> Auto-fill XI
        </button>
        <button onClick={onClearLineup}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 hover:bg-red-500/20 transition-colors">
          <UserPlus size={14} className="rotate-180" /> Clear XI
        </button>
      </div>
    </div>
  );
}

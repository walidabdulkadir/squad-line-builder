import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUp } from "@phosphor-icons/react";
import { Player, positionGroup, PositionGroup } from "../types";

interface SlotPickerSheetProps {
  slotLabel: string;
  benchPlayers: Player[];
  kitColor: string;
  onPick: (playerId: string) => void;
  onClose: () => void;
}

const GROUP_ORDER: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];
const GROUP_LABELS: Record<PositionGroup, string> = { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" };
const GROUP_COLORS: Record<PositionGroup, { badge: string; dot: string }> = {
  GK:  { badge: "bg-amber-400/10 text-amber-400 border-amber-400/30",       dot: "bg-amber-400" },
  DEF: { badge: "bg-blue-400/10 text-blue-400 border-blue-400/30",           dot: "bg-blue-400" },
  MID: { badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30", dot: "bg-emerald-400" },
  FWD: { badge: "bg-red-400/10 text-red-400 border-red-400/30",             dot: "bg-red-400" },
};

export default function SlotPickerSheet({ slotLabel, benchPlayers, kitColor, onPick, onClose }: SlotPickerSheetProps) {
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    players: benchPlayers
      .filter((p) => positionGroup(p.position) === g)
      .sort((a, b) => b.rating - a.rating),
  })).filter((g) => g.players.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-full sm:max-w-sm bg-[#111E38] border border-[#334155] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-dashed border-white/30 text-white/50 text-sm font-bold">
                +
              </div>
              <div>
                <p className="text-xs text-gray-400">Filling slot</p>
                <p className="text-sm font-bold text-white">{slotLabel}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
              <X size={13} className="text-gray-400" />
            </button>
          </div>

          {/* Player list */}
          <div className="p-3 max-h-80 overflow-y-auto space-y-3">
            {benchPlayers.length === 0 && (
              <div className="py-8 flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-gray-500">No players on the bench.</p>
                <p className="text-xs text-gray-600">Add players via the "Add Player" button.</p>
              </div>
            )}
            {grouped.map(({ group, players }) => {
              const c = GROUP_COLORS[group];
              return (
                <div key={group}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{GROUP_LABELS[group]}</span>
                  </div>
                  <div className="space-y-1.5">
                    {players.map((p) => (
                      <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onPick(p.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0d1829] border border-[#1E293B] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                      >
                        <div
                          className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white border border-white/10"
                          style={{ backgroundColor: kitColor }}
                        >
                          {p.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500">★ {p.rating}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${c.badge}`}>
                          {p.position}
                        </span>
                        <ArrowUp size={14} className="text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* drag handle */}
          <div className="h-5 flex items-center justify-center sm:hidden">
            <div className="w-10 h-1 rounded-full bg-[#334155]" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

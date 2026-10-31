import { motion } from "framer-motion";
import { Crown, Target, ArrowsLeftRight, Flag, Shield } from "@phosphor-icons/react";
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
  { key: "captainId", label: "Captain", short: "C", icon: <Crown size={14} className="text-amber-400" /> },
  { key: "viceCaptainId", label: "Vice-Captain", short: "VC", icon: <Shield size={14} className="text-gray-300" /> },
  { key: "penaltyTakerId", label: "Penalty Taker", short: "PK", icon: <Target size={14} className="text-red-400" /> },
  { key: "freeKickTakerId", label: "Free Kick", short: "FK", icon: <ArrowsLeftRight size={14} className="text-blue-400" /> },
  { key: "leftCornerTakerId", label: "Left Corner", short: "L-CK", icon: <Flag size={14} className="text-emerald-400" /> },
  { key: "rightCornerTakerId", label: "Right Corner", short: "R-CK", icon: <Flag size={14} className="text-purple-400" /> },
];

export default function TacticsAndResponsibilities({
  formations, currentFormationId, responsibilities, players, onFormationChange, onResponsibilityChange,
}: TacticsProps) {
  const starters = players.filter((p) => p.isStarter);
  const allPlayers = players;

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
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B132B] border border-[#1E293B]">
              <span className="w-6 h-6 rounded-md bg-[#1E293B] flex items-center justify-center">{icon}</span>
              <span className="text-xs text-gray-400 w-20">{label}</span>
              <select
                value={responsibilities[key] || ""}
                onChange={(e) => onResponsibilityChange(key, e.target.value || null)}
                className="flex-1 bg-transparent text-sm text-white outline-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {allPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.number})</option>
                ))}
              </select>
              {responsibilities[key] && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">{short}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual summary tags */}
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
        </div>
      </div>
    </div>
  );
}

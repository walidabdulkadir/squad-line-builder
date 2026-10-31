import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Target, Flag, ArrowsLeftRight, X, UserMinus } from "@phosphor-icons/react";
import { Player, Formation, MatchResponsibilities, positionGroup } from "../types";

export type PitchSize = "compact" | "standard" | "expanded";

interface PitchViewProps {
  formation: Formation;
  starters: (string | null)[];
  players: Player[];
  customPositions: Record<string, { x: number; y: number }>;
  responsibilities: MatchResponsibilities;
  kitColor: string;
  pitchSize: PitchSize;
  onPositionChange: (slotId: string, x: number, y: number) => void;
  onSlotClick: (slotId: string, slotIndex: number) => void;
}

function PitchSVG() {
  return (
    <svg viewBox="0 0 680 1050" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      {/* Grass stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={0} y={i * 105} width={680} height={105}
          fill={i % 2 === 0 ? "#059669" : "#047857"} opacity={0.9} />
      ))}
      {/* Outer boundary */}
      <rect x={20} y={30} width={640} height={990} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} rx={4} />
      {/* Halfway line */}
      <line x1={20} y1={525} x2={660} y2={525} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Center circle */}
      <circle cx={340} cy={525} r={80} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <circle cx={340} cy={525} r={4} fill="rgba(255,255,255,0.7)" />
      {/* Top penalty area */}
      <rect x={170} y={30} width={340} height={165} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Top goal area */}
      <rect x={245} y={30} width={190} height={60} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Top penalty arc */}
      <path d="M 260 195 A 80 80 0 0 1 420 195" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Bottom penalty area */}
      <rect x={170} y={855} width={340} height={165} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Bottom goal area */}
      <rect x={245} y={960} width={190} height={60} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Bottom penalty arc */}
      <path d="M 260 855 A 80 80 0 0 0 420 855" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Corner arcs */}
      <path d="M 20 42 A 12 12 0 0 1 32 30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <path d="M 648 30 A 12 12 0 0 1 660 42" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <path d="M 20 1008 A 12 12 0 0 0 32 1020" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <path d="M 648 1020 A 12 12 0 0 0 660 1008" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      {/* Goals */}
      <rect x={280} y={20} width={120} height={10} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      <rect x={280} y={1020} width={120} height={10} fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
    </svg>
  );
}

function PlayerNode({
  player, slotLabel, x, y, kitColor, responsibilities, pitchSize, onDrag, onClick,
}: {
  player: Player; slotLabel: string; x: number; y: number;
  kitColor: string; responsibilities: MatchResponsibilities;
  pitchSize: PitchSize;
  onDrag: (x: number, y: number) => void; onClick: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const pitchRef = useRef<HTMLElement | null>(null);

  const isCaptain = responsibilities.captainId === player.id;
  const isViceCaptain = responsibilities.viceCaptainId === player.id;
  const isPK = responsibilities.penaltyTakerId === player.id;
  const isFK = responsibilities.freeKickTakerId === player.id;
  const isLCK = responsibilities.leftCornerTakerId === player.id;
  const isRCK = responsibilities.rightCornerTakerId === player.id;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const parent = nodeRef.current?.parentElement;
    if (!parent) return;
    pitchRef.current = parent;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const newX = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const newY = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    onDrag(newX, newY);
  }, [dragging, onDrag]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    pitchRef.current = null;
  }, []);

  const group = positionGroup(player.position);
  const groupColors: Record<string, string> = {
    GK: "#F59E0B", DEF: "#3B82F6", MID: "#10B981", FWD: "#EF4444",
  };

  return (
    <div
      ref={nodeRef}
      className="absolute z-10 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        className="relative cursor-grab active:cursor-grabbing touch-none"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: dragging ? 1.15 : 1 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); onClick(); }}
      >
        {/* Jersey circle */}
        <div
          className={`rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/30 ${
            pitchSize === "compact" ? "w-8 h-8 text-[10px]" :
            pitchSize === "standard" ? "w-9 h-9 text-[11px] md:w-10 md:h-10 md:text-xs" :
            "w-10 h-10 text-xs md:w-11 md:h-11 md:text-sm"
          }`}
          style={{ backgroundColor: kitColor }}
        >
          {player.number}
        </div>
        {/* Badges */}
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {isCaptain && (
            <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[8px] font-bold text-amber-900 shadow">C</span>
          )}
          {isViceCaptain && !isCaptain && (
            <span className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[7px] font-bold text-gray-800 shadow">VC</span>
          )}
        </div>
        {isPK && (
          <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <Target size={9} className="text-white" />
          </span>
        )}
        {isFK && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <ArrowsLeftRight size={9} className="text-white" />
          </span>
        )}
      </motion.div>
      {/* Name plate */}
      <div className="mt-0.5 px-1 py-0.5 rounded bg-[#0B132B]/80 backdrop-blur-sm text-center">
        <p className={`text-white font-medium leading-tight whitespace-nowrap ${pitchSize === "compact" ? "text-[8px]" : "text-[9px] md:text-[10px]"}`}>{player.name.split(" ").pop()}</p>
        <span className={`font-semibold ${pitchSize === "compact" ? "text-[7px]" : "text-[8px]"}`} style={{ color: groupColors[group] }}>{slotLabel}</span>
      </div>

      {/* Quick action popover */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl p-2 flex gap-1"
          >
            <button onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
              className="w-7 h-7 rounded-md bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors">
              <UserMinus size={14} className="text-red-400" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
              className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/40 transition-colors">
              <Crown size={14} className="text-amber-400" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
              className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/40 transition-colors">
              <Flag size={14} className="text-blue-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptySlot({ x, y, label, pitchSize, onClick }: { x: number; y: number; label: string; pitchSize: PitchSize; onClick: () => void }) {
  return (
    <motion.button
      className="absolute z-10 flex flex-col items-center group"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
    >
      <div className={`rounded-full border-2 border-dashed border-white/40 flex items-center justify-center group-hover:border-emerald-400 group-hover:bg-emerald-400/10 transition-colors ${
        pitchSize === "compact" ? "w-8 h-8" :
        pitchSize === "standard" ? "w-9 h-9 md:w-10 md:h-10" :
        "w-10 h-10 md:w-11 md:h-11"
      }`}>
        <span className="text-white/50 text-base font-light group-hover:text-emerald-400">+</span>
      </div>
      <span className="mt-0.5 text-[8px] text-white/50 font-medium">{label}</span>
    </motion.button>
  );
}

const PITCH_MAX_W: Record<PitchSize, string> = {
  compact: "max-w-[340px]",
  standard: "max-w-[420px]",
  expanded: "max-w-[520px]",
};

export default function PitchView({
  formation, starters, players, customPositions, responsibilities, kitColor, pitchSize, onPositionChange, onSlotClick,
}: PitchViewProps) {
  return (
    <motion.div
      className={`relative mx-auto aspect-[68/105] rounded-xl overflow-hidden shadow-2xl border border-emerald-800/30 ${PITCH_MAX_W[pitchSize]}`}
      animate={{ maxWidth: pitchSize === "compact" ? 340 : pitchSize === "standard" ? 420 : 520 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <PitchSVG />
      {formation.slots.map((slot, i) => {
        const playerId = starters[i];
        const player = playerId ? players.find((p) => p.id === playerId) : null;
        const pos = customPositions[slot.id] || { x: slot.defaultX, y: slot.defaultY };

        if (player) {
          return (
            <PlayerNode
              key={slot.id}
              player={player}
              slotLabel={slot.label}
              x={pos.x}
              y={pos.y}
              kitColor={kitColor}
              responsibilities={responsibilities}
              pitchSize={pitchSize}
              onDrag={(nx, ny) => onPositionChange(slot.id, nx, ny)}
              onClick={() => onSlotClick(slot.id, i)}
            />
          );
        }
        return (
          <EmptySlot key={slot.id} x={pos.x} y={pos.y} label={slot.label} pitchSize={pitchSize} onClick={() => onSlotClick(slot.id, i)} />
        );
      })}
    </motion.div>
  );
}
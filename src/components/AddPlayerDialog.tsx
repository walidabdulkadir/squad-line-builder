import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Check } from "@phosphor-icons/react";
import { Player, Position } from "../types";

interface AddPlayerDialogProps {
  players: Player[];
  kitColor: string;
  onAddPlayer: (player: Player) => void;
  onClose: () => void;
}

const ALL_POSITIONS: Position[] = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "ST", "CF",
];

export default function AddPlayerDialog({ players, kitColor, onAddPlayer, onClose }: AddPlayerDialogProps) {
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formPosition, setFormPosition] = useState<Position>("ST");
  const [formFoot, setFormFoot] = useState<"left" | "right" | "both">("right");
  const [formRating, setFormRating] = useState("75");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!formName.trim()) return "Player name is required.";
    const num = parseInt(formNumber);
    if (isNaN(num) || num < 1 || num > 99) return "Jersey number must be between 1 and 99.";
    if (players.find((p) => p.number === num)) return `Jersey #${num} is already taken.`;
    const rating = parseInt(formRating);
    if (isNaN(rating) || rating < 1 || rating > 99) return "Rating must be between 1 and 99.";
    return "";
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: formName.trim(),
      number: parseInt(formNumber),
      position: formPosition,
      secondaryPositions: [],
      isStarter: false,
      pitchCoordinates: { x: 0, y: 0 },
      preferredFoot: formFoot,
      rating: parseInt(formRating) || 75,
    };
    onAddPlayer(newPlayer);
    setSuccess(true);
    setTimeout(() => {
      setFormName(""); setFormNumber(""); setFormPosition("ST");
      setFormFoot("right"); setFormRating("75"); setSuccess(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-md bg-[#111E38] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <UserPlus size={16} className="text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-white">Add Player</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
            <input
              autoFocus
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setError(""); }}
              placeholder="e.g. Lionel Messi"
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Number + Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Jersey #</label>
              <input
                value={formNumber}
                onChange={(e) => { setFormNumber(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="1–99"
                maxLength={2}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rating</label>
              <input
                value={formRating}
                onChange={(e) => { setFormRating(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="1–99"
                maxLength={2}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Position</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFormPosition(pos)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    formPosition === pos
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-[#0B132B] border-[#334155] text-gray-400 hover:text-white hover:border-[#475569]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred foot */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Preferred Foot</label>
            <div className="mt-1.5 flex gap-2">
              {(["right", "left", "both"] as const).map((foot) => (
                <button
                  key={foot}
                  onClick={() => setFormFoot(foot)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                    formFoot === foot
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-[#0B132B] border-[#334155] text-gray-400 hover:text-white"
                  }`}
                >
                  {foot}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Kit preview */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0B132B] border border-[#1E293B]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white/20"
              style={{ backgroundColor: kitColor }}>
              {formNumber || "#"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{formName || "Player Name"}</p>
              <p className="text-[10px] text-gray-500">{formPosition} · ★ {formRating}</p>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              success
                ? "bg-emerald-500 text-white"
                : "bg-emerald-500 hover:bg-emerald-400 text-white"
            }`}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Check size={16} /> Added!
                </motion.span>
              ) : (
                <motion.span key="add" className="flex items-center gap-2">
                  <UserPlus size={16} /> Add to Squad
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash, MagnifyingGlass, ShieldCheck, Check, Users } from "@phosphor-icons/react";
import { Player, Position, positionGroup } from "../types";

interface SquadManagerProps {
  players: Player[];
  teamName: string;
  kitColor: string;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onTeamNameChange: (name: string) => void;
  onKitColorChange: (color: string) => void;
  onClose: () => void;
}

const ALL_POSITIONS: Position[] = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "ST", "CF",
];
const KIT_COLORS = ["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
const GROUPS = ["ALL", "GK", "DEF", "MID", "FWD"];

export default function SquadManagerDialog({
  players, teamName, kitColor,
  onUpdatePlayer, onDeletePlayer,
  onTeamNameChange, onKitColorChange, onClose,
}: SquadManagerProps) {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formPosition, setFormPosition] = useState<Position>("ST");
  const [formFoot, setFormFoot] = useState<"left" | "right" | "both">("right");
  const [formRating, setFormRating] = useState("75");
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.number).includes(search);
      const matchesGroup = filterGroup === "ALL" || positionGroup(p.position) === filterGroup;
      return matchesSearch && matchesGroup;
    }).sort((a, b) => b.rating - a.rating);
  }, [players, search, filterGroup]);

  const startEdit = (p: Player) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormNumber(String(p.number));
    setFormPosition(p.position);
    setFormFoot(p.preferredFoot);
    setFormRating(String(p.rating));
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormError("");
  };

  const handleUpdate = () => {
    const num = parseInt(formNumber);
    if (!formName.trim()) { setFormError("Name is required."); return; }
    if (isNaN(num) || num < 1 || num > 99) { setFormError("Jersey # must be 1–99."); return; }
    const dup = players.find((p) => p.number === num && p.id !== editingId);
    if (dup) { setFormError(`#${num} is already taken by ${dup.name}.`); return; }

    const existing = players.find((p) => p.id === editingId);
    if (existing) {
      onUpdatePlayer({
        ...existing,
        name: formName.trim(),
        number: num,
        position: formPosition,
        preferredFoot: formFoot,
        rating: parseInt(formRating) || 75,
      });
    }
    cancelEdit();
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
        className="w-full max-w-2xl max-h-[88vh] bg-[#111E38] border border-[#334155] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Squad Manager</h2>
              <p className="text-[10px] text-gray-500">{players.length} players registered</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        {/* Team settings */}
        <div className="px-5 py-4 border-b border-[#1E293B] space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Team Name</label>
            <input
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kit Color</label>
            <div className="flex gap-2 mt-1.5">
              {KIT_COLORS.map((c) => (
                <button key={c} onClick={() => onKitColorChange(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${kitColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="px-5 py-3 flex gap-2 items-center border-b border-[#1E293B]">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or number…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-1">
            {GROUPS.map((g) => (
              <button key={g} onClick={() => setFilterGroup(g)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${filterGroup === g ? "bg-emerald-500 text-white" : "bg-[#1E293B] text-gray-400 hover:text-white"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Users size={32} className="text-gray-600" />
              <p className="text-sm text-gray-500">
                {players.length === 0 ? "No players yet. Use 'Add Player' to get started." : "No players match your search."}
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Player row */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0B132B] border border-[#1E293B] hover:border-[#334155] transition-colors">
                  <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white border border-white/10"
                    style={{ backgroundColor: kitColor }}>
                    {p.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.position} · {p.preferredFoot} foot · ★ {p.rating}</p>
                  </div>

                  {confirmDelete === p.id ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => { onDeletePlayer(p.id); setConfirmDelete(null); }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
                        Remove
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-gray-300 text-xs hover:bg-[#334155] transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => editingId === p.id ? cancelEdit() : startEdit(p)}
                        className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
                        <Pencil size={13} className="text-gray-400" />
                      </button>
                      <button onClick={() => setConfirmDelete(p.id)}
                        className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <Trash size={13} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {editingId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 p-4 rounded-xl bg-[#0d1829] border border-emerald-500/20 space-y-3">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Edit Player</p>

                        <div className="grid grid-cols-2 gap-2">
                          <input value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(""); }}
                            placeholder="Full name"
                            className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none col-span-2" />
                          <input value={formNumber} onChange={(e) => { setFormNumber(e.target.value.replace(/\D/g, "")); setFormError(""); }}
                            placeholder="Jersey #" maxLength={2}
                            className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
                          <input value={formRating} onChange={(e) => { setFormRating(e.target.value.replace(/\D/g, "")); setFormError(""); }}
                            placeholder="Rating 1–99" maxLength={2}
                            className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {ALL_POSITIONS.map((pos) => (
                            <button key={pos} onClick={() => setFormPosition(pos)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                formPosition === pos
                                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                  : "bg-[#0B132B] border-[#334155] text-gray-400 hover:text-white"
                              }`}>
                              {pos}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {(["right", "left", "both"] as const).map((foot) => (
                            <button key={foot} onClick={() => setFormFoot(foot)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                                formFoot === foot
                                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                  : "bg-[#0B132B] border-[#334155] text-gray-400 hover:text-white"
                              }`}>
                              {foot}
                            </button>
                          ))}
                        </div>

                        {formError && (
                          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>
                        )}

                        <div className="flex gap-2">
                          <button onClick={handleUpdate}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-colors">
                            <Check size={14} /> Save Changes
                          </button>
                          <button onClick={cancelEdit}
                            className="px-4 py-2 rounded-lg bg-[#334155] text-gray-300 text-sm hover:bg-[#475569] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

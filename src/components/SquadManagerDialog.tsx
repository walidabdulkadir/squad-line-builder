import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash, MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react";
import { Player, Position, positionGroup } from "../types";

interface SquadManagerProps {
  players: Player[];
  teamName: string;
  kitColor: string;
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onTeamNameChange: (name: string) => void;
  onKitColorChange: (color: string) => void;
  onClose: () => void;
}

const ALL_POSITIONS: Position[] = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST", "CF"];
const KIT_COLORS = ["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function SquadManagerDialog({
  players, teamName, kitColor, onAddPlayer, onUpdatePlayer, onDeletePlayer, onTeamNameChange, onKitColorChange, onClose,
}: SquadManagerProps) {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formPosition, setFormPosition] = useState<Position>("ST");
  const [formFoot, setFormFoot] = useState<"left" | "right" | "both">("right");
  const [formRating, setFormRating] = useState("75");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || String(p.number).includes(search);
      const matchesGroup = filterGroup === "ALL" || positionGroup(p.position) === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [players, search, filterGroup]);

  const resetForm = () => {
    setFormName(""); setFormNumber(""); setFormPosition("ST"); setFormFoot("right"); setFormRating("75");
    setAdding(false); setEditingId(null);
  };

  const startEdit = (p: Player) => {
    setEditingId(p.id); setAdding(false);
    setFormName(p.name); setFormNumber(String(p.number)); setFormPosition(p.position); setFormFoot(p.preferredFoot); setFormRating(String(p.rating));
  };

  const handleSubmit = () => {
    const num = parseInt(formNumber);
    if (!formName.trim() || isNaN(num) || num < 1 || num > 99) return;
    const dup = players.find((p) => p.number === num && p.id !== editingId);
    if (dup) return;

    if (editingId) {
      const existing = players.find((p) => p.id === editingId);
      if (existing) {
        onUpdatePlayer({ ...existing, name: formName.trim(), number: num, position: formPosition, preferredFoot: formFoot, rating: parseInt(formRating) || 75 });
      }
    } else {
      const newPlayer: Player = {
        id: `p_${Date.now()}`, name: formName.trim(), number: num, position: formPosition,
        secondaryPositions: [], isStarter: false, pitchCoordinates: { x: 0, y: 0 }, preferredFoot: formFoot, rating: parseInt(formRating) || 75,
      };
      onAddPlayer(newPlayer);
    }
    resetForm();
  };

  const groups = ["ALL", "GK", "DEF", "MID", "FWD"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] bg-[#111E38] border border-[#334155] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" /> Squad Manager
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Team settings */}
        <div className="p-4 border-b border-[#334155] space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-semibold">Team Name</label>
              <input value={teamName} onChange={(e) => onTeamNameChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-semibold">Kit Color</label>
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
        <div className="p-4 flex gap-2 items-center border-b border-[#334155]">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
          </div>
          <div className="flex gap-1">
            {groups.map((g) => (
              <button key={g} onClick={() => setFilterGroup(g)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${filterGroup === g ? "bg-emerald-500 text-white" : "bg-[#1E293B] text-gray-400 hover:text-white"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0B132B] border border-[#1E293B] hover:border-[#334155] transition-colors">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: kitColor }}>
                  {p.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{p.position} | {p.preferredFoot} foot | {p.rating} OVR</p>
                </div>
                {confirmDelete === p.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => { onDeletePlayer(p.id); setConfirmDelete(null); }}
                      className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/30">Confirm</button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-[10px] hover:bg-gray-600">No</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="w-7 h-7 rounded-md bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
                      <Pencil size={12} className="text-gray-400" />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)} className="w-7 h-7 rounded-md bg-[#1E293B] flex items-center justify-center hover:bg-red-500/20 transition-colors">
                      <Trash size={12} className="text-gray-400" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add/Edit form */}
        <AnimatePresence>
          {(adding || editingId) && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#334155]">
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">{editingId ? "Edit Player" : "Add New Player"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name"
                    className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
                  <input value={formNumber} onChange={(e) => setFormNumber(e.target.value.replace(/\D/g, ""))} placeholder="Jersey #"
                    className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
                  <select value={formPosition} onChange={(e) => setFormPosition(e.target.value as Position)}
                    className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none">
                    {ALL_POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                  <select value={formFoot} onChange={(e) => setFormFoot(e.target.value as "left" | "right" | "both")}
                    className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white focus:border-emerald-500 outline-none">
                    <option value="right">Right</option><option value="left">Left</option><option value="both">Both</option>
                  </select>
                  <input value={formRating} onChange={(e) => setFormRating(e.target.value.replace(/\D/g, ""))} placeholder="Rating (1-99)"
                    className="px-3 py-2 rounded-lg bg-[#0B132B] border border-[#334155] text-sm text-white placeholder-gray-600 focus:border-emerald-500 outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSubmit} className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                      {editingId ? "Update" : "Add"}
                    </button>
                    <button onClick={resetForm} className="px-3 py-2 rounded-lg bg-[#334155] text-gray-300 text-sm hover:bg-[#475569] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add button */}
        {!adding && !editingId && (
          <div className="p-4 border-t border-[#334155]">
            <button onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 font-semibold hover:bg-emerald-500/20 transition-colors">
              <Plus size={16} /> Add Player
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

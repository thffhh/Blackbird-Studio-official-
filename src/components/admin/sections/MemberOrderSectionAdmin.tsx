import React, { useState, useEffect } from 'react';
import { Member } from '../../../types/index.ts';
import { sortMembersByOrder, moveMember } from '../../../utils/memberOrder.ts';
import { getRankBadgeStyle } from '../../../utils/ranks.ts';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  Save, 
  Check, 
  GripVertical,
  RotateCcw,
  Sparkles,
  Loader2
} from 'lucide-react';

interface MemberOrderSectionAdminProps {
  members: Member[];
  onSaveOrder: (orderedIds: string[]) => Promise<void>;
}

export const MemberOrderSectionAdmin: React.FC<MemberOrderSectionAdminProps> = ({
  members,
  onSaveOrder
}) => {
  const [list, setList] = useState<Member[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setList(sortMembersByOrder(members));
    setHasChanges(false);
  }, [members]);

  const handleMove = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const updated = moveMember(list, id, direction);
    setList(updated);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    setList(sortMembersByOrder(members));
    setHasChanges(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const orderedIds = list.map((m) => m.id);
      await onSaveOrder(orderedIds);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save member ordering');
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop support
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...list];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    
    // update displayOrder
    const reindexed = newList.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setList(reindexed);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-wider">
            Manage Member Display Order
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Set the exact sequence in which voice members appear on the public website. Drag to reorder or use quick buttons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              hasChanges 
                ? 'bg-amber-500 text-black hover:brightness-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Order Saved!' : 'Save Sequence Permanently'}</span>
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            The public members gallery strictly displays this exact list order (never sorted alphabetically or by date).
          </span>
        </div>
        <span className="text-amber-400 font-mono text-[11px] whitespace-nowrap">
          {list.length} Members in Roster
        </span>
      </div>

      {/* Reorderable List */}
      <div className="space-y-2.5">
        {list.map((m, index) => {
          const rankStyle = getRankBadgeStyle(m.rank);
          const isFirst = index === 0;
          const isLast = index === list.length - 1;

          return (
            <div
              key={m.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-3.5 rounded-2xl bg-[#101015] border transition-all flex items-center justify-between gap-4 ${
                draggedIndex === index
                  ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_25px_rgba(212,175,55,0.3)] scale-[1.01]'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Left Drag & Member Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div 
                  className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-amber-400 p-1"
                  title="Drag up or down to reorder"
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-amber-300 shrink-0">
                  {index + 1}
                </div>

                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover border border-amber-500/30 shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{m.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                      Rank {m.rank}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {m.hobbies || m.bio}
                  </div>
                </div>
              </div>

              {/* Right Quick Ordering Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(m.id, 'top')}
                  disabled={isFirst}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move to Top (#1)"
                >
                  <ArrowUpToLine className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(m.id, 'up')}
                  disabled={isFirst}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Up 1 Slot"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(m.id, 'down')}
                  disabled={isLast}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Down 1 Slot"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(m.id, 'bottom')}
                  disabled={isLast}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move to Bottom"
                >
                  <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

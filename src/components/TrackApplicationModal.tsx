import React, { useState } from 'react';
import { trackApplication } from '../services/api.ts';
import { X, Search, CheckCircle2, Clock, XCircle, Loader2, Sparkles } from 'lucide-react';

interface TrackApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackApplicationModal: React.FC<TrackApplicationModalProps> = ({ isOpen, onClose }) => {
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<any>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim()) return;

    setError('');
    setRecord(null);
    setLoading(true);

    try {
      const data = await trackApplication(appId.trim());
      setRecord(data);
    } catch (err: any) {
      setError(err.message || 'Application not found. Please double check your Application ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#0f0f14] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close status tracker modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-heading font-black text-white uppercase tracking-wide">
            Track Application
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Enter your unique Application ID (e.g. BBS-2026-1042) to check the status of your voice audition submission.
        </p>

        {/* Input Form */}
        <form onSubmit={handleTrack} className="mb-6 flex gap-2">
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="e.g. BBS-2026-1042"
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400 uppercase font-mono"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !appId.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {record && (
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Applicant</span>
                <span className="text-base font-bold text-white">{record.fullName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Desired Rank</span>
                <span className="text-sm font-semibold text-amber-300">Rank {record.desiredRank}</span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-3">
              {record.status === 'approved' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approved & Accepted</span>
                </div>
              )}
              {record.status === 'rejected' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Not Accepted</span>
                </div>
              )}
              {record.status === 'pending' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Under Review (Pending)</span>
                </div>
              )}
            </div>

            {/* Detailed Message */}
            <p className="text-xs sm:text-sm text-zinc-300 bg-black/40 p-3.5 rounded-lg border border-zinc-800 leading-relaxed">
              {record.statusMessage}
            </p>

            <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
              <span>Submitted: {new Date(record.submittedAt).toLocaleDateString()}</span>
              <span>BlackBird Studio Auditions</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

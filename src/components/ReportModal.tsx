import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useNritya } from '../context/NrityaContext';
import { submitReport } from '../services/nrityaService';

interface ReportModalProps {
  target: {
    type: 'post' | 'user' | 'event' | 'gathering';
    id: string;
    title: string;
  } | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ target, onClose }) => {
  const { currentUserProfile, setOpenAuthModal, showToast } = useNritya();
  const [reason, setReason] = useState('Disrespectful or off-topic content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      setOpenAuthModal(true);
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        reporter: currentUserProfile,
        targetType: target.type,
        targetId: target.id,
        targetTitle: target.title,
        reason,
        details,
      });
      showToast('Report submitted to NRITYA moderators.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Could not submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1E171D]/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl max-w-md w-full p-6 relative space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close report dialog"
          className="absolute top-4 right-4 p-2 rounded-lg text-[#5A4A57] hover:bg-[#F3EDE3]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#4A1D3D]">
          <Flag className="w-4 h-4" />
          <h3 className="font-display text-2xl font-semibold">Report for Moderation</h3>
        </div>
        <p className="text-xs text-[#5A4A57]">
          Target: <span className="font-medium text-[#1E171D]">{target.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            >
              <option>Disrespectful or off-topic content</option>
              <option>Misleading credentials or false claims</option>
              <option>Spam or unauthorized solicitation</option>
              <option>Harassment or unsafe behavior</option>
              <option>Other moderation concern</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A4A57] mb-1.5">
              Additional Context
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share details for the moderation team..."
              className="w-full px-3 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#5A4A57] hover:text-[#1E171D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#4A1D3D] text-[#FAF7F2] text-sm font-medium hover:bg-[#36132C] disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-5 space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

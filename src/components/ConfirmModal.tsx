import type React from 'react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useDialogA11y } from './useDialogA11y';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '삭제하기',
  cancelText = '취소',
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(isOpen, onCancel, dialogRef);
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="confirm-modal-overlay"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          exit={{ opacity: 0, y: 8 }}
          className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-[#E9ECEF]"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isDestructive ? 'bg-[#FEEBEC] text-[#EB4D4B]' : 'bg-[#4834D4]/10 text-[#4834D4]'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 id="confirm-modal-title" className="text-base font-black text-[#1E272E]">
                {title}
              </h3>
            </div>
            <button
              type="button"
              aria-label="닫기"
              onClick={onCancel}
              className="p-1.5 text-[#636E72] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#636E72] mb-6 leading-relaxed whitespace-pre-line pl-12.5">{message}</p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9ECEF]">
            <button
              id="confirm-modal-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-[#636E72] bg-[#F1F3F5] hover:bg-[#E9ECEF] rounded-full transition-colors"
            >
              {cancelText}
            </button>
            <button
              id="confirm-modal-action-btn"
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-xs font-bold text-white rounded-full transition-colors ${
                isDestructive ? 'bg-[#EB4D4B] hover:bg-[#d63b39]' : 'bg-[#4834D4] hover:bg-[#3c2ab9]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

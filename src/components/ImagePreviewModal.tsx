import React, { useEffect } from 'react';
import { X, Calendar, HardDrive, Shield } from 'lucide-react';
import { JournalImage } from '../types';

interface ImagePreviewModalProps {
  image: JournalImage | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const sizeKb = Math.round(image.size / 1024);
  const sizeMb = (image.size / (1024 * 1024)).toFixed(2);
  const formattedSize = image.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full bg-surface-card border border-theme rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme bg-surface-secondary">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <h3 id="preview-modal-title" className="text-xs font-semibold text-theme-primary truncate">
              {image.name || 'Private Memory Photo'}
            </h3>
            <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded-full border border-accent/30 shrink-0">
              User-Isolated Storage
            </span>
          </div>

          <button
            id="image-preview-close-btn"
            onClick={onClose}
            aria-label="Close memory preview"
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto bg-black/40 flex items-center justify-center p-4 min-h-[240px]">
          <img 
            src={image.url} 
            alt={image.name || "Private memory photo"} 
            className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Footer Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-theme text-[11px] font-mono text-theme-muted bg-surface-secondary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-accent" />
              <span>{formattedSize}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{new Date(image.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>
          </div>

          <span className="text-[10px] text-theme-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-theme text-theme-primary font-mono text-[10px]">Esc</kbd> to dismiss
          </span>
        </div>
      </div>
    </div>
  );
};

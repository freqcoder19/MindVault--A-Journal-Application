import React from 'react';

interface MindVaultMarkProps {
  className?: string;
  size?: number;
}

/**
 * Official MindVault M-Shaped Brand Mark
 * Combines the letter 'M' (Mind) with a vaulted inner archway (Vault).
 * Minimalist, elegant, and personal.
 */
export const MindVaultMark: React.FC<MindVaultMarkProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      aria-label="MindVault Logo"
    >
      {/* Outer elegant M contour: two upright pillars descending into a central graceful apex */}
      <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h.5a1.5 1.5 0 0 1 1.35.85L12 14l4.65-9.15A1.5 1.5 0 0 1 18 4h.5A1.5 1.5 0 0 1 20 5.5V20" />
      {/* Vaulted sanctuary inner arch representing the vault of the mind */}
      <path d="M8.5 20v-4a3.5 3.5 0 0 1 7 0v4" />
    </svg>
  );
};

interface MindVaultBrandProps {
  className?: string;
  markClassName?: string;
  showSubtitle?: boolean;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Reusable MindVault Brand Lockup (Logo + Wordmark + Category)
 */
export const MindVaultBrand: React.FC<MindVaultBrandProps> = ({
  className = "",
  markClassName = "text-accent",
  showSubtitle = true,
  category = "Journal",
  size = "md",
  onClick,
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const markPixelSizes = {
    sm: 16,
    md: 20,
    lg: 26,
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
    >
      <div className={`${iconSizes[size]} rounded-xl bg-surface-secondary border border-theme flex items-center justify-center shadow-xs transition-colors shrink-0`}>
        <MindVaultMark size={markPixelSizes[size]} className={markClassName} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-display font-bold ${titleSizes[size]} tracking-tight text-theme-primary`}>
            Mind<span className="text-accent">Vault</span>
          </span>
          {category && (
            <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-surface-secondary text-accent border border-accent/30 font-medium">
              {category}
            </span>
          )}
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-theme-muted font-serif-body italic">
            Personal Gemini Journal
          </p>
        )}
      </div>
    </div>
  );
};

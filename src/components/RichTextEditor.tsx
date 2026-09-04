import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Type, 
  Palette, 
  ChevronDown 
} from 'lucide-react';
import { sanitizeHtml, isContentEmpty } from '../lib/richText';

interface RichTextEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const FONT_FAMILIES = [
  { label: 'Sans (Clean)', value: 'ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { label: 'Serif (Editorial)', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { label: 'Typewriter', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: '14px (Small)', value: '14px', sizeCmd: '2' },
  { label: '16px (Normal)', value: '16px', sizeCmd: '3' },
  { label: '18px (Medium)', value: '18px', sizeCmd: '4' },
  { label: '20px (Large)', value: '20px', sizeCmd: '5' },
  { label: '24px (XL)', value: '24px', sizeCmd: '6' },
  { label: '28px (Title)', value: '28px', sizeCmd: '7' },
];

const TEXT_COLORS = [
  { label: 'Default', value: 'inherit', hex: 'currentColor', bgClass: 'bg-theme-primary' },
  { label: 'Slate', value: '#64748b', hex: '#64748b', bgClass: 'bg-slate-500' },
  { label: 'Teal Sage', value: '#0d9488', hex: '#0d9488', bgClass: 'bg-teal-600' },
  { label: 'Indigo', value: '#4f46e5', hex: '#4f46e5', bgClass: 'bg-indigo-600' },
  { label: 'Warm Amber', value: '#d97706', hex: '#d97706', bgClass: 'bg-amber-600' },
  { label: 'Soft Rose', value: '#e11d48', hex: '#e11d48', bgClass: 'bg-rose-600' },
  { label: 'Forest', value: '#059669', hex: '#059669', bgClass: 'bg-emerald-600' },
  { label: 'Violet', value: '#7c3aed', hex: '#7c3aed', bgClass: 'bg-violet-600' },
];

const ALIGN_OPTIONS = [
  { label: 'Left', value: 'left', icon: AlignLeft, command: 'justifyLeft' },
  { label: 'Center', value: 'center', icon: AlignCenter, command: 'justifyCenter' },
  { label: 'Right', value: 'right', icon: AlignRight, command: 'justifyRight' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Unpack your raw thoughts, sensations, vulnerabilities, or insights freely...",
  className = "",
  id = "journal-rich-editor",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);

  // Active toolbar formatting state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberList, setIsNumberList] = useState(false);
  const [currentAlign, setCurrentAlign] = useState<'left' | 'center' | 'right'>('left');
  const [currentFont, setCurrentFont] = useState(FONT_FAMILIES[0].label);
  const [currentSize, setCurrentSize] = useState('16px');
  const [currentColor, setCurrentColor] = useState('Default');

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'font' | 'size' | 'color' | 'align' | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Sync value into contentEditable when value prop changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      // Only overwrite if not focused or if content is significantly different (e.g. entry switch or clear)
      if (value !== currentHtml && (!isFocusedRef.current || value === '' || currentHtml === '')) {
        editorRef.current.innerHTML = value ? sanitizeHtml(value) : '';
        setIsEmpty(isContentEmpty(value));
      }
    }
  }, [value]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Check state of selection in editor
  const updateToolbarState = useCallback(() => {
    if (!editorRef.current) return;
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsBulletList(document.queryCommandState('insertUnorderedList'));
      setIsNumberList(document.queryCommandState('insertOrderedList'));

      if (document.queryCommandState('justifyCenter')) {
        setCurrentAlign('center');
      } else if (document.queryCommandState('justifyRight')) {
        setCurrentAlign('right');
      } else {
        setCurrentAlign('left');
      }

      setIsEmpty(isContentEmpty(editorRef.current.innerHTML));
    } catch {
      // Browser safety fallback
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setIsEmpty(isContentEmpty(html));
      onChange(html);
      updateToolbarState();
    }
  };

  // Execute standard formatting commands on active text selection
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    // Enable CSS styling where available
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // Ignore fallback
    }
    document.execCommand(command, false, value);
    handleInput();
    updateToolbarState();
  };

  // Font family handler
  const handleSelectFont = (fontItem: typeof FONT_FAMILIES[0]) => {
    executeCommand('fontName', fontItem.value);
    setCurrentFont(fontItem.label);
    setOpenDropdown(null);
  };

  // Font size handler: safely wrap selection in specified CSS font-size
  const handleSelectSize = (sizeItem: typeof FONT_SIZES[0]) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    executeCommand('fontSize', sizeItem.sizeCmd);
    // Replace font[size] tags with exact CSS font-size
    if (editorRef.current) {
      const fontTags = editorRef.current.querySelectorAll(`font[size="${sizeItem.sizeCmd}"]`);
      fontTags.forEach((el) => {
        el.removeAttribute('size');
        (el as HTMLElement).style.fontSize = sizeItem.value;
      });
      handleInput();
    }
    setCurrentSize(sizeItem.value);
    setOpenDropdown(null);
  };

  // Text color handler
  const handleSelectColor = (colorItem: typeof TEXT_COLORS[0]) => {
    executeCommand('foreColor', colorItem.value === 'inherit' ? 'currentColor' : colorItem.value);
    setCurrentColor(colorItem.label);
    setOpenDropdown(null);
  };

  // Alignment handler
  const handleSelectAlign = (alignItem: typeof ALIGN_OPTIONS[0]) => {
    executeCommand(alignItem.command);
    setCurrentAlign(alignItem.value as any);
    setOpenDropdown(null);
  };

  // Handle paste to sanitize HTML and prevent unauthorized styling/scripts
  const handlePaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (html) {
      e.preventDefault();
      const sanitized = sanitizeHtml(html);
      document.execCommand('insertHTML', false, sanitized);
      handleInput();
    } else if (text) {
      // Plain text will paste naturally
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`border border-theme rounded-2xl bg-surface-secondary transition-all focus-within:border-accent overflow-visible ${className}`}
    >
      {/* ========================================================== */}
      {/* ATTACHED RICH-TEXT TOOLBAR                                 */}
      {/* [Font ▼] [Size ▼] [Text Color ▼] [B] [I] [U] [Align ▼]   */}
      {/* [• List] [1. List] [Undo] [Redo]                          */}
      {/* ========================================================== */}
      <div 
        className="flex flex-wrap items-center gap-1.5 p-2 bg-surface-card/90 border-b border-theme rounded-t-2xl text-xs text-theme-secondary select-none"
        role="toolbar"
        aria-label="Formatting options"
      >
        {/* 1. [Font ▼] */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenDropdown(openDropdown === 'font' ? null : 'font')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              openDropdown === 'font' 
                ? 'bg-accent/15 border-accent text-accent font-semibold' 
                : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
            }`}
            title="Font Family"
          >
            <Type className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="max-w-[85px] truncate">{currentFont}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {openDropdown === 'font' && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-surface-card border border-theme rounded-xl shadow-lg p-1.5 z-30 space-y-0.5 animate-fade-in">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectFont(font)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-surface-secondary text-theme-primary transition-colors flex items-center justify-between"
                  style={{ fontFamily: font.value }}
                >
                  <span>{font.label}</span>
                  {currentFont === font.label && <span className="text-accent text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. [Size ▼] */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenDropdown(openDropdown === 'size' ? null : 'size')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              openDropdown === 'size' 
                ? 'bg-accent/15 border-accent text-accent font-semibold' 
                : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
            }`}
            title="Font Size"
          >
            <span>{currentSize}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'size' && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-surface-card border border-theme rounded-xl shadow-lg p-1.5 z-30 space-y-0.5 animate-fade-in">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectSize(size)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-surface-secondary text-theme-primary transition-colors flex items-center justify-between"
                >
                  <span style={{ fontSize: size.value }}>{size.label}</span>
                  {currentSize === size.value && <span className="text-accent text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. [Text Color ▼] */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              openDropdown === 'color' 
                ? 'bg-accent/15 border-accent text-accent font-semibold' 
                : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
            }`}
            title="Text Color"
          >
            <Palette className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="hidden sm:inline">{currentColor}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'color' && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-surface-card border border-theme rounded-xl shadow-lg p-2 z-30 space-y-1 animate-fade-in">
              <div className="text-[10px] uppercase font-mono text-theme-muted px-1">Choose Color</div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectColor(c)}
                    className="w-8 h-8 rounded-lg border border-theme flex items-center justify-center hover:scale-105 transition-transform"
                    title={c.label}
                  >
                    <span 
                      className="w-4 h-4 rounded-full border border-black/20 shadow-xs" 
                      style={{ backgroundColor: c.hex === 'currentColor' ? 'var(--color-theme-primary, #ffffff)' : c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-theme/80 mx-0.5 hidden sm:block" />

        {/* 4. [B] Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('bold')}
          className={`p-1.5 px-2 rounded-lg border text-xs font-bold transition-colors ${
            isBold
              ? 'bg-accent/20 border-accent text-accent'
              : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* 5. [I] Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('italic')}
          className={`p-1.5 px-2 rounded-lg border text-xs italic transition-colors ${
            isItalic
              ? 'bg-accent/20 border-accent text-accent'
              : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* 6. [U] Underline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('underline')}
          className={`p-1.5 px-2 rounded-lg border text-xs underline transition-colors ${
            isUnderline
              ? 'bg-accent/20 border-accent text-accent'
              : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-theme/80 mx-0.5 hidden sm:block" />

        {/* 7. [Align ▼] */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenDropdown(openDropdown === 'align' ? null : 'align')}
            className={`flex items-center gap-1 p-1.5 px-2 rounded-lg border text-xs transition-colors ${
              openDropdown === 'align'
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
            }`}
            title="Text Alignment"
          >
            {currentAlign === 'center' ? (
              <AlignCenter className="w-3.5 h-3.5" />
            ) : currentAlign === 'right' ? (
              <AlignRight className="w-3.5 h-3.5" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {openDropdown === 'align' && (
            <div className="absolute left-0 top-full mt-1 w-32 bg-surface-card border border-theme rounded-xl shadow-lg p-1.5 z-30 space-y-0.5 animate-fade-in">
              {ALIGN_OPTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectAlign(item)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-surface-secondary text-theme-primary transition-colors flex items-center gap-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-accent" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. [• List] Bulleted list */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertUnorderedList')}
          className={`flex items-center gap-1 p-1.5 px-2.5 rounded-lg border text-xs transition-colors ${
            isBulletList
              ? 'bg-accent/20 border-accent text-accent font-semibold'
              : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
          }`}
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">List</span>
        </button>

        {/* 9. [1. List] Numbered list */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertOrderedList')}
          className={`flex items-center gap-1 p-1.5 px-2.5 rounded-lg border text-xs transition-colors ${
            isNumberList
              ? 'bg-accent/20 border-accent text-accent font-semibold'
              : 'bg-surface-secondary border-theme hover:text-theme-primary hover:border-theme/80'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">Numbered</span>
        </button>

        <div className="h-4 w-[1px] bg-theme/80 mx-0.5 hidden sm:block" />

        {/* 10. [Undo] */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('undo')}
          className="p-1.5 px-2 rounded-lg bg-surface-secondary border border-theme hover:text-theme-primary hover:border-theme/80 text-theme-secondary transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        {/* 11. [Redo] */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('redo')}
          className="p-1.5 px-2 rounded-lg bg-surface-secondary border border-theme hover:text-theme-primary hover:border-theme/80 text-theme-secondary transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

      </div>

      {/* ========================================================== */}
      {/* EDITABLE WRITING CANVAS                                    */}
      {/* ========================================================== */}
      <div className="relative p-4 min-h-[220px]">
        {/* Natural Placeholder Overlay */}
        {isEmpty && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none text-theme-muted font-serif-body text-base italic leading-relaxed select-none">
            {placeholder}
          </div>
        )}

        <div
          id={id}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            updateToolbarState();
          }}
          onInput={handleInput}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onPaste={handlePaste}
          className="outline-none text-theme-primary font-serif-body text-base leading-relaxed min-h-[190px] 
                     [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 
                     [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 
                     [&_li]:my-1 
                     [&_b]:font-bold [&_strong]:font-bold 
                     [&_i]:italic [&_em]:italic 
                     [&_u]:underline
                     [&_p]:my-1"
        />
      </div>
    </div>
  );
};

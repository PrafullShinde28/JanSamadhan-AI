import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, HelpCircle, Loader2, X } from 'lucide-react';

/**
 * Reusable modal for confirming destructive/important actions or prompting for text inputs.
 * Replaces window.alert, window.confirm, and window.prompt across the application.
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  iconType = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
  isPrompt = false,
  promptLabel = '',
  promptPlaceholder = '',
  promptInitialValue = '',
  promptRequired = true,
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState(promptInitialValue);
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(promptInitialValue);
      // Auto focus appropriate element
      setTimeout(() => {
        if (isPrompt && inputRef.current) {
          inputRef.current.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, promptInitialValue, isPrompt]);

  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (isPrompt) {
      if (promptRequired && !inputValue.trim()) return;
      onConfirm?.(inputValue.trim());
    } else {
      onConfirm?.();
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-danger text-white hover:bg-danger/90 shadow-danger/20';
      case 'warning':
        return 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20';
      case 'primary':
      default:
        return 'bg-primary text-white hover:bg-primary-hover shadow-primary/20';
    }
  };

  const getIcon = () => {
    switch (iconType) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-danger shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <HelpCircle className="w-6 h-6 text-primary shrink-0" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white border border-slate-200 rounded-card shadow-premium w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              {getIcon()}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-outfit text-sm sm:text-base font-extrabold text-slate-900">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit}>
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words font-medium">
              {message}
            </p>

            {isPrompt && (
              <div className="space-y-1.5 pt-1">
                {promptLabel && (
                  <label className="block text-xs font-bold text-slate-700">
                    {promptLabel} {promptRequired && <span className="text-danger">*</span>}
                  </label>
                )}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={promptPlaceholder}
                  required={promptRequired}
                  rows={3}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition resize-none font-medium"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-button hover:bg-slate-100 transition shadow-xs disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              disabled={isLoading || (isPrompt && promptRequired && !inputValue.trim())}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-button transition shadow-sm disabled:opacity-50 cursor-pointer ${getConfirmButtonClasses()}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

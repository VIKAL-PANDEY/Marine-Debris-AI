import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  title,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-1.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-1.5';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          aria-label="Info"
          className="text-[#93A8BC] hover:text-[#1BDFC8] transition-colors p-0.5 rounded cursor-help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none w-60 p-2 text-[11px] font-sans rounded-md bg-[#0F1A2C] text-[#93A8BC] border border-[#93A8BC]/30 shadow-xl backdrop-blur-sm ${getPositionClasses()}`}
        >
          {title && (
            <div className="font-tech font-bold uppercase tracking-wider text-[10px] text-[#FFFFFF] mb-0.5 border-b border-[#93A8BC]/20 pb-0.5">
              {title}
            </div>
          )}
          <p className="leading-relaxed text-[#93A8BC]">{content}</p>
        </div>
      )}
    </div>
  );
};

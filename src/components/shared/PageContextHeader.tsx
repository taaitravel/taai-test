import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Gate 8 Slice 2A — Page context header (presentational scaffold).
 *
 * Renders a secondary header row *below* the global MobileNavigation.
 * In 2A this component is exported and typechecked but not yet adopted by
 * pages; page-by-page adoption happens in Slice 2B+.
 */
export interface PageContextHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const PageContextHeader: React.FC<PageContextHeaderProps> = ({
  title,
  subtitle,
  left,
  right,
  className,
}) => {
  if (!title && !subtitle && !left && !right) return null;
  return (
    <div
      className={cn(
        'w-full border-b border-border/40 bg-background/60 backdrop-blur-sm',
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        {left && <div className="flex items-center shrink-0">{left}</div>}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-base font-semibold text-foreground truncate">{title}</div>
          )}
          {subtitle && (
            <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
          )}
        </div>
        {right && <div className="flex items-center gap-1 shrink-0">{right}</div>}
      </div>
    </div>
  );
};

export default PageContextHeader;
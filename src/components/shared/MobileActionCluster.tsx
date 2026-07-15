import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartIcon } from './CartIcon';
import { NotificationCenter } from './NotificationCenter';
import type { OverflowItem, PrimaryAction } from '@/lib/chrome/route-config';
import { cn } from '@/lib/utils';

/**
 * Gate 8 Slice 2A — Mobile right-zone action cluster.
 *
 * Contract:
 *  - Renders AT MOST 2 controls: one optional primary + one More trigger.
 *  - Primary is one of: 'cart' | 'notifications' | 'none'.
 *  - More opens a shadcn DropdownMenu whose items come from `overflow`.
 *  - Never renders Cart + Notifications side by side. Never renders 3 icons.
 */
export interface MobileActionClusterProps {
  primary: PrimaryAction;
  overflow: OverflowItem[];
  className?: string;
}

export const MobileActionCluster: React.FC<MobileActionClusterProps> = ({
  primary,
  overflow,
  className,
}) => {
  const navigate = useNavigate();

  const renderPrimary = () => {
    if (primary === 'cart') return <CartIcon />;
    if (primary === 'notifications') return <NotificationCenter />;
    return null;
  };

  // Defensive: never let the visible primary re-appear inside More.
  const filteredOverflow = overflow.filter((item) => {
    if (primary === 'cart' && item.id === 'cart') return false;
    if (primary === 'notifications' && item.id === 'notifications') return false;
    return true;
  });
  const hasOverflow = filteredOverflow.length > 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {renderPrimary()}
      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="More options"
              className="h-10 w-10 rounded-full text-foreground hover:bg-accent"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={5}
            className="bg-card/95 backdrop-blur-md border-border text-card-foreground min-w-[180px]"
          >
            {filteredOverflow.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => {
                  if (item.to) navigate(item.to);
                }}
                className="cursor-pointer hover:bg-accent focus:bg-accent transition-colors"
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default MobileActionCluster;
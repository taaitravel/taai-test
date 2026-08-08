import { AGENT_ROLES, type AgentKey } from '@/lib/taai/brand-identity';
import { cn } from '@/lib/utils';

interface AgentChipProps {
  agent: AgentKey;
  surface?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Traveler-visible identity chip for approved traveler-facing agents.
 *
 * Hard rule: if the AGENT_ROLES entry is not travelerFacing, this component
 * renders nothing. Internal-only agents must never appear in traveler UI.
 */
export const AgentChip = ({ agent, surface, onClick, className, compact }: AgentChipProps) => {
  const role = AGENT_ROLES[agent];
  if (!role || !role.travelerFacing) return null;
  if (role.visibility === 'contextual' && (!surface || !role.allowedSurfaces.includes(surface))) {
    return null;
  }

  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur-sm',
        'px-3 py-1.5 text-left transition-colors',
        onClick && 'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className,
      )}
      aria-label={`${role.name}, ${role.role}`}
      type={onClick ? 'button' : undefined}
    >
      <span
        aria-hidden
        className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center"
      >
        {role.name.charAt(0)}
      </span>
      <span className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-semibold text-foreground truncate">{role.name}</span>
        {!compact && (
          <span className="text-[10px] text-muted-foreground truncate">{role.role}</span>
        )}
      </span>
    </Wrapper>
  );
};

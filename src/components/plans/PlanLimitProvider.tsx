import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UpgradeModal, type PlanLimitCode } from './UpgradeModal';
import { planLimitCodeFromText } from '../../../supabase/functions/_shared/plan-limits';

const LIMIT_CODES: PlanLimitCode[] = ['PLAN_LIMIT_ITINERARIES', 'PLAN_LIMIT_SHARING', 'PLAN_LIMIT_AI'];

interface PlanLimitContextValue {
  openUpgrade: (code?: PlanLimitCode | null) => void;
  reportError: (error: unknown) => boolean;
}

const PlanLimitContext = createContext<PlanLimitContextValue | undefined>(undefined);

export const PlanLimitProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<PlanLimitCode | null>(null);
  const [params] = useSearchParams();

  const openUpgrade = useCallback((next?: PlanLimitCode | null) => {
    setCode(next ?? null);
    setOpen(true);
  }, []);

  const reportError = useCallback((error: unknown) => {
    const message = error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';
    const found = planLimitCodeFromText(message);
    if (!found) return false;
    openUpgrade(found);
    return true;
  }, [openUpgrade]);

  useEffect(() => {
    const limit = params.get('limit');
    if (limit && (LIMIT_CODES as string[]).includes(limit)) {
      openUpgrade(limit as PlanLimitCode);
    }
  }, [params, openUpgrade]);

  const value = useMemo(() => ({ openUpgrade, reportError }), [openUpgrade, reportError]);

  return (
    <PlanLimitContext.Provider value={value}>
      {children}
      <UpgradeModal open={open} code={code} onOpenChange={setOpen} />
    </PlanLimitContext.Provider>
  );
};

export const usePlanLimit = () => {
  const context = useContext(PlanLimitContext);
  if (!context) throw new Error('usePlanLimit must be used within PlanLimitProvider');
  return context;
};

/** For hooks that also render in tests outside the provider. */
export const useOptionalPlanLimit = () => useContext(PlanLimitContext);

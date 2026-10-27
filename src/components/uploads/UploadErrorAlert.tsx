import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { UploadNotice } from '@/lib/uploads/notices';

interface UploadErrorAlertProps {
  notice: UploadNotice | null;
  onDismiss: () => void;
}

/** iOS-style alert: a short title, one explanation, and a single OK button. */
export const UploadErrorAlert = ({ notice, onDismiss }: UploadErrorAlertProps) => (
  <AlertDialog open={notice !== null} onOpenChange={(open) => { if (!open) onDismiss(); }}>
    <AlertDialogContent className="max-w-[270px] gap-0 rounded-2xl border-border/80 p-0 text-center sm:rounded-2xl">
      <AlertDialogHeader className="space-y-1.5 px-4 pb-4 pt-5 text-center sm:text-center">
        <AlertDialogTitle className="text-center text-[17px] font-semibold leading-snug">
          {notice?.title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-center text-[13px] leading-snug text-muted-foreground">
          {notice?.message}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="border-t border-border p-0 sm:flex-col sm:space-x-0">
        <AlertDialogAction className="h-11 w-full rounded-none rounded-b-2xl bg-transparent text-[17px] font-semibold text-primary shadow-none hover:bg-muted">
          OK
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

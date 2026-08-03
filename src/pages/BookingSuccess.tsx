import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Receipt, Download } from 'lucide-react';
import { useBookingCheckout } from '@/hooks/useBookingCheckout';
import { supabase } from '@/integrations/supabase/client';

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { confirmBooking } = useBookingCheckout();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    const confirm = async () => {
      try {
        const data = await confirmBooking(sessionId);
        setBookingData(data);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    confirm();
  }, [sessionId]);

  const handleDownload = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      // Try a few times — the webhook generates the receipt async.
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.functions.invoke('download-receipt', { body: { session_id: sessionId } });
        if ((data as any)?.url) {
          window.open((data as any).url, '_blank');
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Recording Your Payment...</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500 dark:text-emerald-400" />
              <CardTitle>Payment Received</CardTitle>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <CardTitle>Something Went Wrong</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'success' && bookingData && (
            <>
              <p className="text-muted-foreground">
                Payment was recorded for {bookingData.completions} item(s) totaling <strong>${bookingData.total_charged}</strong>.
                Provider confirmation is still pending.
              </p>
              <Badge variant="secondary" className="text-sm">
                <Receipt className="h-3 w-3 mr-1" />
                Stripe payment receipt available when enabled
              </Badge>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Download receipt (PDF)
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/my-itineraries')}>
                  View My Trips
                </Button>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-muted-foreground">
                We couldn't verify payment status. If you were charged, please contact support before making another payment.
              </p>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Return to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSuccess;

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Receipt } from 'lucide-react';
import { useBookingCheckout } from '@/hooks/useBookingCheckout';

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { confirmBooking } = useBookingCheckout();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [bookingData, setBookingData] = useState<any>(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Processing Your Booking...</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <CardTitle>Booking Confirmed! 🎉</CardTitle>
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
                {bookingData.completions} item(s) booked successfully for <strong>${bookingData.total_charged}</strong>.
              </p>
              <Badge variant="secondary" className="text-sm">
                <Receipt className="h-3 w-3 mr-1" />
                A receipt has been sent to your email
              </Badge>
              <div className="flex flex-col gap-2 pt-4">
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
                We couldn't confirm your booking. If you were charged, please contact support.
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

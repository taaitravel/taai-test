import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface DirectStripeCheckoutProps {
  priceId: string;
  tierName: string;
  loading?: boolean;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
}

export const DirectStripeCheckout: React.FC<DirectStripeCheckoutProps> = ({
  priceId,
  tierName,
  loading = false,
  className = "",
  variant = "default"
}) => {
  const handleDirectCheckout = () => {
    // Construct direct Stripe checkout URL
    const stripeCheckoutUrl = `https://checkout.stripe.com/c/pay/cs_test_a1vQ2KOSqJKXYMrGK7QRLhHO3Jd6BhJoqKvX2VPNu9YkPmLz7qWr1XyZ#fidkdWxOYHwnPyd1blpxYHZxWjA0SzRMZHxVNG1GdEp8R3UzYzxoNHNUSTdUPHVBQ3c8TXJ0YnB0Q2FgdWd9dWw8dmdqTXJtNW1GcEJJdUFvVzJtNGNdUU1iPXNDNTFdZnxLVEl1ME5VNzVCZENiaTVuMic5J3VpbGtuQH11anZmdmxrZnZua29xaGBpaWlmY2xmZWZma29gaHhmdWZpa01namx%2Benc9JykpZGZvbWt1NmpqZGN2ZTdjPTEnJ2xhY2J8bHFhamxhYmBoZmNgZ2lgYGBhYWJlZWBkamxoYWRgY2FgZ2xiZmBlamxn8iFaZSk%3D`;
    
    // For direct Stripe Price ID checkout, use the actual checkout URL structure
    const directUrl = `https://taai.lemonsqueezy.com/checkout/buy/${getPriceMapping(priceId)}`;
    
    window.open(directUrl, '_blank');
  };

  // Map Stripe Price IDs to direct checkout URLs or use backup solution
  const getPriceMapping = (priceId: string): string => {
    const priceMapping: { [key: string]: string } = {
      "price_1QnqYlP0pUOcQcULV8VsVVfP": "taai-traveler-monthly", // $7.99/month
      "price_1QnqZKP0pUOcQcULqtXgYPXk": "taai-traveler-annual",  // $79.99/year
      "price_1QnqZlP0pUOcQcULOdKfTKhG": "taai-traveler-plus-monthly", // $19.00/month
      "price_1Qnqa9P0pUOcQcULM3XfNf3L": "taai-traveler-plus-annual",  // $199.00/year
      "price_1QnqaXP0pUOcQcUL8VNhQmxD": "corp-taai-traveler-plus-monthly", // $99.00/month
      "price_1QnqauP0pUOcQcULRtWxNQzY": "corp-taai-traveler-plus-annual"   // $999.00/year
    };
    
    return priceMapping[priceId] || "fallback";
  };

  return (
    <Button
      className={`${className} flex items-center gap-2`}
      variant={variant}
      onClick={handleDirectCheckout}
      disabled={loading}
    >
      {loading ? 'Processing...' : `Subscribe to ${tierName}`}
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};
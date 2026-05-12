import { MobileNavigation } from '@/components/shared/MobileNavigation';
import { BookingCart } from '@/components/booking/BookingCart';

const Cart = () => {
  return (
    <div className="min-h-screen bg-background">
      <MobileNavigation showBackButton backPath="/home" backLabel="Back to Home" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-4">Your Cart</h1>
        <BookingCart />
      </main>
    </div>
  );
};

export default Cart;

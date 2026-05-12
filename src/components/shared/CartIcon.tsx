import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartCount } from '@/hooks/useCartCount';

export const CartIcon = () => {
  const navigate = useNavigate();
  const { count } = useCartCount();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/cart')}
      className="relative text-foreground hover:bg-accent p-2 rounded-full"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );
};

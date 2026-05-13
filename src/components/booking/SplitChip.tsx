import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { CartItemSplit } from "@/hooks/useCartItemSplits";

interface SplitChipProps {
  splits: CartItemSplit[];
}

export const SplitChip: React.FC<SplitChipProps> = ({ splits }) => {
  if (!splits || splits.length === 0) return null;
  const methods = new Set(splits.map((s) => s.share_method));
  const label =
    methods.size > 1
      ? "Custom"
      : methods.has("equal")
        ? "Equal"
        : methods.has("percent")
          ? "Percent"
          : "Amount";
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Users className="h-3 w-3" />
      Split {splits.length} ways · {label}
    </Badge>
  );
};
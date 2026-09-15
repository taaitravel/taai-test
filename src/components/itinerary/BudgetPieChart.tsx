import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, X, Plus, Plane, Hotel, Compass, Utensils, Car, ShoppingBag, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CART_BUDGET_FIELDS, ITINERARY_BUDGET_FIELDS, PAGE_SIZES } from "@/lib/data/projections";
import { useToast } from "@/hooks/use-toast";

interface BudgetCategory {
  id: string;
  category: string;
  budgeted_amount: number;
  spent_amount: number;
}

interface BudgetPieChartProps {
  itineraryId: number;
  totalBudget?: number | null;
  totalSpent?: number | null;
  refreshTrigger?: number; // Add this to force refresh when itinerary changes
  /** Only the trip organizer sees per-traveler spending detail. */
  isOrganizer?: boolean;
  /** Trip text id used by cart_items.itinerary_id. */
  tripCartId?: string | null;
}

interface TravelerSpend {
  userId: string;
  name: string;
  actual: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Flights': '#ff849c',        // Pink
  'Accommodation': '#ffce87',  // Gold
  'Activities': '#00ffff',     // Cyan
  'Dining': '#adf000',         // Lime Green
  'Transportation': '#a855f7', // Purple
};

export const BudgetPieChart = ({ itineraryId, totalBudget: totalBudgetProp, totalSpent: totalSpentProp, refreshTrigger, isOrganizer = false, tripCartId }: BudgetPieChartProps) => {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [travelerSpend, setTravelerSpend] = useState<TravelerSpend[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgetData();
  }, [itineraryId, refreshTrigger]); // Add refreshTrigger to dependencies

  // Per-traveler spend (organizer only). Actual spend = cart items the
  // traveler saved for this trip; no inference beyond stored rows.
  useEffect(() => {
    if (!isOrganizer) {
      setTravelerSpend([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data: profiles, error: profileError } = await supabase
        .rpc('get_itinerary_participant_profiles', { p_itinerary_id: itineraryId });
      if (profileError) {
        console.warn('Failed to load trip participants', profileError);
        return;
      }

      let cartId = tripCartId || null;
      if (!cartId) {
        const { data: trip } = await supabase
          .from('itinerary')
          .select('itin_id')
          .eq('id', itineraryId)
          .maybeSingle();
        cartId = (trip as { itin_id?: string } | null)?.itin_id ?? null;
      }

      const spendByUser: Record<string, number> = {};
      if (cartId) {
        const { data: rows } = await supabase
          .from('cart_items')
          .select('user_id, price')
          .eq('itinerary_id', cartId)
          .limit(PAGE_SIZES.cartItems);
        (rows || []).forEach((row) => {
          const key = String((row as { user_id: string }).user_id);
          spendByUser[key] = (spendByUser[key] || 0) + (Number((row as { price: number }).price) || 0);
        });
      }

      if (cancelled) return;
      setTravelerSpend((profiles || []).map((profile: {
        user_id: string; first_name: string | null; last_name: string | null; username: string | null;
      }) => ({
        userId: profile.user_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Traveler',
        actual: spendByUser[profile.user_id] || 0,
      })));
    };

    load();
    return () => { cancelled = true; };
  }, [isOrganizer, itineraryId, tripCartId, refreshTrigger]);

  const fetchBudgetData = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary_budget_breakdown')
        .select('id, itinerary_id, category, budgeted_amount, spent_amount')
        .eq('itinerary_id', itineraryId)
        .order('category');

      if (error) throw error;

      // If no budget data exists, initialize it
      if (!data || data.length === 0) {
        await initializeBudgetCategories();
        return;
      }

      // Get the current itinerary to fetch itin_id and budget
      const { data: itinerary, error: itinError } = await supabase
        .from('itinerary')
        .select(ITINERARY_BUDGET_FIELDS)
        .eq('id', itineraryId)
        .single();

      if (itinError) throw itinError;
      const trip = itinerary as unknown as { id: number; itin_id: string; budget: number | null; spending: number | null };

      // Fetch cart items to recalculate spent amounts
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(CART_BUDGET_FIELDS)
        .eq('itinerary_id', trip.itin_id)
        .limit(PAGE_SIZES.cartItems);

      if (cartError) {
        console.error('Error fetching cart items:', cartError);
      }

      // Calculate actual spending from cart_items by type
      const cartRows = (cartItems || []) as unknown as Array<{ id: string; type: string; price: number; item_kind: string | null }>;
      const flightCostFromCart = cartRows.filter(item => item.type === 'flight')
        .reduce((sum, item) => sum + item.price, 0);
      
      const hotelCostFromCart = cartRows.filter(item => item.type === 'hotel')
        .reduce((sum, item) => sum + item.price, 0);
      
      const activityCostFromCart = cartRows.filter(item => item.type === 'activity')
        .reduce((sum, item) => sum + item.price, 0);
      
      const diningCostFromCart = cartRows.filter(item => item.type === 'reservation')
        .reduce((sum, item) => {
          if (item.item_kind === 'restaurant') {
            return sum + item.price;
          }
          return sum;
        }, 0);

      // Legacy itinerary JSON sections are intentionally NOT loaded here:
      // cart_items is the commerce source of truth and the JSON arrays carry
      // large provider snapshots (egress containment).
      const flightCostFromJSON = 0;
      const hotelCostFromJSON = 0;
      const activityCostFromJSON = 0;
      const diningCostFromJSON = 0;

      // Combine cart and JSON costs
      const costsByCategory: Record<string, number> = {
        'Flights': flightCostFromCart + flightCostFromJSON,
        'Accommodation': hotelCostFromCart + hotelCostFromJSON,
        'Activities': activityCostFromCart + activityCostFromJSON,
        'Dining': diningCostFromCart + diningCostFromJSON,
      };

      // Calculate budget allocations if they're all 0
      const needsAllocation = data.every(cat => cat.budgeted_amount === 0);
      const totalBudget = trip.budget || 0;

      // Update the budget data with actual spent amounts and budgeted amounts if needed
      const updatedData = data.map(category => {
        const spent = costsByCategory[category.category] ?? category.spent_amount;
        let budgeted = category.budgeted_amount;
        
        // If no budgets are allocated yet and we have a total budget, allocate based on actual spending proportions
        if (needsAllocation && totalBudget > 0) {
          // Calculate total actual spending
          const totalSpending = Object.values(costsByCategory).reduce((sum, cost) => sum + cost, 0);
          
          if (totalSpending > 0) {
            // Allocate budget proportionally based on actual spending
            const proportion = spent / totalSpending;
            budgeted = totalBudget * proportion;
          } else {
            // Fallback to default allocations if no spending yet
            const allocations: Record<string, number> = {
              'Flights': 0.25,
              'Accommodation': 0.30,
              'Activities': 0.20,
              'Dining': 0.15,
              'Transportation': 0.10,
              'Shopping': 0,
              'Miscellaneous': 0
            };
            budgeted = totalBudget * (allocations[category.category] || 0);
          }
        }
        
        return {
          ...category,
          spent_amount: spent,
          budgeted_amount: budgeted
        };
      });

      // Update the database with new spent amounts and budgeted amounts
      for (const category of updatedData) {
        await supabase
          .from('itinerary_budget_breakdown')
          .update({ 
            spent_amount: category.spent_amount,
            budgeted_amount: category.budgeted_amount
          })
          .eq('id', category.id);
      }

      setBudgetData(updatedData || []);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeBudgetCategories = async () => {
    try {
      // Get the current itinerary data
      const { data: itinerary, error: itinError } = await supabase
        .from('itinerary')
        .select(ITINERARY_BUDGET_FIELDS)
        .eq('id', itineraryId)
        .single();

      if (itinError) throw itinError;
      const trip = itinerary as unknown as { id: number; itin_id: string; budget: number | null; spending: number | null };

      // Get cart items for this itinerary
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(CART_BUDGET_FIELDS)
        .eq('itinerary_id', trip.itin_id)
        .limit(PAGE_SIZES.cartItems);

      if (cartError) {
        console.error('Error fetching cart items:', cartError);
      }

      // Calculate costs from cart_items by type
      const cartRows = (cartItems || []) as unknown as Array<{ id: string; type: string; price: number; item_kind: string | null }>;
      const flightCostFromCart = cartRows.filter(item => item.type === 'flight')
        .reduce((sum, item) => sum + item.price, 0);
      
      const hotelCostFromCart = cartRows.filter(item => item.type === 'hotel')
        .reduce((sum, item) => sum + item.price, 0);
      
      const activityCostFromCart = cartRows.filter(item => item.type === 'activity')
        .reduce((sum, item) => sum + item.price, 0);
      
      const diningCostFromCart = cartRows.filter(item => item.type === 'reservation')
        .reduce((sum, item) => {
          if (item.item_kind === 'restaurant') {
            return sum + item.price;
          }
          return sum;
        }, 0);

      // Legacy itinerary JSON sections are intentionally NOT loaded here:
      // cart_items is the commerce source of truth and the JSON arrays carry
      // large provider snapshots (egress containment).
      const flightCostFromJSON = 0;
      const hotelCostFromJSON = 0;
      const activityCostFromJSON = 0;
      const diningCostFromJSON = 0;

      // Combine cart and JSON costs
      const flightCost = flightCostFromCart + flightCostFromJSON;
      const hotelCost = hotelCostFromCart + hotelCostFromJSON;
      const activityCost = activityCostFromCart + activityCostFromJSON;
      const diningCost = diningCostFromCart + diningCostFromJSON;

      // Create default budget breakdown
      const categories = [
        { category: 'Flights', budgeted_amount: Math.max(flightCost, (trip.budget || 0) * 0.25), spent_amount: flightCost },
        { category: 'Accommodation', budgeted_amount: Math.max(hotelCost, (trip.budget || 0) * 0.30), spent_amount: hotelCost },
        { category: 'Activities', budgeted_amount: Math.max(activityCost, (trip.budget || 0) * 0.20), spent_amount: activityCost },
        { category: 'Dining', budgeted_amount: Math.max(diningCost, (trip.budget || 0) * 0.15), spent_amount: diningCost },
        { category: 'Transportation', budgeted_amount: (trip.budget || 0) * 0.10, spent_amount: 0 },
        { category: 'Shopping', budgeted_amount: 0, spent_amount: 0 },
        { category: 'Miscellaneous', budgeted_amount: 0, spent_amount: 0 }
      ];

      // Insert categories into database
      for (const category of categories) {
        await supabase
          .from('itinerary_budget_breakdown')
          .upsert({
            itinerary_id: itineraryId,
            ...category
          }, {
            onConflict: 'itinerary_id,category'
          });
      }

      setBudgetData(categories.map((cat, index) => ({ ...cat, id: index.toString() })));
    } catch (error) {
      console.error('Error initializing budget categories:', error);
    }
  };

  const handleEdit = () => {
    setEditData([...budgetData]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Update existing categories
      const updates = editData.map(category => 
        supabase
          .from('itinerary_budget_breakdown')
          .update({
            budgeted_amount: category.budgeted_amount,
            spent_amount: category.spent_amount
          })
          .eq('id', category.id)
      );

      await Promise.all(updates);
      
      setBudgetData([...editData]);
      setIsEditing(false);
      setEditData([]);
      
      toast({
        title: "Success",
        description: "Budget updated successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    }
  };

  const updateEditData = (index: number, field: 'budgeted_amount' | 'spent_amount', value: string) => {
    const newEditData = [...editData];
    newEditData[index][field] = parseFloat(value) || 0;
    setEditData(newEditData);
  };

  // Filter to categories with actual spending for the pie chart
  const allChartData = budgetData
    .filter(item => item.spent_amount > 0)
    .map((item) => ({
      name: item.category,
      budgeted: item.budgeted_amount,
      spent: item.spent_amount,
      fill: CATEGORY_COLORS[item.category] || '#6b7280'
    }));

  const chartData = allChartData.filter(item => !hiddenCategories.includes(item.name));

  const toggleCategory = (category: string) => {
    setHiddenCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
    setActiveCategory((prev) => (prev === category ? null : prev));
  };

  const totalBudgetFromBreakdown = budgetData.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalSpentFromBreakdown = budgetData.reduce((sum, item) => sum + item.spent_amount, 0);
  const totalBudget = (totalBudgetProp ?? totalBudgetFromBreakdown) || 0;
  const totalSpent = (totalSpentProp ?? totalSpentFromBreakdown) || 0;
  const visibleSpent = chartData.reduce((sum, item) => sum + item.spent, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Flights': return Plane;
      case 'Accommodation': return Hotel;
      case 'Activities': return Compass;
      case 'Dining': return Utensils;
      case 'Transportation': return Car;
      case 'Shopping': return ShoppingBag;
      case 'Miscellaneous': return MoreHorizontal;
      default: return MoreHorizontal;
    }
  };

  const activeSlice = chartData.find((item) => item.name === activeCategory) || null;
  const detail = activeSlice ?? {
    name: 'All visible categories',
    budgeted: chartData.reduce((sum, item) => sum + item.budgeted, 0),
    spent: visibleSpent,
    fill: 'hsl(var(--primary))',
  };
  const money = (value: number) =>
    `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  const travelerCount = Math.max(travelerSpend.length, 1);
  const projectedPerTraveler = totalBudget > 0 ? totalBudget / travelerCount : 0;

  if (loading) {
    return (
      <Card className="bg-card/80 border-border backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading budget data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card via-secondary to-card border-border backdrop-blur-md shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-xl font-bold">Budget Overview</CardTitle>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="bg-muted text-foreground border-border hover:bg-accent transition-all text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-muted text-foreground border-border hover:bg-accent transition-all text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gold-gradient hover:opacity-90 text-background font-semibold transition-all text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-xl bg-muted border border-border backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">Total Budget</p>
            <p className="text-base font-bold text-foreground">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gradient-to-br from-[hsl(351,85%,75%)]/10 to-[hsl(15,80%,70%)]/10 border border-[hsl(351,85%,75%)]/20 backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">Total Spent</p>
            <p className="text-base font-bold text-[hsl(351,85%,75%)]">${totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted border border-border backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">Remaining</p>
            <p className={`text-base font-bold ${(totalBudget - totalSpent) >= 0 ? 'text-foreground' : 'text-red-400'}`}>
              ${(totalBudget - totalSpent).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted border border-border backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">Budget Utilization</p>
            <p className="text-base font-bold text-foreground">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Category filter */}
        {allChartData.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allChartData.map((entry) => {
              const Icon = getCategoryIcon(entry.name);
              const hidden = hiddenCategories.includes(entry.name);
              return (
                <button
                  key={`filter-${entry.name}`}
                  type="button"
                  onClick={() => toggleCategory(entry.name)}
                  aria-pressed={!hidden}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    hidden
                      ? 'border-border bg-transparent text-muted-foreground opacity-60'
                      : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <Icon className="h-3 w-3" />
                  {entry.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Two donuts: trip total and category detail */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Total spend vs budget */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trip total</p>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {chartData.map((entry, index) => (
                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={104}
                      dataKey="spent"
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      onMouseEnter={(_, index) => setActiveCategory(chartData[index]?.name ?? null)}
                      onClick={(_, index) => setActiveCategory(chartData[index]?.name ?? null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${index})`}
                          stroke="hsl(var(--card))"
                          opacity={activeCategory && activeCategory !== entry.name ? 0.45 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center label — never covered, the detail panel sits below */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
                  <p className="text-xl font-bold text-[hsl(351,85%,75%)]">{money(visibleSpent)}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">total spent of</p>
                  <p className="text-base font-bold text-foreground">{money(totalBudget)}</p>
                </div>
              </div>

              {/* Fixed detail panel replaces the floating tooltip */}
              <div className="mt-3 rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: detail.fill }} />
                  <p className="text-xs font-bold text-foreground">{detail.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Budgeted</p>
                    <p className="text-xs font-semibold text-foreground">{money(detail.budgeted)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Spent</p>
                    <p className="text-xs font-semibold text-[hsl(351,85%,75%)]">{money(detail.spent)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                    <p className="text-xs font-semibold text-foreground">{money(detail.budgeted - detail.spent)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spend by category */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spend by category</p>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={104}
                      dataKey="spent"
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      onMouseEnter={(_, index) => setActiveCategory(chartData[index]?.name ?? null)}
                      onClick={(_, index) => setActiveCategory(chartData[index]?.name ?? null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`share-${index}`}
                          fill={entry.fill}
                          stroke="hsl(var(--card))"
                          opacity={activeCategory && activeCategory !== entry.name ? 0.45 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">categories</p>
                  <p className="text-xl font-bold text-foreground">{chartData.length}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {chartData.map((entry) => {
                  const Icon = getCategoryIcon(entry.name);
                  const share = visibleSpent > 0 ? (entry.spent / visibleSpent) * 100 : 0;
                  return (
                    <button
                      key={`row-${entry.name}`}
                      type="button"
                      onClick={() => setActiveCategory(activeCategory === entry.name ? null : entry.name)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                        activeCategory === entry.name ? 'border-border bg-card' : 'border-transparent bg-card/60 hover:bg-card'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate text-xs text-foreground">{entry.name}</span>
                      <span className="text-xs font-semibold text-foreground">{money(entry.spent)}</span>
                      <span className="w-12 text-right text-[11px] text-muted-foreground">{share.toFixed(1)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Organizer-only traveler spending */}
        {isOrganizer && travelerSpend.length > 0 && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Traveler spending</p>
              <span className="text-[10px] text-muted-foreground">Visible to the organizer only</span>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Projected is the trip budget split evenly across {travelerCount} traveler{travelerCount === 1 ? '' : 's'}. Actual is what each traveler has added to this trip.
            </p>
            <div className="space-y-1.5">
              {travelerSpend.map((traveler) => {
                const over = traveler.actual > projectedPerTraveler && projectedPerTraveler > 0;
                return (
                  <div
                    key={traveler.userId}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="flex-1 truncate text-xs font-medium text-foreground">{traveler.name}</span>
                    <span className="text-[11px] text-muted-foreground">Projected {money(projectedPerTraveler)}</span>
                    <span className={`text-xs font-semibold ${over ? 'text-destructive' : 'text-foreground'}`}>
                      {money(traveler.actual)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Edit Budget Categories */}
        {isEditing && (
          <div className="space-y-3">
            <h4 className="text-foreground font-semibold text-xs">Quick Budget Adjustments</h4>
            <div className="grid grid-cols-2 gap-3">
              {editData.filter(item => item.budgeted_amount > 0).map((item, index) => (
                <div key={item.id} className="p-4 bg-muted rounded-xl border border-border backdrop-blur-sm hover:bg-accent transition-all">
                  <label className="text-xs text-muted-foreground block mb-2 font-medium">{item.category}</label>
                  <Input
                    type="number"
                    value={item.budgeted_amount}
                    onChange={(e) => {
                      const newEditData = [...editData];
                      const fullIndex = editData.findIndex(cat => cat.id === item.id);
                      newEditData[fullIndex].budgeted_amount = parseFloat(e.target.value) || 0;
                      setEditData(newEditData);
                    }}
                    className="w-full bg-muted border-border text-foreground h-8 text-xs font-semibold"
                    placeholder="Budget amount"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
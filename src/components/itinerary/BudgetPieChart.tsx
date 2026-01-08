import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, X, Plus, Plane, Hotel, Compass, Utensils, Car, ShoppingBag, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}

const COLORS = [
  'hsl(351, 85%, 75%)',  // Primary coral pink
  'hsl(15, 80%, 70%)',   // Orange
  'hsl(25, 75%, 65%)',   // Peach
  'hsl(335, 85%, 75%)',  // Hot pink
  'hsl(10, 85%, 75%)',   // Red-orange
  'hsl(20, 80%, 70%)',   // Golden orange
  'hsl(30, 75%, 70%)',   // Light orange
];

export const BudgetPieChart = ({ itineraryId, totalBudget: totalBudgetProp, totalSpent: totalSpentProp, refreshTrigger }: BudgetPieChartProps) => {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgetData();
  }, [itineraryId, refreshTrigger]); // Add refreshTrigger to dependencies

  const fetchBudgetData = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary_budget_breakdown')
        .select('*')
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
        .select('itin_id, budget, flights, hotels, activities, reservations')
        .eq('id', itineraryId)
        .single();

      if (itinError) throw itinError;

      // Fetch cart items to recalculate spent amounts
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('itinerary_id', itinerary.itin_id);

      if (cartError) {
        console.error('Error fetching cart items:', cartError);
      }

      // Calculate actual spending from cart_items by type
      const flightCostFromCart = cartItems?.filter(item => item.type === 'flight')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const hotelCostFromCart = cartItems?.filter(item => item.type === 'hotel')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const activityCostFromCart = cartItems?.filter(item => item.type === 'activity')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const diningCostFromCart = cartItems?.filter(item => item.type === 'reservation')
        .reduce((sum, item) => {
          const itemData = item.item_data as any;
          if (itemData?.type === 'restaurant') {
            return sum + item.price;
          }
          return sum;
        }, 0) || 0;

      // Also include legacy JSON data if it exists
      const flightCostFromJSON = itinerary.flights ? 
        (itinerary.flights as any[]).reduce((sum: number, flight: any) => sum + (flight.cost || 0), 0) : 0;
      
      const hotelCostFromJSON = itinerary.hotels ? 
        (itinerary.hotels as any[]).reduce((sum: number, hotel: any) => sum + (hotel.cost || 0), 0) : 0;
      
      const activityCostFromJSON = itinerary.activities ? 
        (itinerary.activities as any[]).reduce((sum: number, activity: any) => sum + (activity.cost || 0), 0) : 0;
      
      const diningCostFromJSON = itinerary.reservations ? 
        (itinerary.reservations as any[]).reduce((sum: number, reservation: any) => {
          // Include all reservations with cost in dining category
          return sum + (reservation.cost || reservation.estimated_cost || 0);
        }, 0) : 0;

      // Combine cart and JSON costs
      const costsByCategory: Record<string, number> = {
        'Flights': flightCostFromCart + flightCostFromJSON,
        'Accommodation': hotelCostFromCart + hotelCostFromJSON,
        'Activities': activityCostFromCart + activityCostFromJSON,
        'Dining': diningCostFromCart + diningCostFromJSON,
      };

      // Calculate budget allocations if they're all 0
      const needsAllocation = data.every(cat => cat.budgeted_amount === 0);
      const totalBudget = itinerary.budget || 0;

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
        .select('*')
        .eq('id', itineraryId)
        .single();

      if (itinError) throw itinError;

      // Get cart items for this itinerary
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('itinerary_id', itinerary.itin_id);

      if (cartError) {
        console.error('Error fetching cart items:', cartError);
      }

      // Calculate costs from cart_items by type
      const flightCostFromCart = cartItems?.filter(item => item.type === 'flight')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const hotelCostFromCart = cartItems?.filter(item => item.type === 'hotel')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const activityCostFromCart = cartItems?.filter(item => item.type === 'activity')
        .reduce((sum, item) => sum + item.price, 0) || 0;
      
      const diningCostFromCart = cartItems?.filter(item => item.type === 'reservation')
        .reduce((sum, item) => {
          const itemData = item.item_data as any;
          if (itemData?.type === 'restaurant') {
            return sum + item.price;
          }
          return sum;
        }, 0) || 0;

      // Also include legacy JSON data if it exists
      const flightCostFromJSON = itinerary.flights ? 
        (itinerary.flights as any[]).reduce((sum: number, flight: any) => sum + (flight.cost || 0), 0) : 0;
      
      const hotelCostFromJSON = itinerary.hotels ? 
        (itinerary.hotels as any[]).reduce((sum: number, hotel: any) => sum + (hotel.cost || 0), 0) : 0;
      
      const activityCostFromJSON = itinerary.activities ? 
        (itinerary.activities as any[]).reduce((sum: number, activity: any) => sum + (activity.cost || 0), 0) : 0;
      
      const diningCostFromJSON = itinerary.reservations ? 
        (itinerary.reservations as any[]).reduce((sum: number, reservation: any) => {
          if (reservation.type === 'restaurant') {
            return sum + (reservation.estimated_cost || reservation.cost || 0);
          }
          return sum;
        }, 0) : 0;

      // Combine cart and JSON costs
      const flightCost = flightCostFromCart + flightCostFromJSON;
      const hotelCost = hotelCostFromCart + hotelCostFromJSON;
      const activityCost = activityCostFromCart + activityCostFromJSON;
      const diningCost = diningCostFromCart + diningCostFromJSON;

      // Create default budget breakdown
      const categories = [
        { category: 'Flights', budgeted_amount: Math.max(flightCost, (itinerary.budget || 0) * 0.25), spent_amount: flightCost },
        { category: 'Accommodation', budgeted_amount: Math.max(hotelCost, (itinerary.budget || 0) * 0.30), spent_amount: hotelCost },
        { category: 'Activities', budgeted_amount: Math.max(activityCost, (itinerary.budget || 0) * 0.20), spent_amount: activityCost },
        { category: 'Dining', budgeted_amount: Math.max(diningCost, (itinerary.budget || 0) * 0.15), spent_amount: diningCost },
        { category: 'Transportation', budgeted_amount: (itinerary.budget || 0) * 0.10, spent_amount: 0 },
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
  const chartData = budgetData
    .filter(item => item.spent_amount > 0)
    .map((item, index) => ({
      name: item.category,
      budgeted: item.budgeted_amount,
      spent: item.spent_amount,
      fill: COLORS[index % COLORS.length]
    }));

  const totalBudgetFromBreakdown = budgetData.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalSpentFromBreakdown = budgetData.reduce((sum, item) => sum + item.spent_amount, 0);
  const totalBudget = (totalBudgetProp ?? totalBudgetFromBreakdown) || 0;
  const totalSpent = (totalSpentProp ?? totalSpentFromBreakdown) || 0;

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

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {payload.map((entry: any, index: number) => {
          const IconComponent = getCategoryIcon(entry.value);
          const percentage = ((entry.payload.spent / totalSpent) * 100).toFixed(1);
          return (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <IconComponent className="w-3 h-3 text-white/70" />
              <span className="text-xs text-white/70">{percentage}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a0b14] border border-white/20 rounded-lg p-3 shadow-2xl backdrop-blur-xl">
          <p className="text-white font-bold text-xs mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs">
              <span className="text-white/60">Budgeted:</span>
              <span className="text-[hsl(351,85%,75%)] font-semibold ml-2">
                ${data.budgeted.toLocaleString()}
              </span>
            </p>
            <p className="text-xs">
              <span className="text-white/60">Spent:</span>
              <span className="text-[hsl(15,80%,70%)] font-semibold ml-2">
                ${data.spent.toLocaleString()}
              </span>
            </p>
            <p className="text-xs">
              <span className="text-white/60">Remaining:</span>
              <span className="text-white font-semibold ml-2">
                ${(data.budgeted - data.spent).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-center text-white/70">Loading budget data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#0a0b14] via-[#12131f] to-[#171821] border-white/10 backdrop-blur-md shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl font-bold">Budget Overview</CardTitle>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="bg-white/5 text-white border-white/20 hover:bg-white/10 transition-all text-xs"
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
                  className="bg-white/5 text-white border-white/20 hover:bg-white/10 transition-all text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold transition-all text-xs"
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
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 mb-1 font-medium">Total Budget</p>
            <p className="text-base font-bold text-white">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gradient-to-br from-[hsl(351,85%,75%)]/10 to-[hsl(15,80%,70%)]/10 border border-[hsl(351,85%,75%)]/20 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 mb-1 font-medium">Total Spent</p>
            <p className="text-base font-bold text-[hsl(351,85%,75%)]">${totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 mb-1 font-medium">Remaining</p>
            <p className={`text-base font-bold ${(totalBudget - totalSpent) >= 0 ? 'text-white' : 'text-red-400'}`}>
              ${(totalBudget - totalSpent).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 mb-1 font-medium">Budget Utilization</p>
            <p className="text-base font-bold text-white">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Modern Donut Chart */}
        {chartData.length > 0 && (
          <div className="relative h-96">
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
                  innerRadius={104}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="spent"
                  stroke="#0a0b14"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} stroke="#0a0b14" />
                  ))}
                </Pie>
                <Legend content={<CustomLegend />} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-white/50 text-xs font-medium mb-1">Total</p>
              <p className="text-white text-xl font-bold">${totalBudget.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Quick Edit Budget Categories */}
        {isEditing && (
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs">Quick Budget Adjustments</h4>
            <div className="grid grid-cols-2 gap-3">
              {editData.filter(item => item.budgeted_amount > 0).map((item, index) => (
                <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <label className="text-xs text-white/70 block mb-2 font-medium">{item.category}</label>
                  <Input
                    type="number"
                    value={item.budgeted_amount}
                    onChange={(e) => {
                      const newEditData = [...editData];
                      const fullIndex = editData.findIndex(cat => cat.id === item.id);
                      newEditData[fullIndex].budgeted_amount = parseFloat(e.target.value) || 0;
                      setEditData(newEditData);
                    }}
                    className="w-full bg-white/10 border-white/20 text-white h-8 text-xs font-semibold"
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
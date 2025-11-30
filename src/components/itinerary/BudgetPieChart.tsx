import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, X, Plus } from "lucide-react";
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
  'hsl(351, 85%, 75%)',  // Primary pink
  'hsl(15, 80%, 70%)',   // Orange
  'hsl(25, 75%, 65%)',   // Yellow-orange
  'hsl(200, 70%, 70%)',  // Blue
  'hsl(280, 70%, 70%)',  // Purple
  'hsl(120, 60%, 70%)',  // Green
  'hsl(45, 80%, 70%)',   // Gold
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
          if (reservation.type === 'restaurant') {
            return sum + (reservation.estimated_cost || reservation.cost || 0);
          }
          return sum;
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

  const chartData = budgetData
    .filter(item => item.budgeted_amount > 0)
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#171821] border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{label}</p>
          <p className="text-blue-400">
            Budgeted: ${data.budgeted.toLocaleString()}
          </p>
          <p className="text-green-400">
            Spent: ${data.spent.toLocaleString()}
          </p>
          <p className="text-white/70">
            Remaining: ${(data.budgeted - data.spent).toLocaleString()}
          </p>
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
    <Card className="bg-[#171821]/80 border-white/30 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Budget Overview</CardTitle>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-white/70">Total Budget</p>
            <p className="text-lg font-semibold text-white">${totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Total Spent</p>
            <p className="text-lg font-semibold text-green-400">${totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Remaining</p>
            <p className={`text-lg font-semibold ${(totalBudget - totalSpent) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ${(totalBudget - totalSpent).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Budget Overview Chart - Focused on visual representation */}
        {chartData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="budgeted"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'white', fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Edit Budget Categories */}
        {isEditing && (
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">Quick Budget Adjustments</h4>
            <div className="grid grid-cols-2 gap-3">
              {editData.filter(item => item.budgeted_amount > 0).map((item, index) => (
                <div key={item.id} className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <label className="text-xs text-white/70 block mb-1">{item.category}</label>
                  <Input
                    type="number"
                    value={item.budgeted_amount}
                    onChange={(e) => {
                      const newEditData = [...editData];
                      const fullIndex = editData.findIndex(cat => cat.id === item.id);
                      newEditData[fullIndex].budgeted_amount = parseFloat(e.target.value) || 0;
                      setEditData(newEditData);
                    }}
                    className="w-full text-xs bg-white/10 border-white/30 text-white h-8"
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
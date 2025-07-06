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

export const BudgetPieChart = ({ itineraryId, refreshTrigger }: BudgetPieChartProps) => {
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

      setBudgetData(data || []);
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

  const totalBudget = budgetData.reduce((sum, item) => sum + item.budgeted_amount, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent_amount, 0);

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

        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="budgeted"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Budget Breakdown Table */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Spending by Category</h4>
          
          {/* Column Headers */}
          <div className="grid grid-cols-4 gap-2 items-center px-2 py-2 text-xs text-white/70 font-medium border-b border-white/20">
            <div>Category</div>
            <div className="text-center">Budget</div>
            <div className="text-center">Spent</div>
            <div className="text-center">Left</div>
          </div>
          
          <div className="space-y-2">
            {(isEditing ? editData : budgetData).map((item, index) => (
              <div key={item.id} className="grid grid-cols-4 gap-2 items-center p-2 bg-white/10 rounded-lg border border-white/20">
                <div className="text-xs font-medium text-white truncate" title={item.category}>
                  {item.category.length > 8 ? `${item.category.substring(0, 8)}...` : item.category}
                </div>
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.budgeted_amount}
                      onChange={(e) => updateEditData(index, 'budgeted_amount', e.target.value)}
                      className="w-full text-xs bg-white/10 border-white/30 text-white h-6"
                      placeholder="0"
                    />
                  ) : (
                    <span className="text-xs text-white">
                      ${item.budgeted_amount >= 1000 ? `${(item.budgeted_amount / 1000).toFixed(1)}k` : item.budgeted_amount}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.spent_amount}
                      onChange={(e) => updateEditData(index, 'spent_amount', e.target.value)}
                      className="w-full text-xs bg-white/10 border-white/30 text-white h-6"
                      placeholder="0"
                    />
                  ) : (
                    <span className="text-xs text-green-400">
                      ${item.spent_amount >= 1000 ? `${(item.spent_amount / 1000).toFixed(1)}k` : item.spent_amount}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-xs ${(item.budgeted_amount - item.spent_amount) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    ${Math.abs(item.budgeted_amount - item.spent_amount) >= 1000 ? 
                      `${((item.budgeted_amount - item.spent_amount) / 1000).toFixed(1)}k` : 
                      (item.budgeted_amount - item.spent_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
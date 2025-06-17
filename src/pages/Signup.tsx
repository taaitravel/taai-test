
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plane, Users, Building2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userType = location.state?.userType || 'individual';
  
  const [formData, setFormData] = useState({
    // Individual fields
    firstName: '',
    userName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Company fields
    companyName: '',
    adminName: '',
    registeredAddress: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Account Created Successfully!",
      description: "Welcome to TAAI Travel. Let's continue setting up your profile.",
    });

    // Navigate to profile setup
    navigate('/profile-setup', { state: { userType, formData } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center space-x-2">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              TAAI Travel
            </span>
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={`${userType === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}
            >
              {userType === 'individual' ? (
                <>
                  <Users className="h-4 w-4 mr-1" />
                  Individual Account
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-1" />
                  Corporate Account
                </>
              )}
            </Badge>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              {userType === 'individual' 
                ? "Join thousands of travelers planning smarter trips"
                : "Streamline your corporate travel management"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {userType === 'individual' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName">Username</Label>
                  <Input
                    id="userName"
                    placeholder="johndoe"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Contact Name</Label>
                <Input
                  id="adminName"
                  placeholder="Jane Smith"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Input
                  id="registeredAddress"
                  placeholder="123 Business Ave, City, State 12345"
                  value={formData.registeredAddress}
                  onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
          </div>

          <Separator />

          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
            onClick={handleSignup}
          >
            Create Account
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-blue-600" onClick={() => navigate('/login')}>
              Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

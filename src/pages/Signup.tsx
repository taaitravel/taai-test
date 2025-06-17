
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
    <div className="min-h-screen bg-[#171821] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-yellow-800/10"></div>
      <Card className="w-full max-w-md shadow-2xl shadow-yellow-500/20 border-yellow-500/30 bg-[#171821]/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center space-x-2">
            <Plane className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold luxury-text-gradient">
              TAAI Travel
            </span>
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={`${userType === 'individual' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
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
            <CardTitle className="text-2xl text-yellow-200">Create Your Account</CardTitle>
            <CardDescription className="text-yellow-300/70">
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
                  <Label htmlFor="firstName" className="text-yellow-300">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-yellow-300">Username</Label>
                  <Input
                    id="userName"
                    placeholder="johndoe"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-yellow-300">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-yellow-300">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-yellow-300">Admin Contact Name</Label>
                <Input
                  id="adminName"
                  placeholder="Jane Smith"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registeredAddress" className="text-yellow-300">Registered Address</Label>
                <Input
                  id="registeredAddress"
                  placeholder="123 Business Ave, City, State 12345"
                  value={formData.registeredAddress}
                  onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-yellow-300">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-yellow-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-yellow-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-yellow-300">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
            />
          </div>

          <Separator className="bg-yellow-500/30" />

          <Button 
            className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
            onClick={handleSignup}
          >
            Create Account
          </Button>

          <div className="text-center text-sm text-yellow-300/70">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-yellow-400 hover:text-yellow-300" onClick={() => navigate('/login')}>
              Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

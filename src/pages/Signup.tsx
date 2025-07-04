
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
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <Card className="w-full max-w-md shadow-2xl shadow-white/20 border-white/30 bg-[#171821]/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-white hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="max-h-8" />
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={`${userType === 'individual' ? 'bg-white/20 text-white border-white/30' : 'bg-white/20 text-white border-white/30'}`}
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
            <CardTitle className="text-2xl text-white">Create Your Account</CardTitle>
            <CardDescription className="text-white/70">
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
                  <Label htmlFor="firstName" className="text-white">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-white">Username</Label>
                  <Input
                    id="userName"
                    placeholder="johndoe"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-white">Admin Contact Name</Label>
                <Input
                  id="adminName"
                  placeholder="Jane Smith"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registeredAddress" className="text-white">Registered Address</Label>
                <Input
                  id="registeredAddress"
                  placeholder="123 Business Ave, City, State 12345"
                  value={formData.registeredAddress}
                  onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
            />
          </div>

          <Separator className="bg-white/30" />

          <Button 
            className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
            onClick={handleSignup}
          >
            Create Account
          </Button>

          <div className="text-center text-sm text-white/70">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-white hover:text-white" onClick={() => navigate('/login')}>
              Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

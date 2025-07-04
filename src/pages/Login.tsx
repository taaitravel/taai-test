
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = () => {
    toast({
      title: "Welcome back!",
      description: "Successfully logged in to TAAI Travel.",
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#171821] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <Card className="w-full max-w-md shadow-2xl shadow-white/20 border-white/30 bg-[#171821]/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-white hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[200px] w-auto" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-white/70">
              Sign in to continue your travel planning journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
            />
          </div>

          <div className="text-right">
            <Button variant="link" className="p-0 h-auto font-normal text-white hover:text-white text-sm">
              Forgot password?
            </Button>
          </div>

          <Button 
            className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
            onClick={handleLogin}
          >
            Sign In
          </Button>

          <Separator className="bg-white/30" />

          <div className="text-center text-sm text-white/70">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-white hover:text-white" onClick={() => navigate('/signup')}>
              Sign up here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

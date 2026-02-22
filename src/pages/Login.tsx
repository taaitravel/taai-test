
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to TAAI Travel.",
          variant: "success"
        });
        navigate('/home');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5"></div>
      <Card className="w-full max-w-md shadow-2xl border-border bg-card/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-foreground hover:text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-[200px] w-auto" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl text-card-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to continue your travel planning journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-border text-foreground hover:bg-accent flex items-center justify-center gap-3 h-11"
            onClick={signInWithGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="text-right">
            <Button variant="link" className="p-0 h-auto font-normal text-primary hover:text-primary/80 text-sm">
              Forgot password?
            </Button>
          </div>

          <Button 
            className="w-full gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <Separator className="bg-border" />

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-primary hover:text-primary/80" onClick={() => navigate('/signup')}>
              Sign up here
            </Button>
            {" | "}
            <Button variant="link" className="p-0 h-auto font-normal text-primary hover:text-primary/80" onClick={() => navigate('/terms')}>
              Terms & Privacy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

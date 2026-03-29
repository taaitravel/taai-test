import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plane, Users, Building2, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Captcha } from '@/components/ui/captcha';
import { LOGO_URL } from "@/lib/constants";

const Signup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signInWithGoogle, resendVerificationEmail, user } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || resending) return;
    
    setResending(true);
    try {
      const { error } = await resendVerificationEmail(formData.email);
      
      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email sent!",
          description: "Check your inbox (and spam folder) for the verification link.",
        });
        setResendCooldown(60); // 60 second cooldown
      }
    } finally {
      setResending(false);
    }
  }, [resendCooldown, resending, formData.email, resendVerificationEmail, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    // Require successful captcha verification
    if (!captchaValid) {
      toast({
        title: "Verification required",
        description: "Please complete the captcha before creating your account.",
        variant: "destructive"
      });
      return;
    }

    // Basic validations
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Strong password policy (8+ chars, upper, lower, number, symbol)
    const pwd = formData.password;
    const strongPwd = pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
    if (!strongPwd) {
      toast({
        title: "Weak password",
        description: "Use 8+ characters including upper, lower, number and symbol.",
        variant: "destructive"
      });
      return;
    }

    // Email format check
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email);
    if (!emailOk) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Required fields by account type
    if (userType === 'individual') {
      if (!formData.firstName || !formData.userName) {
        toast({
          title: "Missing Information",
          description: "Please fill in first name and username.",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!formData.companyName || !formData.adminName) {
        toast({
          title: "Missing Information",
          description: "Please fill in company name and admin contact name.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const metadata = {
        user_type: userType,
        first_name: formData.firstName,
        last_name: '', // Could add last name field if needed
        username: formData.userName,
        company_name: formData.companyName,
        admin_name: formData.adminName,
        registered_address: formData.registeredAddress,
        phone: formData.phone
      };

      const { error } = await signUp(formData.email, formData.password, metadata);

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setShowEmailConfirmation(true);
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5"></div>
        <Card className="w-full max-w-md shadow-2xl border-border bg-card/95 backdrop-blur-md relative">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img src={LOGO_URL} alt="TAAI Travel" className="h-[150px] w-auto" />
            </div>
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-card-foreground">Check Your Email</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              We've sent a verification link to <strong className="text-foreground">{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="bg-accent/50 border border-border rounded-lg p-4 space-y-3">
              <p className="text-muted-foreground text-sm">
                Click the link in your email to verify your account and complete registration.
              </p>
              <div className="flex items-center justify-center gap-2 text-primary/80 text-xs">
                <span>💡</span>
                <span>Can't find it? Check your <strong>spam</strong> or <strong>promotions</strong> folder.</span>
              </div>
            </div>
            
            {/* Resend Email Button */}
            <Button 
              variant="outline"
              className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resending}
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
            
            <Separator className="bg-border" />
            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full border-border text-foreground hover:bg-accent"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
              <Button 
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => setShowEmailConfirmation(false)}
              >
                Use a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5"></div>
      <Card className="w-full max-w-md shadow-2xl border-border bg-card/95 backdrop-blur-md relative">
        <CardHeader className="text-center space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-foreground bg-accent/30 hover:text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center">
            <img src={LOGO_URL} alt="TAAI Travel" className="h-[200px] w-auto" />
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className="bg-accent text-foreground border-border"
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
            <CardTitle className="text-2xl text-card-foreground">Create Your Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              {userType === 'individual'
                ? "Join thousands of travelers planning smarter trips"
                : "Streamline your corporate travel management"
              }
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
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {userType === 'individual' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-card-foreground">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-card-foreground">Username</Label>
                  <Input
                    id="userName"
                    placeholder="johndoe"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-card-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-card-foreground">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-card-foreground">Admin Contact Name</Label>
                <Input
                  id="adminName"
                  placeholder="Jane Smith"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registeredAddress" className="text-card-foreground">Registered Address</Label>
                <Input
                  id="registeredAddress"
                  placeholder="123 Business Ave, City, State 12345"
                  value={formData.registeredAddress}
                  onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-card-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </>
          )}

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
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <Label className="text-card-foreground">Verification</Label>
            <Captcha onVerify={(isValid) => setCaptchaValid(isValid)} />
          </div>

          <Button 
            className="w-full gold-gradient hover:opacity-90 text-primary-foreground font-semibold"
            onClick={handleSignup}
            disabled={loading || !captchaValid}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-primary hover:text-primary/80" onClick={() => navigate('/login')}>
              Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { PublicNavigation } from "@/components/shared/PublicNavigation";

// Input validation schema
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  companyName: z.string()
    .trim()
    .max(100, "Company name must be less than 100 characters")
    .optional(),
  inquiryType: z.enum(["individual", "corporate"]),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
});

const Contact = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    inquiryType: "individual" as "individual" | "corporate",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = contactSchema.parse(formData);

      const { error } = await supabase
        .from('contact_inquiries')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          company_name: validatedData.companyName || null,
          inquiry_type: validatedData.inquiryType,
          subject: validatedData.subject,
          message: validatedData.message
        });

      if (error) throw error;

      toast.success("Your message has been sent successfully! We'll get back to you soon.");
      
      setFormData({
        name: "",
        email: "",
        companyName: "",
        inquiryType: "individual",
        subject: "",
        message: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please check the form for errors");
      } else {
        console.error('Error submitting contact form:', error);
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border" variant="secondary">
            Get In Touch
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Contact Us
            <span className="luxury-text-gradient block">
              We're Here to Help
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you're planning your next adventure or need assistance with our platform, 
            we're ready to provide the support you need.
          </p>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <Card className="bg-card/60 border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Send us a message</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-foreground">Inquiry Type</Label>
                  <RadioGroup 
                    value={formData.inquiryType} 
                    onValueChange={(value) => handleInputChange('inquiryType', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="text-muted-foreground">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="corporate" id="corporate" />
                      <Label htmlFor="corporate" className="text-muted-foreground">Corporate</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    maxLength={100}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    maxLength={255}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                    placeholder="Enter your email address"
                  />
                  {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                </div>

                {formData.inquiryType === 'corporate' && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-foreground">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      maxLength={100}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                      placeholder="Enter your company name"
                    />
                    {errors.companyName && <p className="text-red-400 text-sm">{errors.companyName}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    maxLength={200}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                    placeholder="What can we help you with?"
                  />
                  {errors.subject && <p className="text-red-400 text-sm">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    maxLength={2000}
                    rows={6}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
                    placeholder="Tell us more about your inquiry... (10-2000 characters)"
                  />
                  {errors.message && <p className="text-red-400 text-sm">{errors.message}</p>}
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full gold-gradient hover:opacity-90 text-primary-foreground font-semibold py-6"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Get in touch</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Ready to revolutionize your travel planning? Our team is here to answer 
                your questions and help you get started with TAAI Travel.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="bg-accent/50 border-border hover:bg-accent transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Mail className="h-8 w-8 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">Email Us</h3>
                      <p className="text-muted-foreground">info@taai.travel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent/50 border-border hover:bg-accent transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <MapPin className="h-8 w-8 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">Visit Us</h3>
                      <p className="text-muted-foreground">Miami, Florida</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-6 rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border">
              <h3 className="text-foreground font-semibold mb-3">24/7 Support</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Our system works 24/7 to serve you.</p>
                <p>Our support team will respond to all inquiries within 72 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background text-foreground py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="max-h-8" />
          </div>
          <p className="text-muted-foreground mb-4">
            Revolutionizing travel planning with artificial intelligence
          </p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate('/what-we-do')}
            >
              What We Do
            </Button>
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate('/terms')}
            >
              Terms of Service
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;

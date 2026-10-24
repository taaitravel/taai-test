import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { describeAuthError } from '@/lib/auth/messages';
import { LOGO_URL } from '@/lib/constants';

const strong = (password: string) =>
  password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const save = async () => {
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!strong(password)) {
      toast({ title: 'Weak password', description: 'Use 8+ characters with upper, lower, number, and symbol.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not update password', description: describeAuthError(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated', description: 'You can keep planning.' });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <img src={LOGO_URL} alt="TAAI Travel" className="mx-auto h-24 w-auto" />
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>
            {ready ? 'This replaces the password for your taai account.' : 'Open the reset link from your email on this page. The link expires.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </div>
          <Button className="w-full gold-gradient text-primary-foreground" onClick={save} disabled={!ready || saving}>
            {saving ? 'Saving…' : 'Update password'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>Back to sign in</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: number;
  userid: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  comp_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  cell: number | null;
  user_type: string | null;
  countries_visited: any | null;
  flight_freq: any | null;
  p_airlines: any | null;
  p_hotels: any | null;
  p_car_rentals: any | null;
  avg_spending: number | null;
  taai_rating: number | null;
  taai_rating_text: string | null;
  itineraries: any | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  terms_version: string | null;
  date_format: string | null;
  avatar_url: string | null;
  bio: string | null;
  currency: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check for existing session FIRST
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        console.log('Initial session check:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener AFTER initial check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile with proper async handling
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userid', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('userid', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setUserProfile(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    // After email confirmation, redirect to terms page
    const redirectUrl = `${window.location.origin}/terms?fromSignup=true`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Handle email confirmation errors specifically
    if (error?.message === "Email not confirmed") {
      return { 
        error: { 
          ...error, 
          message: "Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it." 
        } 
      };
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const resendVerificationEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/terms?fromSignup=true`;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
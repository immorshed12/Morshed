import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (password.length < 6) {
      return toast.error('Password should be at least 6 characters');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const userDocRef = doc(db, 'users', user.uid);
      const isAdmin = user.email === 'immorshed068@gmail.com';
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name,
        email: email,
        role: isAdmin ? 'admin' : 'staff',
        createdAt: serverTimestamp(),
      });

      toast.success('Account created successfully');
      navigate('/');
    } catch (error: any) {
      let message = error.message || 'Failed to create account';
      if (error.code === 'auth/configuration-not-found') {
        message = 'Registration system is not enabled in Firebase. Please contact admin.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const isAdmin = user.email === 'immorshed068@gmail.com';
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email,
          role: isAdmin ? 'admin' : 'staff',
          createdAt: serverTimestamp(),
        });
      }

      toast.success('Signed in with Google');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary p-3 rounded-2xl w-fit shadow-lg shadow-primary/20">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">নতুন অ্যাকাউন্ট</CardTitle>
            <CardDescription className="text-base">
              ছৈয়দ স্টোর POS এ যোগ দিন
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium rounded-xl border-2 flex items-center justify-center gap-2 hover:bg-secondary/50" 
            onClick={signInWithGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google দিয়ে সাইন আপ করুন
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">অথবা ইমেইল ব্যবহার করুন</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (কমপক্ষে ৬ অক্ষর)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Sign Up
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t pt-6 pb-6">
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
    setSuccessMessage('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        // Login Logic with Supabase
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) throw loginError;

        navigate('/');
      } else {
        // Registration Logic with Supabase
        if (formData.username && formData.phone && formData.password && formData.confirmPassword && formData.email) {
          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
          }

          // 1. Sign up the user
          const { error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.username,
                phone: formData.phone,
              }
            }
          });

          if (signUpError) throw signUpError;

          setSuccessMessage('Registration successful! Please check your email for verification then sign in.');
          setIsLoading(false);
          setIsLogin(true); // Switch to login
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); // Clear passwords
        } else {
          setError('Please fill in all fields');
          setIsLoading(false);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <img
        src="/logo.jpg"
        alt="APD"
        className="absolute top-4 right-4 w-20 sm:w-29 h-auto rounded-lg shadow-md"
      />
      <h1 className="w-full text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-text-main mb-6 leading-tight whitespace-nowrap">
        The Association of People with Disability
      </h1>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/rehab-logo.png"
            alt="Rehab on Wheels"
            className="mx-auto mb-3 w-72 max-w-full h-auto rounded-xl shadow-md"
          />
          <p className="text-xs text-text-muted italic mb-2">A program by APD</p>
          <p className="text-text-muted">
            {isLogin ? 'Sign in to manage rehabilitation services' : 'Create an account to get started'}
          </p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="please enter the name "
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="admin@row.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (formData.confirmPassword && e.target.value !== formData.confirmPassword) {
                  setError('Passwords do not match');
                } else {
                  setError('');
                }
              }}
              required
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (formData.password && e.target.value && formData.password !== e.target.value) {
                    setError('Passwords do not match');
                  } else {
                    setError('');
                  }
                }}
                required
              />
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg bg-opacity-50">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg bg-opacity-50">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full justify-center py-3 text-lg"
              disabled={isLoading}
            >
              {isLoading
                ? (isLogin ? 'Signing in...' : 'Registering...')
                : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>



            <div className="text-center mt-4 space-y-2">
              {isLogin && (
                <a href="#" className="block text-sm text-primary hover:text-primary-dark font-medium hover:underline">
                  Forgot your password?
                </a>
              )}
              <div className="text-sm text-text-muted">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary hover:text-primary-dark font-medium hover:underline focus:outline-none"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center mt-8 text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Rehab on Wheels. All rights reserved.
        </p>
      </div>
    </div>
  );
}

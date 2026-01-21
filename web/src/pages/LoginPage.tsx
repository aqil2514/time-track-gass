import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api-client'
import { useAuthStore } from '../hooks/use-auth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const response = await apiClient.login({ email, password })
        setAuth(response.data.user, response.data.token)
        navigate('/dashboard')
      } else {
        await apiClient.register({ email, password, name })
        // Auto-login after registration
        const response = await apiClient.login({ email, password })
        setAuth(response.data.user, response.data.token)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/20 mb-4">
            <span className="text-2xl font-bold text-primary-foreground">TT</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">TimeTrack</h1>
          <p className="text-muted-foreground">The invisible productivity tracker</p>
        </div>

        <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-3xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Join TimeTrack to start tracking your focus'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  label="Name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/20"
                />
              )}
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/20"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-black/20"
              />
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in shake duration-300">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full shadow-lg shadow-primary/20 h-11" disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {isLogin ? "New here? Create an account" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 TimeTrack Inc. Built for deep focus.
        </p>
      </div>
    </div>
  )
}

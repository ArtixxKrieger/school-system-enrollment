import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpenCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #02310a 0%, #0a6901 50%, #1a8f0a 100%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 py-12 text-white w-1/2">
        <div className="max-w-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpenCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">KURIOS</h1>
              <p className="text-green-200 text-sm">ENROLLMENT SYSTEM</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Manage enrollment<br />with confidence.
          </h2>
          <p className="text-green-200/80 text-lg">
            A complete enrollment management platform for students, staff, and faculty.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { label: "Student Records", desc: "Centralized master list" },
              { label: "Pre-Registration", desc: "Online enrollment portal" },
              { label: "Curriculum", desc: "Subject management" },
              { label: "Role Control", desc: "Access & permissions" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-green-200/70 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 px-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-lg bg-green-900 flex items-center justify-center">
                <BookOpenCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900">KURIOS</p>
                <p className="text-xs text-muted-foreground">ENROLLMENT SYSTEM</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your credentials to access the system</p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription data-testid="text-login-error">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  data-testid="input-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-900 hover:bg-green-800" disabled={loading} data-testid="button-submit-login">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center">
                New student?{" "}
                <a href="/pre-register" className="text-green-700 hover:text-green-900 font-medium">
                  Pre-register here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

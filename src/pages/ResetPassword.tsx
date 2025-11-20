import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getPasswordStrength = (pwd: string): { level: 'weak' | 'medium' | 'strong', color: string, text: string } => {
    if (pwd.length < 6) return { level: 'weak', color: 'bg-destructive', text: 'Parolă slabă' };
    if (pwd.length < 10) return { level: 'medium', color: 'bg-warning', text: 'Parolă medie' };
    
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*]/.test(pwd);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (strength >= 3) return { level: 'strong', color: 'bg-green-500', text: 'Parolă puternică' };
    return { level: 'medium', color: 'bg-warning', text: 'Parolă medie' };
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Eroare",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Succes!",
        description: "Parola a fost schimbată cu succes! Loghează-te cu noua parolă.",
      });

      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut reseta parola.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen bg-gradient-ocean dark:bg-gradient-to-br dark:from-primary-dark dark:to-primary transition-colors duration-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/jinfologo.png" alt="JinfoTours.ro" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">JinfoApp</h1>
          <p className="text-primary-foreground/80">by JinfoTours.ro</p>
        </div>

        <Card className="bg-card/95 dark:bg-card/90 backdrop-blur-sm border-border/20 dark:border-border/10 transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-center text-xl">Resetare Parolă</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Parolă Nouă</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'weak' ? passwordStrength.color : 'bg-muted'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'medium' || passwordStrength.level === 'strong' ? passwordStrength.color : 'bg-muted'}`} />
                      <div className={`h-1 flex-1 rounded ${passwordStrength.level === 'strong' ? passwordStrength.color : 'bg-muted'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{passwordStrength.text}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmă Parola</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Parolele nu coincid</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || !password || password !== confirmPassword}>
                {loading ? "Se salvează..." : "Salvează Parola Nouă"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

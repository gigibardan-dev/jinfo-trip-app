import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nume: "",
    prenume: "",
    telefon: "",
    role: "tourist"
  });
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (!error) {
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid.",
        variant: "destructive",
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Eroare",
        description: "Parola trebuie să aibă cel puțin 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(signupData.email, signupData.password, {
      nume: signupData.nume,
      prenume: signupData.prenume,
      telefon: signupData.telefon,
      role: signupData.role
    });
    
    if (!error) {
      navigate("/");
    }
    setLoading(false);
  };

  const fillDemoData = (type: 'admin' | 'tourist') => {
    if (type === 'admin') {
      setLoginData({
        email: "admin@travelpro.ro",
        password: "admin123"
      });
    } else {
      setLoginData({
        email: "turist@travelpro.ro", 
        password: "turist123"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-ocean flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <Plane className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">TravelPro</h1>
          <p className="text-primary-foreground/80">Platforma ta de călătorii</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border/20">
          <CardHeader>
            <CardTitle className="text-center text-xl">Autentificare</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Conectare</TabsTrigger>
                <TabsTrigger value="signup">Înregistrare</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="adresa@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Parolă</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Se conectează..." : "Conectare"}
                  </Button>
                </form>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">Conturi demo:</p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => fillDemoData('admin')}
                    >
                      Admin Demo
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => fillDemoData('tourist')}
                    >
                      Turist Demo
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nume">Nume</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nume"
                          type="text"
                          placeholder="Popescu"
                          value={signupData.nume}
                          onChange={(e) => setSignupData({ ...signupData, nume: e.target.value })}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prenume">Prenume</Label>
                      <Input
                        id="prenume"
                        type="text"
                        placeholder="Ion"
                        value={signupData.prenume}
                        onChange={(e) => setSignupData({ ...signupData, prenume: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="adresa@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefon">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefon"
                        type="tel"
                        placeholder="+40 7xx xxx xxx"
                        value={signupData.telefon}
                        onChange={(e) => setSignupData({ ...signupData, telefon: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Tip cont</Label>
                    <Select value={signupData.role} onValueChange={(value) => setSignupData({ ...signupData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează tipul contului" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tourist">Turist</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Parolă</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmă parola</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Se înregistrează..." : "Înregistrare"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
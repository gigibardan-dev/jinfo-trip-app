import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone,
  Download,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emergencyAlerts: boolean;
  shareLocation: boolean;
  dataCollection: boolean;
  analyticsEnabled: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  downloadOnWifi: boolean;
  cacheLimit: number;
  twoFactorAuth: boolean;
  sessionTimeout: number;
}

const SETTINGS_KEY = "app_settings";

export const SettingsPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    emergencyAlerts: true,
    shareLocation: true,
    dataCollection: true,
    analyticsEnabled: true,
    offlineMode: true,
    autoSync: true,
    downloadOnWifi: true,
    cacheLimit: 1000,
    twoFactorAuth: false,
    sessionTimeout: 30
  });

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }
    calculateStorageUsage();
  }, []);

  const calculateStorageUsage = async () => {
    try {
      // Mock storage calculation for now
      setStorageInfo({
        used: 0,
        total: settings.cacheLimit
      });
    } catch (error) {
      console.error("Error calculating storage:", error);
    }
  };

  const updateSetting = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({
        title: "Setări salvate",
        description: "Preferințele tale au fost actualizate cu succes.",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut salva setările.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu se potrivesc.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Eroare",
        description: "Parola trebuie să aibă minim 6 caractere.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Parolă schimbată",
        description: "Parola ta a fost actualizată cu succes.",
      });
      
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut schimba parola.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      await calculateStorageUsage();
      toast({
        title: "Cache șters",
        description: "Toate datele din cache au fost șterse.",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge cache-ul.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      const exportData = {
        profile,
        settings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `date-jinfo-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export reușit",
        description: "Datele tale au fost exportate.",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut exporta datele.",
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: SettingsState = {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      emergencyAlerts: true,
      shareLocation: true,
      dataCollection: true,
      analyticsEnabled: true,
      offlineMode: true,
      autoSync: true,
      downloadOnWifi: true,
      cacheLimit: 1000,
      twoFactorAuth: false,
      sessionTimeout: 30
    };
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    toast({
      title: "Setări resetate",
      description: "Toate setările au fost resetate la valorile implicite.",
    });
  };

  const handleDeleteAccount = async () => {
    try {
      toast({
        title: "Solicitare trimisă",
        description: "Un administrator va procesa cererea ta de ștergere a contului.",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge contul.",
        variant: "destructive",
      });
    }
  };

  const cachePercentage = storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Setări</h1>
        <Button onClick={handleSaveSettings} className="bg-primary">
          <Save className="w-4 h-4 mr-2" />
          Salvează Modificările
        </Button>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="notifications">Notificări</TabsTrigger>
          <TabsTrigger value="privacy">Confidențialitate</TabsTrigger>
          <TabsTrigger value="app">Aplicație</TabsTrigger>
          <TabsTrigger value="account">Cont</TabsTrigger>
          <TabsTrigger value="data">Date</TabsTrigger>
        </TabsList>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Setări Notificări
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="email-notifications">Notificări Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Primește notificări prin email pentru actualizări importante
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="push-notifications">Notificări Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificări în aplicație pentru actualizări în timp real
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sms-notifications">Notificări SMS</Label>
                    <Badge variant="outline" className="text-xs">În curând</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Primește SMS-uri pentru notificări critice
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="emergency-alerts">Alerte de Urgență</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerte importante pentru siguranța călătoriei
                  </p>
                  <Badge variant="destructive" className="mt-1">Recomandat</Badge>
                </div>
                <Switch
                  id="emergency-alerts"
                  checked={settings.emergencyAlerts}
                  onCheckedChange={(checked) => updateSetting("emergencyAlerts", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Setări Confidențialitate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="share-location">Partajare Locație</Label>
                    <Badge variant="outline" className="text-xs">În curând</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Permite aplicației să acceseze locația pentru funcții avansate
                  </p>
                </div>
                <Switch
                  id="share-location"
                  checked={settings.shareLocation}
                  onCheckedChange={(checked) => updateSetting("shareLocation", checked)}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="data-collection">Colectare Date</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite colectarea datelor pentru îmbunătățirea serviciilor
                  </p>
                </div>
                <Switch
                  id="data-collection"
                  checked={settings.dataCollection}
                  onCheckedChange={(checked) => updateSetting("dataCollection", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Partajare date de utilizare pentru analiză
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => updateSetting("analyticsEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Setări Aplicație
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="offline-mode">Mod Offline</Label>
                  <p className="text-sm text-muted-foreground">
                    Activează funcționalitatea offline pentru călătorii
                  </p>
                  <Badge variant="secondary" className="mt-1">Recomandat</Badge>
                </div>
                <Switch
                  id="offline-mode"
                  checked={settings.offlineMode}
                  onCheckedChange={(checked) => updateSetting("offlineMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auto-sync">Sincronizare Automată</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincronizează automat datele când ești online
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => updateSetting("autoSync", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="download-wifi">Download doar pe Wi-Fi</Label>
                  <p className="text-sm text-muted-foreground">
                    Limitează download-urile mari la conexiunile Wi-Fi
                  </p>
                </div>
                <Switch
                  id="download-wifi"
                  checked={settings.downloadOnWifi}
                  onCheckedChange={(checked) => updateSetting("downloadOnWifi", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-limit">Limită Cache (MB)</Label>
                <Input
                  id="cache-limit"
                  type="number"
                  value={settings.cacheLimit}
                  onChange={(e) => updateSetting("cacheLimit", parseInt(e.target.value))}
                  className="w-32"
                />
                <div className="text-sm text-muted-foreground">
                  Utilizat: {storageInfo.used}MB din {storageInfo.total}MB ({cachePercentage.toFixed(1)}%)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Setări Cont
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="two-factor">Autentificare cu Doi Factori</Label>
                    <Badge variant="outline" className="text-xs">În curând</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Adaugă un nivel suplimentar de securitate contului
                  </p>
                  <Badge variant="secondary" className="mt-1">Recomandat</Badge>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Timeout Sesiune (minute)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Durata după care sesiunea expiră în caz de inactivitate
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Schimbare Parolă</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Parola Nouă</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isChangingPassword}
                        minLength={6}
                        placeholder="Minim 6 caractere"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmă Parola Nouă</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isChangingPassword}
                        minLength={6}
                        placeholder="Reintroduceți parola"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={!newPassword || !confirmPassword || isChangingPassword}
                  >
                    {isChangingPassword ? "Se schimbă..." : "Schimbă Parola"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Gestionare Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Șterge Cache
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ștergi cache-ul?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Toate documentele și datele salvate offline vor fi șterse. Această acțiune nu poate fi anulată.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anulează</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearCache}>
                        Șterge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportă Date
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resetează Setări
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resetezi setările?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Toate preferințele tale vor fi resetate la valorile implicite.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anulează</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetSettings}>
                        Resetează
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Informații Stocare</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cache offline:</span>
                    <span>{storageInfo.used}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limită configurată:</span>
                    <span>{storageInfo.total}MB</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Utilizare:</span>
                    <span>{cachePercentage.toFixed(1)}%</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={calculateStorageUsage}
                  className="w-full mt-3"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Reîmprospătează
                </Button>
              </div>

              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Zona Periculoasă
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Aceste acțiuni sunt permanente și nu pot fi anulate.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Șterge Contul
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Această acțiune nu poate fi anulată. Aceasta va șterge permanent contul tău și va elimina datele tale de pe serverele noastre.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anulează</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Șterge contul
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

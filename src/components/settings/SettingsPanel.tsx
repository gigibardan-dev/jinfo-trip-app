import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone,
  Globe,
  Download,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from "lucide-react";

interface SettingsState {
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emergencyAlerts: boolean;
  
  // Privacy Settings
  shareLocation: boolean;
  dataCollection: boolean;
  analyticsEnabled: boolean;
  
  // App Settings
  offlineMode: boolean;
  autoSync: boolean;
  downloadOnWifi: boolean;
  cacheLimit: number; // in MB
  
  // Account Settings
  twoFactorAuth: boolean;
  sessionTimeout: number; // in minutes
}

export const SettingsPanel = () => {
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateSetting = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log("Saving settings:", settings);
    // Here you would typically save to backend/localStorage
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert("Parolele nu se potrivesc");
      return;
    }
    console.log("Changing password");
    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleClearCache = () => {
    console.log("Clearing cache");
  };

  const handleExportData = () => {
    console.log("Exporting data");
  };

  const getCacheUsage = () => {
    // Mock data
    return { used: 750, total: settings.cacheLimit };
  };

  const cacheUsage = getCacheUsage();
  const cachePercentage = (cacheUsage.used / cacheUsage.total) * 100;

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
                <div>
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
                <div>
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
                <div>
                  <Label htmlFor="sms-notifications">Notificări SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Primește SMS-uri pentru notificări critice
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
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
                <div>
                  <Label htmlFor="share-location">Partajare Locație</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite aplicației să acceseze locația pentru funcții avansate
                  </p>
                </div>
                <Switch
                  id="share-location"
                  checked={settings.shareLocation}
                  onCheckedChange={(checked) => updateSetting("shareLocation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
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
                <div>
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
                <div>
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
                <div>
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
                <div>
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
                  Utilizat: {cacheUsage.used}MB din {cacheUsage.total}MB ({cachePercentage.toFixed(1)}%)
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
                <div>
                  <Label htmlFor="two-factor">Autentificare cu Doi Factori</Label>
                  <p className="text-sm text-muted-foreground">
                    Adaugă un nivel suplimentar de securitate contului
                  </p>
                  <Badge variant="secondary" className="mt-1">Recomandat</Badge>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
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
                    <Label htmlFor="current-password">Parola Curentă</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
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
                    <Label htmlFor="new-password">Parola Nouă</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmă Parola Nouă</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button onClick={handlePasswordChange} disabled={!currentPassword || !newPassword || !confirmPassword}>
                    Schimbă Parola
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
                <Button variant="outline" onClick={handleClearCache}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge Cache
                </Button>
                
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportă Date
                </Button>
                
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resetează Setări
                </Button>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Informații Stocare</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cache aplicație:</span>
                    <span>{cacheUsage.used}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date utilizator:</span>
                    <span>15MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imagini offline:</span>
                    <span>230MB</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{cacheUsage.used + 15 + 230}MB</span>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h4 className="font-semibold text-destructive mb-2">Zona Periculoasă</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Aceste acțiuni sunt permanente și nu pot fi anulate.
                </p>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge Contul
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
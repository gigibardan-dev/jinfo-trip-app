import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

const ProfilePage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nume: profile?.nume || "",
    prenume: profile?.prenume || "",
    telefon: profile?.telefon || "",
    avatar_url: profile?.avatar_url || "",
  });

  const getUserRole = (): "admin" | "tourist" | "guide" => {
    if (!profile?.role) return "tourist";
    return profile.role as "admin" | "tourist" | "guide";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation userRole={getUserRole()} />
        <div className="pt-14 pb-4 p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nume: formData.nume,
          prenume: formData.prenume,
          telefon: formData.telefon,
          avatar_url: formData.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profil actualizat",
        description: "Informațiile tale au fost salvate cu succes.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut salva modificările.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nume: profile.nume,
      prenume: profile.prenume,
      telefon: profile.telefon || "",
      avatar_url: profile.avatar_url || "",
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    const first = formData.prenume?.[0] || "";
    const last = formData.nume?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (profile.role) {
      case "admin":
        return "bg-destructive text-destructive-foreground";
      case "guide":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole={getUserRole()} />
      <div className="pt-14 pb-4">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
          <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Profilul meu</CardTitle>
            <CardDescription>
              Vizualizează și actualizează informațiile tale personale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={formData.avatar_url} alt="Avatar" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors shadow-medium">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                {profile.role === "admin" ? "Administrator" : profile.role === "guide" ? "Ghid" : "Turist"}
              </span>
            </div>

            {/* Avatar URL Input (only in edit mode) */}
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  URL Avatar
                </Label>
                <Input
                  id="avatar_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  className="bg-background"
                />
              </div>
            )}

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="prenume" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Prenume
              </Label>
              <Input
                id="prenume"
                type="text"
                value={formData.prenume}
                onChange={(e) =>
                  setFormData({ ...formData, prenume: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/50" : "bg-background"}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="nume" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nume
              </Label>
              <Input
                id="nume"
                type="text"
                value={formData.nume}
                onChange={(e) =>
                  setFormData({ ...formData, nume: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/50" : "bg-background"}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="telefon" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefon
              </Label>
              <Input
                id="telefon"
                type="tel"
                placeholder="+40 700 000 000"
                value={formData.telefon}
                onChange={(e) =>
                  setFormData({ ...formData, telefon: e.target.value })
                }
                disabled={!isEditing}
                className={!isEditing ? "bg-muted/50" : "bg-background"}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  Editează profilul
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Se salvează..." : "Salvează"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Anulează
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

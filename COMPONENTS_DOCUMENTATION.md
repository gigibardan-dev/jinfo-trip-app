# TravelPro PWA - Documentație Componente

## Structura Proiectului

```
src/
├── components/
│   ├── shared/          # Componente reutilizabile
│   ├── communications/  # Sistem comunicări
│   ├── offline/        # Management offline
│   ├── settings/       # Panoul de setări
│   ├── ui/            # Componente UI de bază (shadcn)
│   └── *.tsx          # Componente principale dashboard
├── hooks/             # Custom hooks
├── pages/             # Pagini principale
├── lib/               # Utilități
└── integrations/      # Integrări externe (Supabase)
```

## 🔧 Componente Principale

### 1. **AdminDashboard.tsx**
**Descriere:** Dashboard principal pentru administratori
**Funcționalități:**
- Statistici generale (călătorii active, turiști, documente, alerte)
- Lista călătoriilor recente cu status și progres
- Alerte și notificări administrative
- Metrici de performanță

**Props:** Fără props
**Dependencies:** Card, Button, Badge, Lucide icons

---

### 2. **TouristDashboard.tsx**
**Descriere:** Dashboard pentru turiști cu informații despre călătoria curentă
**Funcționalități:**
- Header cu informații călătorie (destinație, ziua curentă, vreme)
- Acțiuni rapide (Itinerariu, Documente, Hărți, Check-in)
- Programul zilei cu activități
- Status grup și informații offline

**Props:** Fără props
**Dependencies:** Card, Button, Badge, Progress

---

### 3. **TripManager.tsx**
**Descriere:** Gestionarea completă a călătoriilor (CRUD)
**Funcționalități:**
- Creare/editare călătorii noi
- Filtrare după grup și status
- Management buget estimativ
- Asignare grup turist

**Props:** Fără props
**Database:** trips, tourist_groups
**Permissions:** Admin only

---

### 4. **ItineraryManager.tsx**
**Descriere:** Gestionarea itinerariilor zilnice și activităților
**Funcționalități:**
- Creare zile itinerariu
- Adăugare activități cu tipuri diverse
- Programare cu ore start/end
- Management referințe booking și note

**Props:** Fără props
**Database:** itinerary_days, itinerary_activities
**Permissions:** Admin (write), Tourist (read)

---

### 5. **DocumentManager.tsx**
**Descriere:** Gestionarea documentelor și fișierelor
**Funcționalități:**
- Upload documente cu categorii
- Setări vizibilitate (public/privat/grup)
- Management date expirare
- Prioritate offline

**Props:** Fără props
**Database:** documents
**Storage:** Supabase Storage

---

### 6. **Navigation.tsx**
**Descriere:** Navigația principală cu switch între Admin/Tourist
**Props:**
- `userRole?: "admin" | "tourist"` - Rolul utilizatorului

**Funcționalități:**
- Navigare contextuală pe rol
- Logout functionality
- Design responsive

---

## 🔄 Componente Reutilizabile (Shared)

### 1. **StatsCard.tsx**
**Descriere:** Card pentru afișare statistici
**Props:**
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
}
```

### 2. **ActivityCard.tsx**
**Descriere:** Card pentru afișare activități din itinerariu
**Props:**
```typescript
interface ActivityCardProps {
  time: string;
  title: string;
  location: string;
  status: "completed" | "upcoming" | "ongoing";
  type: "meal" | "attraction" | "transport" | "accommodation" | string;
  isNext?: boolean;
  onNavigate?: () => void;
  onViewDetails?: () => void;
}
```

### 3. **TripCard.tsx**
**Descriere:** Card pentru afișare călătorii
**Props:**
```typescript
interface TripCardProps {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate?: string;
  tourists: number;
  status: "draft" | "active" | "confirmed" | "completed" | "cancelled";
  progress?: number;
  coverImage?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}
```

---

## 📱 Componente Funcționale

### 1. **CommunicationCenter.tsx**
**Descriere:** Centru pentru comunicări și notificări
**Funcționalități:**
- Trimitere mesaje (broadcast/grup/individual)
- Istoric comunicări cu filtrare
- Programare mesaje pentru viitor
- Tracking citire mesaje

**Database:** communications, communication_reads

### 2. **OfflineManager.tsx**
**Descriere:** Management funcționalitate offline
**Funcționalități:**
- Monitoring spațiu cache
- Sincronizare resurse offline
- Management priorități download
- Status conectivitate

**Database:** offline_cache_status

### 3. **SettingsPanel.tsx**
**Descriere:** Panel complet de setări aplicație
**Secțiuni:**
- **Notificări:** Email, Push, SMS, Emergency alerts
- **Confidențialitate:** Locație, colectare date, analytics
- **Aplicație:** Mod offline, sincronizare, cache limit
- **Cont:** 2FA, timeout sesiune, schimbare parolă
- **Date:** Export, import, resetare

---

## 🗄️ Structura Bazei de Date

### Tabele Principale:
1. **profiles** - Profiluri utilizatori (admin/tourist)
2. **tourist_groups** - Grupuri de turiști
3. **group_members** - Membri în grupuri
4. **trips** - Călătorii cu detalii
5. **itinerary_days** - Zile din itinerariu
6. **itinerary_activities** - Activități zilnice
7. **documents** - Documente și fișiere
8. **communications** - Mesaje și comunicări
9. **communication_reads** - Status citire mesaje
10. **offline_cache_status** - Status cache offline

### Row Level Security (RLS):
- **Admins:** Access complet la toate datele
- **Tourists:** Access doar la datele grupurilor lor
- **Funcții:** `is_admin()`, `user_in_group(group_id)`

---

## 🎨 Design System

### Culori Semantice:
```css
--primary: Ocean Blue theme
--success: Verde pentru status pozitiv
--warning: Galben pentru atenționări
--destructive: Roșu pentru erori/ștergeri
--accent: Albastru deschis pentru accente
--muted: Gri pentru text secundar
```

### Componente UI (shadcn/ui):
- Card, Button, Badge, Input, Textarea
- Tabs, Progress, Switch, Select
- Dialog, Alert, Toast, Skeleton
- Navigation, Sidebar, Dropdown

---

## 🔐 Autentificare și Autorizare

### Roluri:
- **admin:** Access complet, management turiști și călătorii
- **tourist:** Access readonly la călătoriile proprii

### Guard Functions:
```typescript
// În componente
const { user, profile } = useAuth();
const isAdmin = profile?.role === 'admin';

// În database (RLS)
is_admin() // Verifică dacă utilizatorul este admin
user_in_group(group_id) // Verifică dacă utilizatorul e în grup
```

---

## 📱 PWA Features

### Offline First:
- Cache management pentru hărți și documente
- Sincronizare background când online
- Indicatori status conectivitate

### Service Worker:
- Cache strategii pentru resurse
- Background sync pentru date
- Push notifications

### Storage:
- **Supabase Storage:** Fișiere și imagini
- **Local Storage:** Setări utilizator
- **Cache API:** Resurse offline

---

## 🚀 Deployment și Setup

### Variabile Environment:
```
SUPABASE_URL=https://zbepoxajjdxhkwotfelh.supabase.co
SUPABASE_ANON_KEY=[key]
```

### Dependencies Principale:
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Supabase (backend)
- React Router (routing)
- Lucide React (icons)

### Comenzi Development:
```bash
npm run dev      # Start development server
npm run build    # Build pentru production
npm run preview  # Preview build local
```

---

## 📋 TODO și Îmbunătățiri Viitoare

### Prioritate Mare:
- [ ] Implementare notificări push reale
- [ ] Integrare hărți offline (Mapbox/Google Maps)
- [ ] Chat real-time între turiști
- [ ] Sistem plăți și facturare

### Prioritate Medie:
- [ ] Geolocație și tracking în timp real
- [ ] Widget vremea integrată
- [ ] Export rapoarte PDF
- [ ] Multi-language support

### Prioritate Mică:
- [ ] Teme dark/light customizabile
- [ ] Integrare social media
- [ ] Sistem rating și review-uri
- [ ] Analytics avansate utilizare

---

## 🆘 Debugging și Maintenance

### Loguri și Monitoring:
- **Supabase Dashboard:** Pentru erori database
- **Browser Console:** Pentru erori frontend
- **Network Tab:** Pentru probleme API

### Probleme Comune:
1. **RLS Errors:** Verificați politicile și permisiunile
2. **Upload Fails:** Verificați storage policies
3. **Offline Issues:** Verificați service worker și cache
4. **Auth Issues:** Verificați configurația Supabase

### Support și Contact:
- Documentație: `/COMPONENTS_DOCUMENTATION.md`
- Issues: GitHub repository
- Admin contact: admin@travelpro.ro

---

*Ultima actualizare: Martie 2024*
*Versiune: 1.0.0*
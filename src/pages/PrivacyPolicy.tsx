import Navigation from '@/components/shared/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-16 pb-24 container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Politica de Confidențialitate
            </h1>
            <p className="text-muted-foreground">
              JinfoApp - Aplicație de management călătorii
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                Actualizat: {new Date().toLocaleDateString('ro-RO', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Badge>
              <Badge variant="outline">GDPR Compliant</Badge>
            </div>
          </div>

          {/* Alert Important */}
          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Shield className="h-5 w-5 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Această politică explică cum JinfoApp colectează, folosește și protejează datele tale personale 
              în conformitate cu Regulamentul General privind Protecția Datelor (GDPR - UE 2016/679) și 
              Legea nr. 190/2018 privind protecția datelor în România.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Section 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">1.</span> Introducere
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p className="leading-relaxed">
                  JinfoApp ("<strong>noi</strong>", "<strong>nostru</strong>", "<strong>aplicația</strong>") este o aplicație de management 
                  al călătoriilor dezvoltată de <strong>JinfoTours.ro</strong>. Ne angajăm să protejăm și să respectăm confidențialitatea 
                  utilizatorilor noștri.
                </p>
                <p className="leading-relaxed mt-3">
                  Această Politică de Confidențialitate explică ce date personale colectăm, de ce le colectăm, cum le folosim, 
                  cui le divulgăm, cum le protejăm și care sunt drepturile tale conform GDPR.
                </p>
                <p className="leading-relaxed mt-3">
                  <strong>Operator de date:</strong> JinfoTours.ro<br />
                  <strong>Aplicație:</strong> JinfoApp<br />
                  <strong>Tip utilizatori:</strong> Turiști, ghizi turistici, administratori agenție
                </p>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">2.</span> Date Personale Colectate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.1. Date de Identificare și Contact</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Nume și prenume</li>
                    <li>Adresă de email (folosită și pentru autentificare)</li>
                    <li>Număr de telefon (opțional)</li>
                    <li>Fotografie de profil (opțional, încărcat de utilizator)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.2. Date de Autentificare</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Email și parolă (stocată în format criptat hash cu bcrypt)</li>
                    <li>Tokenuri de sesiune (pentru menținerea conectării)</li>
                    <li>Istoricul autentificărilor</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.3. Date despre Călătorii</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Destinații selectate, itinerare, activități planificate</li>
                    <li>Informații despre grup (apartenență la grupuri de turiști)</li>
                    <li>Documente încărcate (bilete, voucher-uri, asigurări)</li>
                    <li>Preferințe și setări personalizate</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.4. Date de Comunicare</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Mesaje trimise și primite în aplicație (între turiști, ghizi, administratori)</li>
                    <li>Istoricul conversațiilor</li>
                    <li>Notificări și comunicări primite</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.5. Date Tehnice</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Adresă IP, tip browser, sistem de operare</li>
                    <li>Tip dispozitiv (mobil, tabletă, desktop)</li>
                    <li>Data și ora accesării aplicației</li>
                    <li>Cookies și tehnologii similare (vezi Secțiunea 9)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">2.6. Date de Localizare (opțional)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Coordonate GPS (doar dacă acordați permisiune explicit)</li>
                    <li>Folosite pentru funcționalitatea hărților offline și navigare</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">3.</span> Scopul și Baza Legală a Procesării
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">3.1. Executarea Contractului</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scop:</strong> Furnizarea serviciilor de management al călătoriilor (itinerare, documente, comunicare)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Bază legală:</strong> Art. 6(1)(b) GDPR - necesare pentru executarea contractului cu utilizatorul
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">3.2. Consimțământul Utilizatorului</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scop:</strong> Marketing, cookies non-esențiale, procesări opționale
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Bază legală:</strong> Art. 6(1)(a) GDPR - consimțământ explicit și liber acordat
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">3.3. Interes Legitim</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scop:</strong> Îmbunătățirea serviciilor, prevenirea fraudelor, securitate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Bază legală:</strong> Art. 6(1)(f) GDPR - interes legitim al operatorului, cu respectarea drepturilor utilizatorilor
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">3.4. Obligații Legale</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scop:</strong> Conformitate cu legislația fiscală, contabilă, comercială
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Bază legală:</strong> Art. 6(1)(c) GDPR - respectarea obligațiilor legale
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">4.</span> Partajarea și Divulgarea Datelor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Principiu:</strong> Nu vindem, închiriem sau comercializăm datele tale personale către terți.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.1. În Cadrul Aplicației</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Ghizi turistici:</strong> Văd datele turiștilor din grupurile lor (nume, telefon, documente relevante)</li>
                    <li><strong>Administratori:</strong> Accesează toate datele pentru management și suport</li>
                    <li><strong>Alți turiști din grup:</strong> Pot vedea numele și fotografia de profil</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.2. Furnizori de Servicii Terți (GDPR Compliant)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Supabase:</strong> Platformă de stocare date și autentificare (GDPR compliant, servere în UE)</li>
                    <li><strong>Vercel:</strong> Hosting aplicație web (GDPR compliant)</li>
                    <li><strong>OpenStreetMap:</strong> Servicii de hartă (open-source, fără colectare date personale)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toți furnizorii noștri terți au încheiate acorduri de procesare a datelor (DPA - Data Processing Agreements) 
                    și respectă cerințele GDPR pentru transferul și protecția datelor.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.3. Autorități și Cerințe Legale</h3>
                  <p className="text-sm text-muted-foreground">
                    Putem divulga date personale către autorități publice (poliție, instanțe, ANSPDCP) dacă este obligatoriu 
                    conform legii sau pentru protejarea drepturilor noastre și ale utilizatorilor.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">5.</span> Transfer Internațional de Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Datele tale sunt stocate principal în Uniunea Europeană (UE) prin intermediul Supabase (servere în UE).
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  În cazul în care datele sunt transferate în afara UE/SEE, ne asigurăm că:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Țara destinație beneficiază de o decizie de adecvare din partea Comisiei Europene</li>
                  <li>Sunt implementate clauze contractuale standard (SCC) aprobate de Comisia Europeană</li>
                  <li>Se aplică alte garanții adecvate conform Art. 46 GDPR</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">6.</span> Perioada de Păstrare a Datelor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">Conturi Active:</p>
                  <p className="text-sm text-muted-foreground">
                    Datele sunt păstrate atât timp cât contul este activ și serviciile sunt utilizate.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-sm text-foreground">După Ștergerea Contului:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Datele personale sunt șterse în maximum <strong>30 de zile</strong></li>
                    <li>Backup-urile sunt suprascrise în maximum <strong>90 de zile</strong></li>
                    <li>Date anonimizate pot fi păstrate pentru statistici (fără identificare personală)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-sm text-foreground">Obligații Legale:</p>
                  <p className="text-sm text-muted-foreground">
                    Anumite date pot fi păstrate mai mult pentru respectarea obligațiilor legale 
                    (ex: arhivare fiscală 10 ani conform legislației române).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">7.</span> Drepturile Tale GDPR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-primary/5">
                  <AlertDescription className="text-sm">
                    Conform GDPR, beneficiezi de următoarele drepturi în legătură cu datele tale personale:
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 15</Badge> Dreptul de Acces
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți solicita o copie completă a tuturor datelor personale pe care le deținem despre tine, 
                    în format electronic structurat.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 16</Badge> Dreptul la Rectificare
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți corecta date inexacte sau incomplete direct din aplicație (Profil → Editează) sau prin contact cu noi.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 17</Badge> Dreptul la Ștergere ("Dreptul de a fi uitat")
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți șterge contul și toate datele asociate din Setări → Cont → Șterge Cont. 
                    Datele vor fi eliminate complet în 30 de zile.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 18</Badge> Dreptul la Restricționarea Procesării
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți solicita restricționarea temporară a procesării datelor tale în anumite situații 
                    (ex: contestarea acurateței datelor).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 20</Badge> Dreptul la Portabilitate
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți exporta datele tale într-un format structurat, utilizat în mod curent și care poate fi citit automat (JSON/CSV).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 21</Badge> Dreptul de Opoziție
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți refuza anumite procesări bazate pe interes legitim sau marketing direct.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 22</Badge> Dreptul de a Nu Fi Supus Deciziilor Automatizate
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nu folosim profilare automată sau decizii bazate exclusiv pe procesare automată.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <Badge variant="outline">Art. 7(3)</Badge> Dreptul de Retragere a Consimțământului
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Poți retrage consimțământul oricând (ex: pentru cookies non-esențiale) fără consecințe negative.
                  </p>
                </div>

                <Alert className="mt-4">
                  <AlertDescription className="text-sm">
                    <strong>Cum exerciți aceste drepturi?</strong><br />
                    Trimite un email la <a href="mailto:privacy@jinfotours.ro" className="text-primary underline">privacy@jinfotours.ro</a> sau 
                    contactează-ne prin metodele din Secțiunea 11. Răspundem la cereri în maximum <strong>30 de zile</strong>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">8.</span> Securitatea Datelor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Implementăm măsuri tehnice și organizatorice avansate pentru protecția datelor tale personale:
                </p>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Măsuri Tehnice:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Criptare SSL/TLS:</strong> Toate comunicațiile sunt criptate cu protocoale securizate</li>
                    <li><strong>Hash-uire parole:</strong> Parolele sunt criptate cu algoritmi puternici (bcrypt)</li>
                    <li><strong>Autentificare:</strong> Sistem de autentificare securizat cu tokenuri JWT</li>
                    <li><strong>Row Level Security (RLS):</strong> Acces la date bazat pe permisiuni stricte</li>
                    <li><strong>Backup-uri automate:</strong> Copii de siguranță zilnice cu criptare</li>
                    <li><strong>Firewall și monitorizare:</strong> Protecție împotriva atacurilor și monitorizare 24/7</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Măsuri Organizatorice:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Acces limitat la date personale doar pentru personal autorizat</li>
                    <li>Formare regulată a echipei pe teme de securitate și GDPR</li>
                    <li>Proceduri documentate de gestionare a incidentelor de securitate</li>
                    <li>Audituri de securitate periodice</li>
                  </ul>
                </div>

                <Alert variant="destructive" className="mt-4">
                  <AlertDescription className="text-sm">
                    <strong>Raportare incidente:</strong> În cazul unei încălcări a securității datelor, 
                    vom notifica Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) 
                    în maximum 72 de ore și utilizatorii afectați, conform Art. 33-34 GDPR.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 9 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">9.</span> Cookies și Tehnologii Similare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  JinfoApp folosește cookies și tehnologii similare pentru a îmbunătăți experiența de utilizare 
                  și a asigura funcționalitatea aplicației.
                </p>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">9.1. Cookies Esențiale (necesare)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aceste cookies sunt obligatorii pentru funcționarea aplicației și nu pot fi dezactivate.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Autentificare:</strong> Mențin sesiunea de conectare</li>
                    <li><strong>Securitate:</strong> Protecție CSRF și validare cereri</li>
                    <li><strong>Preferințe:</strong> Tema selectată (light/dark), limba</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">9.2. Cookies de Funcționalitate (opționale)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Îmbunătățesc experiența utilizatorului, dar aplicația funcționează și fără ele.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Setări personalizate:</strong> Layout, notificări</li>
                    <li><strong>Conținut salvat local:</strong> Date cache pentru funcționare offline</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">9.3. Local Storage și Session Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Folosim browser storage pentru stocarea temporară de date (ex: hărți offline, documente cache) 
                    care îmbunătățesc viteza și permit funcționarea offline.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">9.4. Gestionarea Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Poți gestiona preferințele de cookies din setările browser-ului sau prin banner-ul de cookie consent 
                    afișat la prima vizită. Dezactivarea cookies-urilor esențiale poate afecta funcționarea aplicației.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 10 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">10.</span> Dreptul de Reclamație
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Dacă consideri că drepturile tale GDPR au fost încălcate, ai dreptul să depui o plângere la autoritatea 
                  de supraveghere competentă din România:
                </p>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">
                    Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București, România</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>+40 318 059 211</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:anspdcp@dataprotection.ro" className="text-primary underline">
                        anspdcp@dataprotection.ro
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Website:</span>
                      <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        www.dataprotection.ro
                      </a>
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    Te rugăm să ne contactezi mai întâi pentru a rezolva orice nelămurire înainte de a depune o plângere oficială.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 11 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">11.</span> Date de Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pentru întrebări, solicitări sau reclamații privind protecția datelor personale, ne poți contacta:
                </p>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg space-y-3">
                  <p className="font-semibold text-lg text-foreground">JinfoTours.ro - Departament Protecția Datelor</p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>Email principal: <a href="mailto:privacy@jinfotours.ro" className="text-primary underline font-medium">privacy@jinfotours.ro</a></span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>Suport general: <a href="mailto:support@jinfotours.ro" className="text-primary underline font-medium">support@jinfotours.ro</a></span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>Telefon: <a href="tel:+40123456789" className="text-primary underline font-medium">+40 123 456 789</a></span>
                    </p>
                  </div>

                  <Alert className="mt-3">
                    <AlertDescription className="text-sm">
                      <strong>Timp de răspuns:</strong> Răspundem la toate solicitările GDPR în maximum 30 de zile de la primire. 
                      Pentru cazuri complexe, perioada poate fi extinsă cu încă 60 de zile, cu notificare prealabilă.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Section 12 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">12.</span> Minori și Protecția Copiilor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  JinfoApp nu colectează intenționat date personale de la copii sub 16 ani fără consimțământul 
                  părinților sau tutorelgi legali, conform Art. 8 GDPR.
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Dacă un părinte sau tutore descoperă că copilul său a furnizat date personale fără consimțământ, 
                  vă rugăm să ne contactați imediat la <a href="mailto:privacy@jinfotours.ro" className="text-primary underline">privacy@jinfotours.ro</a> 
                  pentru a proceda la ștergerea acestor date.
                </p>
                <Alert>
                  <AlertDescription className="text-sm">
                    Pentru călătorii care includ minori, părinții/tutorii sunt responsabili de furnizarea 
                    informațiilor necesare și de gestionarea datelor copiilor în aplicație.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 13 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">13.</span> Modificări ale Politicii de Confidențialitate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Ne rezervăm dreptul de a actualiza această Politică de Confidențialitate pentru a reflecta 
                  modificările în practicile noastre, tehnologie sau cerințe legale.
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Notificare modificări:</strong> În cazul unor modificări semnificative, te vom anunța prin:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mb-3">
                  <li>Email către adresa ta de contact</li>
                  <li>Notificare în aplicație</li>
                  <li>Banner informativ la următoarea autentificare</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Continuarea utilizării aplicației după modificări constituie acceptarea noii Politici de Confidențialitate. 
                  Dacă nu ești de acord cu modificările, poți șterge contul din Setări.
                </p>
              </CardContent>
            </Card>

            {/* Section 14 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">14.</span> Dispoziții Finale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Această Politică de Confidențialitate este guvernată de legislația română și de 
                  Regulamentul (UE) 2016/679 (GDPR).
                </p>
                <p className="text-sm text-muted-foreground">
                  Orice litigiu rezultat din aplicarea acestei politici va fi soluționat pe cale amiabilă sau, 
                  în caz de eșec, de către instanțele competente din România.
                </p>
                <Alert className="bg-primary/5">
                  <AlertDescription className="text-sm">
                    <strong>Validitate:</strong> Această Politică de Confidențialitate este valabilă de la data publicării 
                    și rămâne în vigoare până la actualizarea cu o nouă versiune.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Acknowledgment */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">
                    Mulțumim pentru încrederea acordată!
                  </p>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Respectarea confidențialității tale este o prioritate pentru noi. 
                    Dacă ai întrebări sau nelămuriri despre această politică, nu ezita să ne contactezi.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <a 
                      href="mailto:privacy@jinfotours.ro"
                      className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      privacy@jinfotours.ro
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a 
                      href="tel:+40123456789"
                      className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      +40 123 456 789
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

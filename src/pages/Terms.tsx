import Navigation from '@/components/shared/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Mail, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-16 pb-24 container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Termeni și Condiții
            </h1>
            <p className="text-muted-foreground">
              JinfoApp - Aplicație de management călătorii
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1">
                Actualizat: {new Date().toLocaleDateString('ro-RO', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Badge>
              <Badge variant="outline">Versiunea 1.0</Badge>
            </div>
          </div>

          {/* Alert Important */}
          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Utilizarea aplicației JinfoApp presupune acceptarea integrală a acestor Termeni și Condiții. 
              Te rugăm să îi citești cu atenție înainte de a crea un cont sau de a utiliza serviciile noastre.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Section 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">1.</span> Definiții și Termeni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>În contextul acestor Termeni și Condiții, următorii termeni au semnificațiile specificate:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>"JinfoApp"</strong> sau <strong>"Aplicația"</strong> - platforma web/mobilă de management călătorii dezvoltată de JinfoTours.ro</li>
                  <li><strong>"Operator"</strong> sau <strong>"Noi"</strong> - JinfoTours.ro, furnizorul aplicației</li>
                  <li><strong>"Utilizator"</strong> sau <strong>"Tu"</strong> - orice persoană care creează un cont și utilizează aplicația</li>
                  <li><strong>"Turist"</strong> - utilizator cu rol de client al agenției de turism</li>
                  <li><strong>"Ghid"</strong> - utilizator cu rol de ghid turistic angajat sau colaborator</li>
                  <li><strong>"Administrator"</strong> - utilizator cu rol de management al agenției</li>
                  <li><strong>"Servicii"</strong> - toate funcționalitățile oferite de JinfoApp</li>
                  <li><strong>"Conținut"</strong> - toate datele, informațiile, textele, imaginile, documentele încărcate în aplicație</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">2.</span> Acceptarea Termenilor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Prin crearea unui cont și utilizarea JinfoApp, confirmi că:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Ai citit, înțeles și accepți în totalitate acești Termeni și Condiții</li>
                  <li>Ai cel puțin 16 ani sau ai consimțământul părinților/tutorilor legali</li>
                  <li>Ai capacitatea juridică de a încheia contracte conform legislației române</li>
                  <li>Accepți Politica de Confidențialitate și prelucrarea datelor personale conform GDPR</li>
                  <li>Furnizezi informații complete, corecte și actuale la înregistrare</li>
                </ul>
                <Alert className="mt-4">
                  <AlertDescription className="text-sm">
                    Dacă nu ești de acord cu acești termeni, te rugăm să nu creezi un cont și să nu utilizezi aplicația.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">3.</span> Descrierea Serviciilor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  JinfoApp oferă următoarele servicii principale pentru management călătorii:
                </p>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Pentru Turiști:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-6">
                    <li>Vizualizare itinerare detaliate cu activități zilnice</li>
                    <li>Acces la documente de călătorie (bilete, voucher-uri, asigurări)</li>
                    <li>Descărcare și vizualizare offline a hărților destinațiilor</li>
                    <li>Comunicare directă cu ghidul și administratorii</li>
                    <li>Notificări și actualizări în timp real</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Pentru Ghizi:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-6">
                    <li>Gestionare itinerare și activități</li>
                    <li>Comunicare cu turiștii și administratorii</li>
                    <li>Raportare zilnică a activităților și probleme întâmpinate</li>
                    <li>Încărcare documente și materiale pentru turiști</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Pentru Administratori:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-6">
                    <li>Creare și gestionare circuite turistice</li>
                    <li>Management turiști, ghizi și grupuri</li>
                    <li>Configurare hărți offline și puncte de interes</li>
                    <li>Comunicări broadcast către toți utilizatorii</li>
                    <li>Dashboard centralizat cu statistici și rapoarte</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    Ne rezervăm dreptul de a adăuga, modifica sau elimina funcționalități fără notificare prealabilă, 
                    în scopul îmbunătățirii serviciilor.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">4.</span> Crearea și Gestionarea Contului
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.1. Înregistrare</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Conturile pentru turiști și ghizi sunt create de administratori</li>
                    <li>La creare, vei primi un email cu link de setare parolă</li>
                    <li>Este obligatoriu să îți setezi o parolă sigură (minimum 6 caractere)</li>
                    <li>Datele de contact (email, telefon) trebuie să fie valide și verificabile</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.2. Securitatea Contului</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Ești responsabil pentru păstrarea confidențialității parolei</li>
                    <li>Nu partaja credențialele de autentificare cu alte persoane</li>
                    <li>Notifică-ne imediat în caz de acces neautorizat la cont</li>
                    <li>Ești responsabil pentru toate activitățile desfășurate cu contul tău</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">4.3. Ștergerea Contului</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Poți solicita ștergerea contului oricând din Setări → Cont → Șterge Cont.
                  </p>
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Atenție:</strong> Ștergerea contului este ireversibilă! Toate datele tale personale vor fi eliminate 
                      în maximum 30 de zile, conform Politicii de Confidențialitate.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">5.</span> Utilizarea Acceptabilă
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">5.1. Utilizări Permise</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aplicația poate fi folosită exclusiv pentru scopul declarat: management călătorii și comunicare legată de activitățile turistice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">5.2. Utilizări Interzise</h3>
                  <p className="text-sm text-muted-foreground mb-2">Este strict interzis să folosești aplicația pentru:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-4">
                    <li>Încălcarea legilor locale, naționale sau internaționale</li>
                    <li>Transmiterea de conținut ilegal, ofensator, discriminatoriu sau obscen</li>
                    <li>Hărțuire, amenințare sau abuzarea altor utilizatori</li>
                    <li>Încercări de acces neautorizat la sisteme, date sau conturi</li>
                    <li>Distribuirea de malware, virusi sau cod malițios</li>
                    <li>Spam, phishing sau alte activități frauduloase</li>
                    <li>Reverse engineering, decompilare sau dezasamblare a aplicației</li>
                    <li>Scraping automat, crawling sau colectare masivă de date</li>
                    <li>Utilizare comercială fără acordul scris al operatorului</li>
                  </ul>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Consecințe:</strong> Încălcarea acestor reguli poate duce la suspendarea sau închiderea imediată a contului, 
                    fără rambursare, și raportarea către autoritățile competente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">6.</span> Conținut și Proprietate Intelectuală
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">6.1. Conținutul Utilizatorilor</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Păstrezi proprietatea asupra conținutului pe care îl încarci (documente, imagini, mesaje)</li>
                    <li>Acorzi JinfoApp o licență non-exclusivă de utilizare a conținutului pentru furnizarea serviciilor</li>
                    <li>Ești responsabil pentru legalitatea și acuratețea conținutului încărcat</li>
                    <li>Nu încărca conținut care încalcă drepturile de autor sau alte drepturi de proprietate intelectuală</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">6.2. Conținutul Aplicației</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Toată proprietatea intelectuală asupra aplicației (cod sursă, design, logo, interfață) aparține JinfoTours.ro și este protejată de:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-4">
                    <li>Legea 8/1996 privind dreptul de autor și drepturile conexe (România)</li>
                    <li>Convenții internaționale privind proprietatea intelectuală</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este interzisă reproducerea, distribuirea, modificarea sau utilizarea comercială fără acordul scris al operatorului.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">7.</span> Disponibilitatea Serviciilor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Ne străduim să menținem aplicația disponibilă 24/7, dar nu putem garanta funcționarea neîntreruptă.
                </p>
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Întreruperi Planificate:</h3>
                  <p>
                    Pentru mentenanță, upgrade-uri sau îmbunătățiri, serviciile pot fi temporar indisponibile. 
                    Vom încerca să anunțăm astfel de întreruperi în avans, când este posibil.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Întreruperi Neplanificate:</h3>
                  <p>
                    În caz de probleme tehnice, atacuri cibernetice, dezastre naturale sau alte evenimente de forță majoră, 
                    serviciile pot fi întrerupte fără notificare prealabilă.
                  </p>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    Nu suntem responsabili pentru pierderi sau daune rezultate din indisponibilitatea temporară a aplicației.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">8.</span> Limitarea Răspunderii
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>JinfoApp este furnizată "CA ATARE" (AS IS)</strong>, fără garanții de niciun fel, exprese sau implicite.
                </p>
                <p>
                  Operatorul nu este responsabil pentru:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Acuratețea, fiabilitatea sau completitudinea informațiilor din aplicație</li>
                  <li>Erori, bug-uri sau probleme tehnice care afectează funcționarea</li>
                  <li>Pierderi de date cauzate de factori tehnici sau de forță majoră</li>
                  <li>Daune directe, indirecte, incidentale sau consecventive rezultate din utilizarea aplicației</li>
                  <li>Acțiunile sau omisiunile altor utilizatori (turiști, ghizi)</li>
                  <li>Modificări ale serviciilor sau întreruperi temporare</li>
                </ul>
                <Alert className="mt-4 border-primary/50">
                  <AlertDescription className="text-sm">
                    <strong>Limitare maximă:</strong> Răspunderea noastră este limitată la suma plătită (dacă este cazul) 
                    în ultimele 12 luni pentru serviciile aplicației.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 9 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">9.</span> Modificarea Termenilor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Ne rezervăm dreptul de a modifica acești Termeni și Condiții oricând, pentru:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Conformitate cu schimbări legislative sau regulatorii</li>
                  <li>Îmbunătățiri ale serviciilor sau adăugarea de funcționalități</li>
                  <li>Clarificări sau corecții ale textului existent</li>
                </ul>
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Notificare Modificări:</h3>
                  <p>
                    Modificările semnificative vor fi comunicate prin:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Email către adresa ta de contact</li>
                    <li>Notificare în aplicație</li>
                    <li>Banner informativ la următoarea autentificare</li>
                  </ul>
                </div>
                <p className="mt-3">
                  <strong>Continuarea utilizării aplicației după modificări constituie acceptarea noilor termeni.</strong> 
                  Dacă nu ești de acord, trebuie să încetezi utilizarea și să ștergi contul.
                </p>
              </CardContent>
            </Card>

            {/* Section 10 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">10.</span> Rezilierea Contului
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">10.1. Reziliere de către Utilizator</h3>
                  <p className="text-sm text-muted-foreground">
                    Poți închide contul oricând din Setări → Cont → Șterge Cont. 
                    Datele tale vor fi șterse conform Politicii de Confidențialitate.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">10.2. Reziliere de către Operator</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ne rezervăm dreptul de a suspenda sau închide orice cont, fără notificare prealabilă, în cazul:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-4">
                    <li>Încălcării acestor Termeni și Condiții</li>
                    <li>Activității frauduloase, ilegale sau abuzive</li>
                    <li>Amenințării securității sau stabilității aplicației</li>
                    <li>Cererii autorităților competente</li>
                  </ul>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    În caz de reziliere pentru încălcarea termenilor, nu ai dreptul la rambursare sau compensare.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Section 11 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">11.</span> Legea Aplicabilă și Jurisdicție
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Acești Termeni și Condiții sunt guvernați de <strong>legislația română</strong> și de:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Codul Civil român (Legea 287/2009)</li>
                  <li>Legea 365/2002 privind comerțul electronic</li>
                  <li>Regulamentul (UE) 2016/679 - GDPR</li>
                  <li>Legea 190/2018 privind protecția datelor personale</li>
                </ul>
                <div className="mt-3">
                  <h3 className="font-semibold mb-2 text-foreground">Soluționarea Litigiilor:</h3>
                  <p>
                    Orice dispută rezultată din utilizarea aplicației va fi rezolvată prin:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Negociere amiabilă între părți (termen 30 zile)</li>
                    <li>Mediere la Camera de Comerț și Industrie (opțional)</li>
                    <li>Instanțele competente din <strong>România</strong>, conform Codului de Procedură Civilă</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Section 12 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">12.</span> Dispoziții Finale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">12.1. Integralitatea Acordului</h3>
                  <p>
                    Acești Termeni și Condiții, împreună cu Politica de Confidențialitate, constituie întregul acord 
                    între tine și JinfoTours.ro privind utilizarea aplicației.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">12.2. Separabilitate</h3>
                  <p>
                    Dacă o prevedere este declarată nulă sau inaplicabilă, celelalte prevederi rămân valabile și aplicabile.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">12.3. Cesiune</h3>
                  <p>
                    Nu poți transfera drepturile sau obligațiile tale conform acestor termeni fără acordul nostru scris. 
                    Operatorul poate transfera drepturile către terți în cadrul reorganizărilor corporative.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">12.4. Forță Majoră</h3>
                  <p>
                    Nicio parte nu este responsabilă pentru neîndeplinirea obligațiilor cauzată de evenimente de forță majoră 
                    (dezastre naturale, războaie, epidemii, atacuri cibernetice majore, etc.).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-primary">13.</span> Contact și Asistență
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pentru întrebări, sugestii sau raportarea problemelor legate de acești Termeni și Condiții:
                </p>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg space-y-3">
                  <p className="font-semibold text-lg text-foreground">JinfoTours.ro - Suport Clienți</p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>Email suport: <a href="mailto:support@jinfotours.ro" className="text-primary underline font-medium">support@jinfotours.ro</a></span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>Telefon: <a href="tel:+40123456789" className="text-primary underline font-medium">+40 123 456 789</a></span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold">Program:</span>
                      <span>Luni - Vineri: 09:00 - 18:00 (UTC+2)</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Final Note */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">
                    Mulțumim că alegi JinfoApp!
                  </p>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Îți dorim călătorii minunate și experiențe de neuitat. 
                    Dacă ai întrebări despre acești termeni, echipa noastră este mereu disponibilă să te ajute.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <a 
                      href="mailto:support@jinfotours.ro"
                      className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      support@jinfotours.ro
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

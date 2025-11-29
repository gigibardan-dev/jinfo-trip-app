import { useEffect, useState } from 'react';
import CookieBanner from 'react-cookie-consent';
import { Shield } from 'lucide-react';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifică dacă user-ul a acceptat deja
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay mic pentru a nu apărea banner-ul instant
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <CookieBanner
      location="bottom"
      buttonText="Accept toate"
      declineButtonText="Doar esențiale"
      enableDeclineButton
      onAccept={() => {
        localStorage.setItem('cookie-consent', 'accepted');
        console.log('[GDPR] User accepted all cookies');
        setShowBanner(false);
      }}
      onDecline={() => {
        localStorage.setItem('cookie-consent', 'essential-only');
        console.log('[GDPR] User accepted essential cookies only');
        setShowBanner(false);
      }}
      style={{
        background: 'hsl(var(--card))',
        borderTop: '2px solid hsl(var(--border))',
        padding: '1.5rem',
        alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
      }}
      buttonStyle={{
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        borderRadius: '0.5rem',
        padding: '0.625rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        padding: '0.625rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      containerClasses="cookie-consent-container"
      contentClasses="cookie-consent-content"
    >
      <div className="flex items-start gap-4 max-w-6xl mx-auto">
        <div className="flex-shrink-0 hidden sm:block">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-2">
            🍪 Respectăm confidențialitatea ta
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            JinfoApp folosește cookies pentru a asigura funcționalitatea aplicației și pentru a îmbunătăți experiența ta de utilizare. 
            Datele tale personale sunt procesate în conformitate cu GDPR și legislația română privind protecția datelor.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a 
              href="/privacy-policy" 
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Politica de Confidențialitate
            </a>
            <span className="text-muted-foreground">•</span>
            <a 
              href="/terms" 
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Termeni și Condiții
            </a>
          </div>
        </div>
      </div>
    </CookieBanner>
  );
};

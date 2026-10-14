"use client";

import Link from "next/link";
import { useState } from "react";

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing" dir="rtl">
      <header>
        <div className="header-inner">
          <div className="header-start">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </span>
              משכנתא חכמה
            </Link>
            <nav className="nav-links">
              <a href="#features">הפיצ&apos;רים</a>
              <a href="#how">איך זה עובד</a>
              <Link href="/login.html">התחברות</Link>
            </nav>
          </div>
          <div className="header-actions">
            <Link className="btn btn-ghost" href="/login.html">
              כניסה למערכת (דמו)
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
            </Link>
            <Link className="btn btn-beige" href="/login.html?mode=signup">
              התחל עכשיו
            </Link>
          </div>
          <button className="menu-toggle" type="button" aria-label="תפריט" onClick={() => setMenuOpen((open) => !open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
        <div className={`mobile-nav${menuOpen ? " open" : ""}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>הפיצ&apos;רים</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>איך זה עובד</a>
          <Link href="/login.html" onClick={() => setMenuOpen(false)}>התחברות</Link>
          <Link className="btn btn-ghost" href="/login.html" onClick={() => setMenuOpen(false)}>כניסה למערכת (דמו)</Link>
          <Link className="btn btn-beige" href="/login.html?mode=signup" onClick={() => setMenuOpen(false)}>התחל עכשיו</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <div className="hero-copy">
              <div className="badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.8 5.5L19 10l-5.2 2.5L12 18l-1.8-5.5L5 10l5.2-2.5L12 2z" />
                </svg>
                מונע בינה מלאכותית
              </div>
              <h1>
                המפקח החכם
                <br />
                של המשכנתא שלך
              </h1>
              <p className="hero-lede">
                עקוב אחר המשכנתא שלך בצורה גרפית נוחה, קבל התראות על שינויי ריבית והצעות למחזור — ואם אתה לקראת לקיחת משכנתא, קבל תמהיל משכנתא מותאם אישית בחינם.
              </p>
              <div className="hero-ctas">
                <Link className="btn btn-navy" href="/login.html">
                  התחל לעקוב אחר המשכנתא
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M11 18l-6-6 6-6" />
                  </svg>
                </Link>
                <a className="btn btn-soft" href="#mix">
                  בניית תמהיל משכנתא
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 7h8M8 12h8M8 17h4" />
                  </svg>
                </a>
              </div>
              <div className="trust">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
                  </svg>
                  ללא התחייבות
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.8 5.5L19 10l-5.2 2.5L12 18l-1.8-5.5L5 10l5.2-2.5L12 2z" />
                  </svg>
                  מומלץ על ידי AI
                </span>
              </div>
            </div>

            <div className="cards" id="features">
              <article className="card card-light">
                <div className="card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="M7 14l4-4 3 3 5-6" />
                  </svg>
                </div>
                <h2>מפקח משכנתא</h2>
                <p>
                  הזן את פרטי המשכנתא שלך וקבל תמונה גרפית מלאה: יתרה, ריביות, תשלומים והיסטוריית שינויים. המערכת תנתח את המסלולים ותציע הזדמנויות למחזור או שינוי שיחסכו לך כסף.
                </p>
                <ul className="card-list">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19V5M4 19h16M7 14l4-4 3 3 5-6" />
                    </svg>
                    מעקב גרפי אחר יתרה ותשלומים
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                      <path d="M13.7 21a2 2 0 01-3.4 0" />
                    </svg>
                    התראות על שינויי ריבית
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    המלצות למחזור וחיסכון
                  </li>
                </ul>
                <Link className="card-link" href="/login.html">
                  כניסה למעקב
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 12H5" />
                    <path d="M11 18l-6-6 6-6" />
                  </svg>
                </Link>
              </article>

              <article className="card card-dark" id="mix">
                <div className="card-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 7h8M8 12h8M8 17h4" />
                  </svg>
                </div>
                <h2>יועץ תמהיל משכנתא</h2>
                <p>
                  לקראת לקיחת משכנתא? ענה על כמה שאלות על החיים שלך, הנכס והיכולות הכלכליות — וקבל תמהיל משכנתא מוכן ומותאם אישית, עם פירוט מסלולים, ריביות ותשלום חודשי מומלץ.
                </p>
                <ul className="card-list">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l1.6 4.9L19 9l-5.4 2.1L12 16l-1.6-4.9L5 9l5.4-2.1L12 2z" />
                    </svg>
                    התאמה אישית באמצעות AI
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 7h8M8 12h8M8 17h4" />
                    </svg>
                    פירוט מסלולים וריביות
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M8 9h8M8 13h5" />
                    </svg>
                    הערכת תשלום חודשי
                  </li>
                </ul>
                <a className="card-link" href="#mix">
                  התחלת שאלון
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 12H5" />
                    <path d="M11 18l-6-6 6-6" />
                  </svg>
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="how" id="how">
          <div className="wrap">
            <h2>איך זה עובד</h2>
            <div className="steps">
              <div className="step">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <h3>מזינים נתונים</h3>
                <p>פרטי המשכנתא או מענה על שאלון ללווים חדשים</p>
              </div>
              <div className="step">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2 6 6 1-5 4 2 7-5-3.5L7 20l2-7-5-4 6-1 2-6z" />
                  </svg>
                </div>
                <h3>ה-AI מנתח</h3>
                <p>המערכת מנתחת את הנתונים ומשווה לשוק</p>
              </div>
              <div className="step">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
                    <path d="M14 3v5h5" />
                    <path d="M9 17l2-4 2 2 2-3" />
                  </svg>
                </div>
                <h3>מקבלים תובנות</h3>
                <p>המלצות, התראות ותמהיל מותאם אישית</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-inner">
          <Link className="footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 9h8M8 13h5" />
              </svg>
            </span>
            משכנתא חכמה
          </Link>
          <p>המידע באתר אינו ייעוץ פיננסי מקצועי ואינו תחליף לייעוץ משכנתאות מוסמך</p>
        </div>
      </footer>
    </div>
  );
}

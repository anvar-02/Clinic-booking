import { useState } from "react";

type LandingPageProps = {
  isLoggedIn: boolean;
};

const services = [
  {
    title: "Лечение зубов",
    description: "Лечение кариеса и восстановление зубов.",
    image: "/images/services/treatment.jpg",
    alt: "Лечение зубов",
  },
  {
    title: "Профессиональная чистка",
    description: "Профилактика и бережная гигиена полости рта.",
    image: "/images/services/cleaning.jpg",
    alt: "Профессиональная чистка зубов",
  },
  {
    title: "Протезирование",
    description: "Подбор решений для восстановления улыбки.",
    image: "/images/services/prosthetics.jpg",
    alt: "Протезирование зубов",
  },
  {
    title: "Имплантация",
    description: "Современное восстановление утраченных зубов.",
    image: "/images/services/implants.jpg",
    alt: "Имплантация зубов",
  },
  {
    title: "Исправление прикуса",
    description: "Консультация по брекетам и элайнерам.",
    image: "/images/services/orthodontics.jpg",
    alt: "Исправление прикуса",
  },
  {
    title: "Отбеливание",
    description: "Профессиональное осветление эмали.",
    image: "/images/services/whitening.jpg",
    alt: "Отбеливание зубов",
  },
];

const doctors = [
  {
    title: "Ортодонт",
    image: "/images/doctors/orthodontist.jpg",
    alt: "Врач-ортодонт",
  },
  {
    title: "Стоматолог-ортопед",
    image: "/images/doctors/orthopedist.jpg",
    alt: "Врач-стоматолог-ортопед",
  },
  {
    title: "Стоматолог-терапевт",
    image: "/images/doctors/therapist.jpg",
    alt: "Врач-стоматолог-терапевт",
  },
];

function ToothMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 220 190" aria-hidden="true">
      <path d="M30 10c23 3 43 14 57 28-17 13-26 30-24 50 10-16 32-45 66-64 17-10 34-14 51-14l28 37-16 48c-19-15-37-27-52-27-17 0-31 17-48 32-16 12-29 14-44 4S29 83 20 78L10 47z" fill="currentColor" />
      <path d="M15 92c12 8 26 18 38 25 15 9 30 5 47-8 17-15 29-29 42-29 11 0 28 12 47 26-9 32-23 60-41 74l-36-31c14-15 24-32 26-47-14 20-38 53-75 78-22-15-39-46-48-78z" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMobileMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <div className="site-container header-content">
          <a className="brand" href="#top" aria-label="VitBite — стоматология, главная">
            <ToothMark />
            <span className="brand-copy">
              <span><span className="brand-accent">VIT</span>BITE</span>
              <span className="brand-caption">СТОМАТОЛОГИЯ</span>
            </span>
          </a>

          <nav className="main-nav" aria-label="Основная навигация">
            <a href="#about">О клинике</a>
            <a href="#services">Услуги</a>
            <a href="#doctors">Врачи</a>
            <a href="#contacts">Контакты</a>
          </nav>

          <div className="header-actions">
            <a className="phone-link" href="#contacts">
              <span className="icon-button phone-icon"><PhoneIcon /></span>
              <span className="phone-label">Связаться с нами</span>
            </a>
            <a className="icon-button account-link" href="#cabinet" aria-label={isLoggedIn ? "Личный кабинет" : "Войти в личный кабинет"}>
              <UserIcon />
            </a>
            <button className="icon-button menu-link" type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
        <nav id="mobile-navigation" className={`mobile-nav${menuOpen ? " is-open" : ""}`} aria-label="Мобильная навигация">
          <a href="#about" onClick={closeMobileMenu}>О клинике</a>
          <a href="#services" onClick={closeMobileMenu}>Услуги</a>
          <a href="#doctors" onClick={closeMobileMenu}>Врачи</a>
          <a href="#contacts" onClick={closeMobileMenu}>Контакты</a>
          <a href="#cabinet" onClick={closeMobileMenu}>Личный кабинет</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="site-container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Стоматология VitBite</span>
              <h1>Забота о вашей улыбке</h1>
              <p className="hero-lead">Лечение, протезирование и профилактика. Запишитесь онлайн за пару минут, без звонков.</p>
              <div className="button-row">
                <a className="button button-primary" href="#cabinet">Записаться на приём</a>
                <a className="button button-secondary" href="#services">Наши услуги</a>
              </div>
              <div className="hero-note"><span className="note-check">✓</span> Выберите удобное время онлайн</div>
            </div>
            <div className="hero-image-wrap">
              <img className="hero-image" src="/images/clinic/hero.jpg" alt="Интерьер стоматологической клиники" />
              <div className="hero-image-label"><span className="label-dot" /> Комфортная забота о здоровье зубов</div>
            </div>
          </div>
          <div className="hero-decoration" aria-hidden="true" />
        </section>

        <section id="about" className="section about-section">
          <div className="site-container">
            <div className="section-heading">
              <span className="eyebrow">Ваше здоровье — наш приоритет</span>
              <h2>О клинике</h2>
              <p>Мы делаем заботу о зубах понятной и удобной — от выбора специалиста до записи на приём.</p>
            </div>
            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-number">01</span>
                <h3>Онлайн-запись</h3>
                <p>Выберите врача и удобное время на сайте — звонить не нужно.</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">02</span>
                <h3>Личный кабинет</h3>
                <p>Просматривайте предстоящие приёмы и управляйте своими записями.</p>
              </article>
              <article className="feature-card">
                <span className="feature-number">03</span>
                <h3>Отмена в один клик</h3>
                <p>Если планы изменились, отмените запись в личном кабинете.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="site-container">
            <div className="section-heading section-heading-row">
              <div><span className="eyebrow">Направления лечения</span><h2>Услуги</h2></div>
              <a className="text-link" href="#cabinet">Записаться на приём <span aria-hidden="true">↗</span></a>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.title}>
                  <div className="service-image-frame"><img src={service.image} alt={service.alt} loading="lazy" /></div>
                  <div className="service-card-copy"><h3>{service.title}</h3><p>{service.description}</p><a href="#cabinet" aria-label={`Записаться: ${service.title}`} className="card-arrow">↗</a></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="doctors" className="section doctors-section">
          <div className="site-container">
            <div className="section-heading section-heading-row">
              <div><span className="eyebrow">Профессиональная команда</span><h2>Наши врачи</h2><p>Выберите направление и запишитесь на удобное время.</p></div>
              <a className="button button-secondary desktop-doctor-link" href="#cabinet">Все врачи</a>
            </div>
            <div className="doctor-grid">
              {doctors.map((doctor) => (
                <article className="doctor-card" key={doctor.title}>
                  <div className="doctor-image-frame"><img src={doctor.image} alt={doctor.alt} loading="lazy" /></div>
                  <div className="doctor-card-copy"><span className="doctor-role">Врач-стоматолог</span><h3>{doctor.title}</h3><a className="doctor-book-link" href="#cabinet">Записаться <span aria-hidden="true">→</span></a></div>
                </article>
              ))}
            </div>
            <a className="button button-secondary mobile-doctor-link" href="#cabinet">Все врачи</a>
          </div>
        </section>

        <section className="section process-section">
          <div className="site-container">
            <div className="section-heading"><span className="eyebrow">Просто и удобно</span><h2>Как записаться</h2></div>
            <div className="process-grid">
              <article className="process-card"><span className="process-number">1</span><div><h3>Выберите врача</h3><p>Откройте кабинет и выберите специалиста.</p></div></article>
              <article className="process-card"><span className="process-number">2</span><div><h3>Выберите время</h3><p>Укажите удобные дату и время приёма.</p></div></article>
              <article className="process-card"><span className="process-number">3</span><div><h3>Приходите на приём</h3><p>Все ваши записи будут в личном кабинете.</p></div></article>
            </div>
          </div>
        </section>

        <section id="contacts" className="section contacts-section">
          <div className="site-container contacts-card">
            <div className="contacts-copy">
              <span className="eyebrow">Мы рядом</span>
              <h2>Будем рады вам помочь</h2>
              <p>Запишитесь онлайн — выберите специалиста и удобное время в личном кабинете.</p>
              <a className="button button-primary" href="#cabinet">Записаться на приём</a>
            </div>
            <div className="contacts-image-wrap"><img src="/images/clinic/hero.jpg" alt="Клиника VitBite" loading="lazy" /></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-container footer-content">
          <a className="brand footer-brand" href="#top"><ToothMark /><span className="brand-copy"><span><span className="brand-accent">VIT</span>BITE</span><span className="brand-caption">СТОМАТОЛОГИЯ</span></span></a>
          <span>© VitBite. Демонстрационный проект.</span>
          <a href="#top" className="back-to-top">Наверх ↑</a>
        </div>
      </footer>
    </>
  );
}

import { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { DoctorsList } from "./DoctorsList";
import { MyAppointments } from "./MyAppointments";
import { DoctorSchedule } from "./DoctorSchedule";
import { LandingPage } from "./LandingPage";
import { api } from "./api";

type User = { id: number; email: string; fullName: string; role: string };
type Page = "home" | "cabinet";

function pageFromHash(): Page {
  return window.location.hash === "#cabinet" ? "cabinet" : "home";
}

function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    api<User>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
        setLoggedIn(false);
      });
  }, [loggedIn]);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setLoggedIn(false);
  }

  if (page === "home") return <LandingPage isLoggedIn={loggedIn} />;

  return (
    <main id="cabinet" className="cabinet-page">
      <div className="cabinet-topbar">
        <a className="cabinet-back" href="#top">← На главную</a>
        {loggedIn && <button className="button button-secondary logout-button" onClick={logout}>Выйти</button>}
      </div>

      <div className="cabinet-content">
        <span className="eyebrow">VitBite · личный кабинет</span>
        <h1>{loggedIn ? "Ваши записи" : showRegister ? "Создать аккаунт" : "Войти в кабинет"}</h1>

        {loggedIn ? (
          <>
            {!user && <p>Загружаем данные профиля…</p>}
            {user && <p className="cabinet-welcome">Здравствуйте, {user.fullName}</p>}
            {user?.role === "patient" && (
              <div className="cabinet-grid">
                <section className="cabinet-panel">
                  <h2>Записаться на приём</h2>
                  <p>Выберите врача, свободное время и подтвердите запись.</p>
                  <DoctorsList onBooked={() => setRefreshKey((key) => key + 1)} />
                </section>
                <section className="cabinet-panel">
                  <h2>Мои записи</h2>
                  <MyAppointments refreshKey={refreshKey} />
                </section>
              </div>
            )}
            {user?.role === "doctor" && <section className="cabinet-panel"><DoctorSchedule /></section>}
            {user?.role === "admin" && <section className="cabinet-panel"><h2>Панель администратора</h2><p>Раздел управления клиникой появится позже.</p></section>}
          </>
        ) : showRegister ? (
          <div className="auth-card">
            <RegisterForm onRegistered={() => setLoggedIn(true)} />
            <p className="auth-switch">Уже есть аккаунт? <button onClick={() => setShowRegister(false)}>Войти</button></p>
          </div>
        ) : (
          <div className="auth-card">
            <LoginForm onLogin={() => setLoggedIn(true)} />
            <p className="auth-switch">Ещё нет аккаунта? <button onClick={() => setShowRegister(true)}>Зарегистрироваться</button></p>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;

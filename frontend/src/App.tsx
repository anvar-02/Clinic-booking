import { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { DoctorsList } from "./DoctorsList";
import { MyAppointments } from "./MyAppointments";
import { DoctorSchedule } from "./DoctorSchedule";
import { api } from "./api";

type User = { id: number; email: string; fullName: string; role: string };

function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loggedIn) return;
    api<User>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
        setLoggedIn(false);
      });
  }, [loggedIn]);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setLoggedIn(false);
  }

  return (
    <div>
      <h1>Запись в клинику</h1>
      {loggedIn ? (
        <>
          <button onClick={logout}>Выйти</button>
          {!user && <p>Загрузка...</p>}
          {user && <p>Вы вошли как {user.fullName}</p>}

          {user?.role === "patient" && (
            <>
              <DoctorsList onBooked={() => setRefreshKey((k) => k + 1)} />
              <MyAppointments refreshKey={refreshKey} />
            </>
          )}
          {user?.role === "doctor" && <DoctorSchedule />}
          {user?.role === "admin" && <p>Панель администратора появится позже.</p>}
        </>
      ) : showRegister ? (
        <>
          <RegisterForm onRegistered={() => setLoggedIn(true)} />
          <p>
            Уже есть аккаунт?{" "}
            <button onClick={() => setShowRegister(false)}>Войти</button>
          </p>
        </>
      ) : (
        <>
          <LoginForm onLogin={() => setLoggedIn(true)} />
          <p>
            Нет аккаунта?{" "}
            <button onClick={() => setShowRegister(true)}>Зарегистрироваться</button>
          </p>
        </>
      )}
    </div>
  );
}

export default App;
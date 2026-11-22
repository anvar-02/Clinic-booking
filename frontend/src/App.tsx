import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { DoctorsList } from "./DoctorsList";
import { MyAppointments } from "./MyAppointments";

function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [showRegister, setShowRegister] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function logout() {
    localStorage.removeItem("token");
    setLoggedIn(false);
  }

  return (
    <div>
      <h1>Запись в клинику</h1>
      {loggedIn ? (
        <>
          <button onClick={logout}>Выйти</button>
          <DoctorsList onBooked={() => setRefreshKey((k) => k + 1)} />
          <MyAppointments refreshKey={refreshKey} />
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
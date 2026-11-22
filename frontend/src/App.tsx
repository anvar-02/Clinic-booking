import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { DoctorsList } from "./DoctorsList";
import { MyAppointments } from "./MyAppointments";

function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));
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
      ) : (
        <LoginForm onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;
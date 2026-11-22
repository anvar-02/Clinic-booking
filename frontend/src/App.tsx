import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { DoctorsList } from "./DoctorsList";

function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));

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
          <DoctorsList />
        </>
      ) : (
        <LoginForm onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;
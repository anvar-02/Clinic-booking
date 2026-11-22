import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("загрузка...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("сервер недоступен"));
  }, []);

  return (
    <div>
      <h1>Запись в клинику</h1>
      <p>Статус сервера: {status}</p>
    </div>
  );
}

export default App;
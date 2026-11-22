import { useEffect, useState } from "react";
import { api } from "./api";

type Doctor = { id: number; fullName: string; speciality: string };

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="card">
      <h3>{doctor.fullName}</h3>
      <p>{doctor.speciality}</p>
      <button>Записаться</button>
    </div>
  );
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Doctor[]>("/api/doctors")
      .then(setDoctors)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h2>Врачи</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {doctors.map((d) => (
        <DoctorCard key={d.id} doctor={d} />
      ))}
    </div>
  );
}
import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { fetchReservations } from "../api/reservations";
import { fetchDoctors } from "../api/doctors";
import { fetchPatients } from "../api/patients";
import { fetchTherapySessions } from "../api/therapySessions";
import { getDoctorName, getPatientName } from "../utils/lookup";
import type { Doctor, Patient, Reservation, TherapySession } from "../types";
import { localIso } from "../utils/date";

const DOCTOR_CARD_COUNT = 3;


export function Main() {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapySessions, setTherapySessions] = useState<TherapySession[]>([]);

  useEffect(() => {
    fetchReservations().then(setReservations);
    fetchDoctors().then(setDoctors);
    fetchPatients().then(setPatients);
    fetchTherapySessions().then(setTherapySessions);
  }, []);

  if (reservations === null) {
    return <p>{t("common.loading")}</p>;
  }

  const today = localIso();
  const todaysReservations = reservations
    .filter((r) => r.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dashboardDoctors = doctors.slice(0, DOCTOR_CARD_COUNT);
  const byDoctor = dashboardDoctors.map((doctor) => ({
    doctor,
    list: todaysReservations.filter((r) => r.doctorId === doctor.id),
  }));

  const todaysSessions = therapySessions
    .filter((s) => s.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const therapists = Array.from(new Set(todaysSessions.map((s) => s.therapist)));
  const sessionTimeSlots = Array.from(new Set(todaysSessions.map((s) => s.time))).sort();

  return (
    <div className="dashboard">
      <div className="doctor-card-row">
        {byDoctor.map(({ doctor, list }) => {
          const current = list.filter((r) => r.status === "in-progress" || r.status === "completed").length;
          return (
            <div className="doctor-card" key={doctor.id}>
              <div className="doctor-card__header">
                <h3 className="doctor-card__name">{doctor.name}</h3>
                <div className="doctor-card__badges">
                  <span className="queue-badge queue-badge--current">
                    <span className="queue-badge__label">{t("main.queueCurrent")}</span>
                    <span className="queue-badge__value">{current}</span>
                  </span>
                  <span className="queue-badge queue-badge--total">
                    <span className="queue-badge__label">{t("main.queueTotal")}</span>
                    <span className="queue-badge__value">{list.length}</span>
                  </span>
                </div>
              </div>
              {list.length === 0 ? (
                <p className="doctor-card__empty">{t("common.noData")}</p>
              ) : (
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>{t("main.patient")}</th>
                      <th>{t("main.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r, index) => (
                      <tr key={r.id}>
                        <td>{index + 1}</td>
                        <td>{getPatientName(patients, r.patientId)}</td>
                        <td>
                          <span className={`queue-status queue-status--${r.status}`}>
                            {t(`status.${r.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {sessionTimeSlots.length > 0 && therapists.length > 0 && (
        <div
          className="schedule-grid"
          style={{ gridTemplateColumns: `100px repeat(${therapists.length}, 1fr)` } as CSSProperties}
        >
          <div className="schedule-grid__corner" />
          {therapists.map((therapist) => (
            <div className="schedule-grid__col-header" key={therapist}>
              {therapist}
            </div>
          ))}

          {sessionTimeSlots.map((slot) => (
            <div className="schedule-grid__row" key={slot} style={{ display: "contents" }}>
              <div className="schedule-grid__time">{slot}</div>
              {therapists.map((therapist) => {
                const session = todaysSessions.find((s) => s.therapist === therapist && s.time === slot);
                return (
                  <div className="schedule-grid__cell" key={`${therapist}-${slot}`}>
                    {session && (
                      <div className="appointment-card">
                        <span className="appointment-card__name">{getPatientName(patients, session.patientId)}</span>
                        <span className="appointment-card__meta">
                          {getDoctorName(doctors, session.doctorId)} · {session.durationMinutes}
                          {t("common.minutes")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

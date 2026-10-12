import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchReservations } from "../api/reservations";
import { fetchDoctors } from "../api/doctors";
import { fetchPatients } from "../api/patients";
import { localIso } from "../utils/date";
import { getPatientName } from "../utils/lookup";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";
import type { Doctor, Patient, Reservation } from "../types";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const toIso = (date: Date) => localIso(date);

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildMonthGrid(monthStart: Date): Date[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const lastDate = new Date(year, month + 1, 0);
  const lastWeekday = (lastDate.getDay() + 6) % 7;

  const days: Date[] = [];
  for (let i = firstWeekday; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= lastDate.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  for (let i = 1; i <= 6 - lastWeekday; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export function AllInOne() {
  const { t, i18n } = useTranslation();
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [typeFilter, setTypeFilter] = useState("all");
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetchReservations().then(setReservations);
    fetchDoctors().then(setDoctors);
    fetchPatients().then(setPatients);
  }, []);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long" }).format(monthStart),
    [i18n.language, monthStart]
  );

  if (reservations === null) {
    return (
      <div className="page">
        <h2>{t("allInOne.title")}</h2>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  const departments = Array.from(new Set(doctors.map((d) => d.department)));
  const todayIso = toIso(new Date());
  const monthDays = buildMonthGrid(monthStart);
  const currentMonthIndex = monthStart.getMonth();

  const filteredReservations = reservations.filter(
    (r) => typeFilter === "all" || r.department === typeFilter
  );

  const reservationsByDate = new Map<string, Reservation[]>();
  for (const r of filteredReservations) {
    const list = reservationsByDate.get(r.date) ?? [];
    list.push(r);
    reservationsByDate.set(r.date, list);
  }

  return (
    <div className="page">
      <h2>{t("allInOne.title")}</h2>

      <h3 className="section-label">{t("allInOne.appointmentType")}</h3>
      <div className="chip-row">
        <button
          type="button"
          className={typeFilter === "all" ? "chip chip--active" : "chip"}
          onClick={() => setTypeFilter("all")}
        >
          {t("common.all")}
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            type="button"
            className={typeFilter === dept ? "chip chip--active" : "chip"}
            onClick={() => setTypeFilter(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="calendar-nav">
        <button
          type="button"
          className="calendar-nav__button"
          aria-label={t("allInOne.prevMonth")}
          onClick={() => setMonthStart((m) => addMonths(m, -1))}
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="calendar-nav__label">{monthLabel}</span>
        <button
          type="button"
          className="calendar-nav__button"
          aria-label={t("allInOne.nextMonth")}
          onClick={() => setMonthStart((m) => addMonths(m, 1))}
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_KEYS.map((key) => (
          <div className="calendar-grid__weekday" key={key}>
            {t(`days.${key}`)}
          </div>
        ))}
        {monthDays.map((day) => {
          const iso = toIso(day);
          const events = reservationsByDate.get(iso) ?? [];
          const visibleEvents = events.slice(0, 2);
          const overflow = events.length - visibleEvents.length;
          const isMuted = day.getMonth() !== currentMonthIndex;
          const isToday = iso === todayIso;

          return (
            <div
              className={"calendar-cell" + (isMuted ? " calendar-cell--muted" : "") + (isToday ? " calendar-cell--today" : "")}
              key={iso}
            >
              <span className="calendar-cell__date">{day.getDate()}</span>
              {visibleEvents.map((r) => (
                <span className="calendar-event" key={r.id} title={`${r.time} ${getPatientName(patients, r.patientId)}`}>
                  {r.time} {getPatientName(patients, r.patientId)}
                </span>
              ))}
              {overflow > 0 && <span className="calendar-event--more">{t("allInOne.moreCount", { count: overflow })}</span>}
            </div>
          );
        })}
      </div>

      <h3>{t("allInOne.doctorInfo")}</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>{t("main.doctor")}</th>
            <th>{t("main.department")}</th>
            <th>{t("allInOne.workingDays")}</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.department}</td>
              <td>{d.workingDays.map((day) => t(`days.${day}`)).join(" / ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

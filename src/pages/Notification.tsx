import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchLogs } from "../api/logs";
import { fetchReservations } from "../api/reservations";
import { fetchDoctors } from "../api/doctors";
import { getDoctorName } from "../utils/lookup";
import type { Doctor, LogAction, LogEntry, Reservation } from "../types";

const PAGE_SIZE = 6;
const ACTIONS: LogAction[] = ["created", "updated", "cancelled"];

export function Notification() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [actionFilter, setActionFilter] = useState<"all" | LogAction>("all");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs().then(setLogs);
    fetchReservations().then(setReservations);
    fetchDoctors().then(setDoctors);
  }, []);

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }),
    [i18n.language]
  );

  const slotFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "numeric",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Taipei",
      }),
    [i18n.language]
  );

  function slotForLog(log: LogEntry): string {
    if (!log.startsAt) return "-";
    const slot = slotFormatter.format(new Date(log.startsAt));
    return log.prevStartsAt ? `${slotFormatter.format(new Date(log.prevStartsAt))} → ${slot}` : slot;
  }

  function doctorNameForLog(log: LogEntry): string {
    // The log names the doctor as of the event; older backends do not, so
    // fall back to the booking's current doctor.
    if (log.doctorName) return log.doctorName;
    const reservation = reservations.find((r) => r.id === log.reservationId);
    return reservation ? getDoctorName(doctors, reservation.doctorId) : "-";
  }

  if (logs === null) {
    return (
      <div className="page">
        <h2>{t("notification.title")}</h2>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  const filteredLogs = logs
    .filter((log) => actionFilter === "all" || log.action === actionFilter)
    .filter((log) => log.patientName.toLowerCase().includes(query.toLowerCase()))
    .filter((log) => !dateFrom || log.timestamp.slice(0, 10) >= dateFrom)
    .filter((log) => !dateTo || log.timestamp.slice(0, 10) <= dateTo)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="page">
      <h2>{t("notification.title")}</h2>

      <div className="toolbar toolbar--split">
        <div className="toolbar__group">
          <select
            value={actionFilter}
            onChange={(e) => updateFilter((v) => setActionFilter(v as "all" | LogAction))(e.target.value)}
          >
            <option value="all">{t("notification.allActions")}</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {t(`action.${action}`)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t("notification.searchPatient")}
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
          />
        </div>
        <div className="toolbar__group">
          <input
            type="date"
            aria-label={t("notification.dateFrom")}
            value={dateFrom}
            onChange={(e) => updateFilter(setDateFrom)(e.target.value)}
          />
          <input
            type="date"
            aria-label={t("notification.dateTo")}
            value={dateTo}
            onChange={(e) => updateFilter(setDateTo)(e.target.value)}
          />
        </div>
      </div>

      {pagedLogs.length === 0 ? (
        <p>{t("common.noData")}</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("notification.timestamp")}</th>
                <th>{t("notification.patient")}</th>
                <th>{t("notification.slot")}</th>
                <th>{t("main.doctor")}</th>
                <th>{t("notification.action")}</th>
                <th>{t("notification.operator")}</th>
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((log) => (
                <tr key={log.id}>
                  <td>{dateTimeFormatter.format(new Date(log.timestamp))}</td>
                  <td>{log.patientName}</td>
                  <td>{slotForLog(log)}</td>
                  <td>{doctorNameForLog(log)}</td>
                  <td>
                    <span className={`log-status log-status--${log.action}`}>
                      {t(`action.${log.action}`)}
                    </span>
                  </td>
                  <td>{t(`operator.${log.operator}`, log.operator)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pager">
            <button
              type="button"
              className="pager-button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("notification.prev")}
            </button>
            <button
              type="button"
              className="pager-button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              {t("notification.next")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

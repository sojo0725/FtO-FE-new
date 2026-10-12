import { Fragment, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { fetchPatients } from "../api/patients";
import { fetchDoctors } from "../api/doctors";
import { getDoctorName } from "../utils/lookup";
import { AddPersonIcon, DeleteIcon, EditIcon, MoreIcon, SearchIcon } from "../components/icons";
import type { Doctor, Patient } from "../types";

type PatientFormValues = {
  name: string;
  birthDate: string;
  phone: string;
  primaryDoctorId: string;
};

const EMPTY_FORM: PatientFormValues = { name: "", birthDate: "", phone: "", primaryDoctorId: "" };

export function PatientInfo() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<PatientFormValues | null>(null);

  useEffect(() => {
    fetchPatients().then(setPatients);
    fetchDoctors().then(setDoctors);
  }, []);

  if (patients === null) {
    return (
      <div className="page">
        <h2>{t("patientInfo.title")}</h2>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  function openAddForm() {
    setEditingId("new");
    setFormValues({ ...EMPTY_FORM, primaryDoctorId: doctors[0]?.id ?? "" });
  }

  function openEditForm(p: Patient) {
    setEditingId(p.id);
    setFormValues({
      name: p.name,
      birthDate: p.birthDate,
      phone: p.phone,
      primaryDoctorId: p.primaryDoctorId,
    });
  }

  function closeForm() {
    setEditingId(null);
    setFormValues(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formValues || patients === null) return;

    if (editingId === "new") {
      const newPatient: Patient = {
        id: `p${Date.now()}`,
        name: formValues.name,
        birthDate: formValues.birthDate,
        phone: formValues.phone,
        lastVisit: null,
        primaryDoctorId: formValues.primaryDoctorId,
      };
      setPatients([...patients, newPatient]);
    } else {
      setPatients(
        patients.map((p) =>
          p.id === editingId
            ? { ...p, name: formValues.name, birthDate: formValues.birthDate, phone: formValues.phone, primaryDoctorId: formValues.primaryDoctorId }
            : p
        )
      );
    }
    closeForm();
  }

  function handleDelete(p: Patient) {
    if (patients === null) return;
    if (!window.confirm(t("patientInfo.confirmDelete", { name: p.name }))) return;
    setPatients(patients.filter((x) => x.id !== p.id));
    if (expandedId === p.id) setExpandedId(null);
  }

  return (
    <div className="page">
      <h2>{t("patientInfo.title")}</h2>

      <div className="chip-row">
        {patients.map((p) => (
          <button
            key={p.id}
            type="button"
            className={query === p.name ? "chip chip--active" : "chip"}
            onClick={() => setQuery((q) => (q === p.name ? "" : p.name))}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="toolbar toolbar--split">
        <div className="search-box">
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder={t("patientInfo.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="pill-button pill-button--dark" onClick={openAddForm}>
          <AddPersonIcon size={16} />
          {t("patientInfo.add")}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p>{t("common.noData")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("main.patient")}</th>
              <th>{t("patientInfo.phone")}</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td>
                  <td>{p.phone}</td>
                  <td className="data-table__actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t("patientInfo.moreDetails")}
                      onClick={() => setExpandedId((id) => (id === p.id ? null : p.id))}
                    >
                      <MoreIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t("patientInfo.edit")}
                      onClick={() => openEditForm(p)}
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      aria-label={t("patientInfo.delete")}
                      onClick={() => handleDelete(p)}
                    >
                      <DeleteIcon size={16} />
                    </button>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr className="data-table__detail-row">
                    <td colSpan={3}>
                      <div className="detail-grid">
                        <div>
                          <span className="detail-grid__label">{t("patientInfo.patientId")}</span>
                          <span>{p.id}</span>
                        </div>
                        <div>
                          <span className="detail-grid__label">{t("patientInfo.birthDate")}</span>
                          <span>{p.birthDate || "-"}</span>
                        </div>
                        <div>
                          <span className="detail-grid__label">{t("patientInfo.lastVisit")}</span>
                          <span>{p.lastVisit ?? t("patientInfo.noVisit")}</span>
                        </div>
                        <div>
                          <span className="detail-grid__label">{t("patientInfo.primaryDoctor")}</span>
                          <span>{getDoctorName(doctors, p.primaryDoctorId)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {formValues && (
        <div className="modal-overlay" onClick={closeForm}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 className="modal-card__title">
              {editingId === "new" ? t("patientInfo.add") : t("patientInfo.edit")}
            </h3>
            <label>
              {t("main.patient")}
              <input
                type="text"
                required
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              />
            </label>
            <label>
              {t("patientInfo.birthDate")}
              <input
                type="date"
                required
                value={formValues.birthDate}
                onChange={(e) => setFormValues({ ...formValues, birthDate: e.target.value })}
              />
            </label>
            <label>
              {t("patientInfo.phone")}
              <input
                type="tel"
                required
                value={formValues.phone}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
              />
            </label>
            <label>
              {t("patientInfo.primaryDoctor")}
              <select
                value={formValues.primaryDoctorId}
                onChange={(e) => setFormValues({ ...formValues, primaryDoctorId: e.target.value })}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" className="pill-button" onClick={closeForm}>
                {t("patientInfo.cancel")}
              </button>
              <button type="submit" className="pill-button pill-button--dark">
                {t("patientInfo.save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Plus, Check, PowerOff, List, AlertCircle, Heart } from "lucide-react";

export default function SchedulesView({
  schedules,
  session,
  apiCall,
  onRefresh,
  setAlert
}) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    medicineName: "",
    dosage: "",
    frequency: "ONCE_DAILY",
    recurrenceType: "DAILY",
    startDate: new Date().toISOString().slice(0, 10),
    timeSlots: "09:00"
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicineName.trim()) {
      setAlert({ text: "Medicine name is required", type: "error" });
      return;
    }

    setAlert({ text: "Creating schedule...", type: "info" });
    try {
      const payload = {
        medicineId: null,
        medicineName: form.medicineName.trim(),
        dosage: form.dosage.trim() || null,
        frequency: form.frequency,
        recurrenceType: form.recurrenceType,
        customIntervalHours: null,
        startDate: form.startDate,
        endDate: null,
        timeSlots: form.timeSlots.split(",").map(slot => slot.trim()).filter(Boolean)
      };

      await apiCall("/api/v1/medicine-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, session.accessToken);

      setAlert({ text: "Medicine schedule created successfully!", type: "success" });
      // Reset form
      setForm({
        medicineName: "",
        dosage: "",
        frequency: "ONCE_DAILY",
        recurrenceType: "DAILY",
        startDate: new Date().toISOString().slice(0, 10),
        timeSlots: "09:00"
      });
      setCreating(false);
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  const deactivateSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this schedule? It will stop creating new reminders.")) {
      return;
    }

    setAlert({ text: "Deactivating schedule...", type: "info" });
    try {
      await apiCall(`/api/v1/medicine-schedules/${id}/deactivate`, {
        method: "PATCH"
      }, session.accessToken);

      setAlert({ text: "Schedule deactivated.", type: "success" });
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }} className="grid-responsive-layout">
        
        {/* Create Schedule Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Create Schedule</h3>
            <Plus className="card-icon" style={{ width: "20px" }} />
          </div>
          <form onSubmit={handleCreateSubmit}>
            <div className="form-group">
              <label>Medicine Name *</label>
              <input 
                type="text" 
                required
                value={form.medicineName} 
                onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                placeholder="e.g. Metformin" 
              />
            </div>
            
            <div className="form-group">
              <label>Dosage</label>
              <input 
                type="text" 
                value={form.dosage} 
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="e.g. 500 mg" 
              />
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <select 
                value={form.frequency} 
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="ONCE_DAILY">ONCE_DAILY (od)</option>
                <option value="TWICE_DAILY">TWICE_DAILY (bd)</option>
                <option value="THRICE_DAILY">THRICE_DAILY (tds)</option>
                <option value="FOUR_TIMES_DAILY">FOUR_TIMES_DAILY</option>
                <option value="EVERY_N_HOURS">EVERY_N_HOURS</option>
                <option value="CUSTOM_INTERVAL">CUSTOM_INTERVAL</option>
              </select>
            </div>

            <div className="form-group">
              <label>Recurrence Type</label>
              <select 
                value={form.recurrenceType} 
                onChange={(e) => setForm({ ...form, recurrenceType: e.target.value })}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={form.startDate} 
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Reminder Times (comma-separated HH:MM)</label>
              <input 
                type="text" 
                value={form.timeSlots} 
                onChange={(e) => setForm({ ...form, timeSlots: e.target.value })}
                placeholder="e.g. 09:00,21:00" 
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Add times in 24-hour format matching your frequency.
              </span>
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "10px" }}>
              Add Medicine Schedule
            </button>
          </form>
        </div>

        {/* Schedules History / List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Medication Schedules</h3>
            <List className="card-icon" style={{ width: "20px" }} />
          </div>

          {schedules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No medication schedules added yet. Create one or upload a prescription to populate.
            </div>
          ) : (
            <div className="data-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Times</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} style={{ opacity: s.active ? 1 : 0.6 }}>
                      <td style={{ fontWeight: 700, color: s.active ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Heart style={{ width: "14px", color: s.active ? "var(--danger)" : "var(--text-muted)" }} />
                          {s.medicineName}
                        </div>
                      </td>
                      <td>{s.dosage || "-"}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>{s.frequency}</span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {s.timeSlots ? s.timeSlots.join(", ") : "-"}
                      </td>
                      <td>
                        <span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`}>
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {s.active && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: "6px 10px", fontSize: "0.78rem", color: "var(--danger)" }}
                            onClick={() => deactivateSchedule(s.id)}
                          >
                            <PowerOff style={{ width: "12px", marginRight: "4px" }} /> Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

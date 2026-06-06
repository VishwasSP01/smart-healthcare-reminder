import React from "react";
import { Activity, Calendar, Clock, Heart, Award, ArrowRight } from "lucide-react";

export default function DashboardHome({
  profile,
  reminders,
  schedules,
  compliance,
  dietToday,
  onAction,
  activeTabSetter
}) {
  const pendingReminders = reminders.filter(r => r.status === "PENDING");
  const nextReminder = pendingReminders[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        borderRadius: "24px",
        padding: "30px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "8px" }}>
            Hello, {profile?.fullName || "Patient"}!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Welcome to your healthcare control center. You have {pendingReminders.length} medicine reminders pending for today.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Tasks</span>
            <div className="card-icon" style={{ color: "var(--warning)", backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
              <Clock className="menu-icon" />
            </div>
          </div>
          <div className="metric-container">
            <span className="metric-value">{pendingReminders.length}</span>
            <span className="metric-unit">due today</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "12px" }}>
            Make sure to log your medications on time.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Active Medications</span>
            <div className="card-icon">
              <Activity className="menu-icon" />
            </div>
          </div>
          <div className="metric-container">
            <span className="metric-value">{schedules.length}</span>
            <span className="metric-unit">schedules</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "12px" }}>
            Press "Schedules" in the sidebar to add new.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Diet Compliance</span>
            <div className="card-icon" style={{ color: "var(--success)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
              <Award className="menu-icon" />
            </div>
          </div>
          <div className="metric-container">
            <span className="metric-value">{compliance?.compliancePercentage ?? 0}%</span>
            <span className="metric-unit">weekly score</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "12px" }}>
            Based on completed diet reminders.
          </p>
        </div>
      </div>

      {/* Primary Dashboard Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }} className="grid-responsive-layout">
        {/* Left Column: Next Reminder & Schedule */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Next Medication Card */}
          <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Heart style={{ color: "var(--danger)", width: "18px" }} /> Next Medication Due
            </h3>
            {nextReminder ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {nextReminder.schedule.medicineName}
                    </h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                      Dosage: <strong>{nextReminder.schedule.dosage || "N/A"}</strong> | Frequency: {nextReminder.schedule.frequency}
                    </p>
                    <p style={{ color: "var(--warning)", fontSize: "0.85rem", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock style={{ width: "14px" }} /> Due: {new Date(nextReminder.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn btn-primary" onClick={() => onAction("taken", nextReminder.id)}>
                    Mark as Taken
                  </button>
                  <button className="btn btn-secondary" onClick={() => onAction("snooze", nextReminder.id)}>
                    Snooze 10 min
                  </button>
                  <button className="btn btn-outline" onClick={() => onAction("skipped", nextReminder.id)}>
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                No medication reminders due. Nice job keeping up!
              </p>
            )}
          </div>

          {/* Today's Diet Section */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar style={{ color: "var(--primary)", width: "18px" }} /> Today's Diet Schedule
              </h3>
              <button 
                onClick={() => activeTabSetter("diet")}
                style={{ background: "transparent", color: "var(--primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700 }}
              >
                View Diet <ArrowRight style={{ width: "14px" }} />
              </button>
            </div>
            
            {dietToday.length ? (
              <div className="list-group">
                {dietToday.map((meal) => (
                  <div key={meal.id} className="list-item">
                    <div>
                      <span className="badge badge-info" style={{ marginBottom: "6px" }}>{meal.mealType}</span>
                      <div className="list-item-title">{meal.description}</div>
                      <div className="list-item-subtitle">
                        Time: {meal.scheduledTime} | {meal.calories ? `${meal.calories} kcal` : "No cal info"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                No active diet plans assigned for today. Ask your Admin to create one.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Health Profile Quick Info */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Patient Profile</h3>
          {profile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: "white"
                }}>
                  {profile.fullName?.charAt(0) || "P"}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "1rem" }}>{profile.fullName}</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Patient Account</p>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Email</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.email}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>WhatsApp Number</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.whatsappNumber || "Not Provided"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Age</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.age || "N/A"} years</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Medical History</span>
                  <p style={{ color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4, marginTop: "2px" }}>
                    {profile.medicalHistory || "None listed"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading profile info...</p>
          )}
        </div>
      </div>
    </div>
  );
}

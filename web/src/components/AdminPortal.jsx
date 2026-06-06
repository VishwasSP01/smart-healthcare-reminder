import React, { useState } from "react";
import { Users, Lock, LogIn, ToggleLeft, ToggleRight, CheckSquare, PlusCircle, Shield } from "lucide-react";

export default function AdminPortal({
  isLoggedIn,
  patients,
  session,
  apiCall,
  onRefresh,
  saveAdminSession,
  setAlert
}) {
  const [loginForm, setLoginForm] = useState({
    email: "admin@example.com",
    password: "change-me-strong-password"
  });

  const [dietForm, setDietForm] = useState({
    patientId: "",
    mealType: "BREAKFAST",
    description: "",
    scheduledTime: "08:00",
    dietaryRestrictions: "",
    calories: 300,
    startDate: new Date().toISOString().slice(0, 10)
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAlert({ text: "Logging in as admin...", type: "info" });
    try {
      const data = await apiCall("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      saveAdminSession(data);
      setAlert({ text: "Admin login successful!", type: "success" });
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  const togglePatientActive = async (patientId, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    setAlert({ text: `Updating patient status...`, type: "info" });
    try {
      await apiCall(`/api/v1/admin/patients/${patientId}/${action}`, {
        method: "PATCH"
      }, session.adminAccessToken);

      setAlert({ text: `Patient successfully ${currentStatus ? 'deactivated' : 'activated'}.`, type: "success" });
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  const handleDietSubmit = async (e) => {
    e.preventDefault();
    if (!dietForm.patientId) {
      setAlert({ text: "Please select a patient", type: "error" });
      return;
    }
    if (!dietForm.description.trim()) {
      setAlert({ text: "Diet description is required", type: "error" });
      return;
    }

    setAlert({ text: "Assigning diet plan...", type: "info" });
    try {
      const payload = {
        patientId: Number(dietForm.patientId),
        mealType: dietForm.mealType,
        description: dietForm.description.trim(),
        scheduledTime: dietForm.scheduledTime, // Format "HH:MM"
        dietaryRestrictions: dietForm.dietaryRestrictions.trim() || null,
        calories: Number(dietForm.calories),
        startDate: dietForm.startDate,
        endDate: null
      };

      await apiCall("/api/v1/admin/diet-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, session.adminAccessToken);

      setAlert({ text: "Diet plan assigned successfully!", type: "success" });
      setDietForm({
        ...dietForm,
        description: "",
        dietaryRestrictions: "",
        calories: 300
      });
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If not logged in, render login panel
  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
          <div className="card-header" style={{ justifyContent: "center", flexDirection: "column", gap: "10px" }}>
            <div className="logo-icon" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
              <Lock style={{ width: "22px" }} />
            </div>
            <h3 className="card-title" style={{ fontSize: "1.3rem", marginTop: "10px" }}>Admin Access Portal</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textAlign: "center" }}>
              Enter administrator credentials to manage patient accounts.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ marginTop: "12px" }}>
            <div className="form-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                required
                value={loginForm.email} 
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required
                value={loginForm.password} 
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} 
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "8px", background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", boxShadow: "0 4px 14px rgba(168, 85, 247, 0.3)" }}>
              <LogIn style={{ width: "16px" }} /> Login Administrator
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }} className="grid-responsive-layout">
        
        {/* Patient Directory */}
        <div className="card">
          <div className="card-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users style={{ color: "var(--primary)" }} /> Patient Accounts Directory
            </h3>
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "220px", padding: "8px 12px", fontSize: "0.85rem" }}
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No patients registered or matching search.
            </div>
          ) : (
            <div className="data-table-container" style={{ marginTop: "16px" }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>FCM</th>
                    <th>Status</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                      <td style={{ fontWeight: 700 }}>#{p.id}</td>
                      <td style={{ fontWeight: 700 }}>{p.fullName}</td>
                      <td>{p.email}</td>
                      <td>{p.whatsappNumber || "-"}</td>
                      <td>
                        <span className={`badge ${p.hasFcmToken ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: "0.6rem" }}>
                          {p.hasFcmToken ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.active ? 'badge-success' : 'badge-danger'}`}>
                          {p.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => togglePatientActive(p.id, p.active)}
                          style={{
                            padding: "6px",
                            borderColor: "transparent",
                            color: p.active ? "var(--success)" : "var(--text-muted)"
                          }}
                          title={p.active ? "Click to Deactivate" : "Click to Activate"}
                        >
                          {p.active ? (
                            <ToggleRight style={{ width: "32px", height: "32px" }} />
                          ) : (
                            <ToggleLeft style={{ width: "32px", height: "32px" }} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Diet Plan */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Assign Diet Plan</h3>
            <PlusCircle className="card-icon" style={{ color: "var(--primary)" }} />
          </div>

          <form onSubmit={handleDietSubmit}>
            <div className="form-group">
              <label>Select Patient</label>
              <select 
                value={dietForm.patientId} 
                onChange={(e) => setDietForm({ ...dietForm, patientId: e.target.value })}
                required
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} (#{p.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Meal Type</label>
              <select 
                value={dietForm.mealType} 
                onChange={(e) => setDietForm({ ...dietForm, mealType: e.target.value })}
              >
                <option value="BREAKFAST">BREAKFAST</option>
                <option value="LUNCH">LUNCH</option>
                <option value="DINNER">DINNER</option>
                <option value="SNACK">SNACK</option>
              </select>
            </div>

            <div className="form-group">
              <label>Menu Details</label>
              <textarea 
                rows="3"
                value={dietForm.description} 
                onChange={(e) => setDietForm({ ...dietForm, description: e.target.value })}
                placeholder="e.g. Oats with sliced banana, low-fat milk"
                required
              />
            </div>

            <div className="form-group">
              <label>Scheduled Time</label>
              <input 
                type="time" 
                value={dietForm.scheduledTime} 
                onChange={(e) => setDietForm({ ...dietForm, scheduledTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Dietary Restrictions</label>
              <input 
                type="text" 
                value={dietForm.dietaryRestrictions} 
                onChange={(e) => setDietForm({ ...dietForm, dietaryRestrictions: e.target.value })}
                placeholder="e.g. Low sodium, Diabetic friendly" 
              />
            </div>

            <div className="form-group">
              <label>Calories (kcal)</label>
              <input 
                type="number" 
                value={dietForm.calories} 
                onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={dietForm.startDate} 
                onChange={(e) => setDietForm({ ...dietForm, startDate: e.target.value })}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "8px" }}>
              Assign Diet Plan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { 
  Heart, 
  Activity, 
  FileText, 
  Calendar, 
  ShieldAlert, 
  LogOut, 
  AlertCircle, 
  CheckCircle,
  Menu,
  X,
  User,
  Phone,
  Shield
} from "lucide-react";
import DashboardHome from "./components/DashboardHome";
import PrescriptionsView from "./components/PrescriptionsView";
import SchedulesView from "./components/SchedulesView";
import DietView from "./components/DietView";
import AdminPortal from "./components/AdminPortal";

function readSession() {
  return {
    accessToken: localStorage.getItem("accessToken") || "",
    refreshToken: localStorage.getItem("refreshToken") || "",
    adminAccessToken: localStorage.getItem("adminAccessToken") || ""
  };
}

async function api(path, options = {}, token = "") {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alert, setAlert] = useState(null); // { text, type: 'info'|'success'|'error' }
  
  // Dashboard Data State
  const [profile, setProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [dietToday, setDietToday] = useState([]);
  const [dietReminders, setDietReminders] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [patients, setPatients] = useState([]);

  // Auth States
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({
    email: "patient@example.com",
    password: "Patient@12345",
    fullName: "Demo Patient",
    age: 30,
    medicalHistory: "Asthma, Seasonal allergies",
    whatsappNumber: "+919876543210"
  });

  const isPatientLoggedIn = Boolean(session.accessToken);
  const isAdminLoggedIn = Boolean(session.adminAccessToken);

  function savePatientSession(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setSession(readSession());
  }

  function saveAdminSession(data) {
    localStorage.setItem("adminAccessToken", data.accessToken);
    setSession(readSession());
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminAccessToken");
    setSession(readSession());
    setProfile(null);
    setAlert({ text: "Logged out successfully.", type: "success" });
    setActiveView("dashboard");
  }

  // Load Patient Dashboard Data
  async function loadPatientDashboard() {
    try {
      const [me, prescriptionPage, medicineSchedules, medicineReminders, meals, mealReminders, dietScore] =
        await Promise.all([
          api("/api/v1/patients/me", {}, session.accessToken),
          api("/api/v1/prescriptions?page=0&size=20", {}, session.accessToken),
          api("/api/v1/medicine-schedules", {}, session.accessToken),
          api("/api/v1/medicine-schedules/reminders", {}, session.accessToken),
          api("/api/v1/diet/today", {}, session.accessToken),
          api("/api/v1/diet/reminders", {}, session.accessToken),
          api("/api/v1/diet/compliance", {}, session.accessToken)
        ]);

      setProfile(me);
      setPrescriptions(prescriptionPage.content || []);
      setSchedules(medicineSchedules || []);
      setReminders(medicineReminders || []);
      setDietToday(meals || []);
      setDietReminders(mealReminders || []);
      setCompliance(dietScore);
    } catch (err) {
      setAlert({ text: `Failed to load dashboard data: ${err.message}`, type: "error" });
    }
  }

  // Load Admin Data
  async function loadAdminDashboard() {
    try {
      const patientPage = await api("/api/v1/admin/patients?page=0&size=50", {}, session.adminAccessToken);
      setPatients(patientPage.content || []);
    } catch (err) {
      setAlert({ text: `Failed to load admin data: ${err.message}`, type: "error" });
    }
  }

  // Trigger loading data on session change
  useEffect(() => {
    if (isPatientLoggedIn) {
      loadPatientDashboard();
    }
  }, [session.accessToken]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminDashboard();
    }
  }, [session.adminAccessToken]);

  // Handle reminder actions (taken, skipped, snooze)
  const handleReminderAction = async (action, id) => {
    setAlert({ text: `Recording medication action...`, type: "info" });
    try {
      if (action === "taken" || action === "skipped") {
        await api(`/api/v1/medicine-schedules/reminders/${id}/${action}`, { method: "PATCH" }, session.accessToken);
      } else if (action === "snooze") {
        await api(`/api/v1/medicine-schedules/reminders/${id}/snooze`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 10 })
        }, session.accessToken);
      }
      setAlert({ text: `Medication logged successfully!`, type: "success" });
      loadPatientDashboard();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  // Auth Submit Action
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAlert({ text: authMode === "login" ? "Logging in..." : "Registering...", type: "info" });
    try {
      const path = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const body = authMode === "login" ? { email: authForm.email, password: authForm.password } : authForm;
      
      const data = await api(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      savePatientSession(data);
      setAlert({ text: "Authentication successful!", type: "success" });
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  // Auto clear alerts after 8 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // View titles
  const viewDetails = useMemo(() => {
    switch (activeView) {
      case "dashboard": return { title: "Dashboard", desc: "Overview of your treatments, schedule, and dietary adherence." };
      case "prescriptions": return { title: "Prescription OCR Analysis", desc: "Upload and analyze prescriptions with smart OCR and manual confirmation." };
      case "schedules": return { title: "Treatment Schedules", desc: "Configure medical schedules and customize notification frequencies." };
      case "diet": return { title: "Dietary Planning", desc: "View assigned diet regimes, track meals, and view compliance stats." };
      case "admin": return { title: "Admin Portal", desc: "Register patient accounts, toggle statuses, and plan nutritional courses." };
      default: return { title: "Healthcare Reminder System", desc: "" };
    }
  }, [activeView]);

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Heart style={{ width: "22px", height: "22px" }} />
          </div>
          <span className="logo-text">MediPlan System</span>
        </div>

        <nav className="sidebar-menu">
          {isPatientLoggedIn && (
            <>
              <button 
                className={`menu-item ${activeView === "dashboard" ? "active" : ""}`}
                onClick={() => { setActiveView("dashboard"); setSidebarOpen(false); }}
              >
                <Activity className="menu-icon" /> Dashboard
              </button>
              <button 
                className={`menu-item ${activeView === "prescriptions" ? "active" : ""}`}
                onClick={() => { setActiveView("prescriptions"); setSidebarOpen(false); }}
              >
                <FileText className="menu-icon" /> Prescriptions
              </button>
              <button 
                className={`menu-item ${activeView === "schedules" ? "active" : ""}`}
                onClick={() => { setActiveView("schedules"); setSidebarOpen(false); }}
              >
                <Calendar className="menu-icon" /> Schedules
              </button>
              <button 
                className={`menu-item ${activeView === "diet" ? "active" : ""}`}
                onClick={() => { setActiveView("diet"); setSidebarOpen(false); }}
              >
                <Heart className="menu-icon" /> Diet Plan
              </button>
            </>
          )}
          <button 
            className={`menu-item ${activeView === "admin" ? "active" : ""}`}
            onClick={() => { setActiveView("admin"); setSidebarOpen(false); }}
          >
            <Shield className="menu-icon" /> Admin Panel
          </button>
        </nav>

        <div className="sidebar-footer">
          {(isPatientLoggedIn || isAdminLoggedIn) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="profile-summary">
                <div className="profile-avatar">
                  {isAdminLoggedIn ? "AD" : (profile?.fullName?.charAt(0) || "P")}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{isAdminLoggedIn ? "Administrator" : (profile?.fullName || "Patient")}</span>
                  <span className="profile-role">{isAdminLoggedIn ? "System Admin" : "Patient Account"}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-outline" style={{ width: "100%" }} onClick={handleLogout}>
                <LogOut style={{ width: "16px" }} /> Log Out
              </button>
            </div>
          ) : (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
              Healthcare Reminder v1.0.0
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        
        {/* Header Bar */}
        <header className="header">
          <div>
            <h1 className="header-title">{viewDetails.title}</h1>
            <p className="header-subtitle">{viewDetails.desc}</p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ display: "none" }} /* Shown only in responsive view via CSS logic */
            className="responsive-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X style={{ width: "20px" }} /> : <Menu style={{ width: "20px" }} />}
          </button>
        </header>

        {/* Global Notice System */}
        {alert && (
          <div className={`alert-banner ${alert.type === 'error' ? 'error' : alert.type === 'success' ? 'success' : 'info'}`}>
            {alert.type === 'error' ? (
              <ShieldAlert className="alert-icon" style={{ color: "var(--danger)" }} />
            ) : alert.type === 'success' ? (
              <CheckCircle className="alert-icon" style={{ color: "var(--success)" }} />
            ) : (
              <AlertCircle className="alert-icon" style={{ color: "var(--primary)" }} />
            )}
            <div className="alert-text">{alert.text}</div>
          </div>
        )}

        {/* Auth Gate for Patients */}
        {!isPatientLoggedIn && activeView !== "admin" ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <div className="card" style={{ width: "100%", maxWidth: "480px" }}>
              <div className="card-header" style={{ justifyContent: "center", flexDirection: "column", gap: "10px" }}>
                <div className="logo-icon">
                  <Heart style={{ width: "22px", height: "22px" }} />
                </div>
                <h3 className="card-title" style={{ fontSize: "1.3rem", marginTop: "10px" }}>Patient Portal</h3>
                
                <div className="tab-container" style={{ width: "100%", marginTop: "12px" }}>
                  <button 
                    className={`tab-btn ${authMode === "login" ? "active" : ""}`} 
                    onClick={() => setAuthMode("login")}
                  >
                    Login Account
                  </button>
                  <button 
                    className={`tab-btn ${authMode === "register" ? "active" : ""}`} 
                    onClick={() => setAuthMode("register")}
                  >
                    Register New Patient
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={authForm.email} 
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    required 
                    value={authForm.password} 
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                  />
                </div>

                {authMode === "register" && (
                  <>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={authForm.fullName} 
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                      <div className="form-group">
                        <label>Age</label>
                        <input 
                          type="number" 
                          required 
                          value={authForm.age} 
                          onChange={(e) => setAuthForm({ ...authForm, age: Number(e.target.value) })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>WhatsApp Number</label>
                        <input 
                          type="text" 
                          required 
                          value={authForm.whatsappNumber} 
                          onChange={(e) => setAuthForm({ ...authForm, whatsappNumber: e.target.value })} 
                          placeholder="e.g. +919876543210"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Medical History</label>
                      <textarea 
                        rows="3" 
                        value={authForm.medicalHistory} 
                        onChange={(e) => setAuthForm({ ...authForm, medicalHistory: e.target.value })} 
                        placeholder="e.g. Diabetes, Hypertension..."
                      />
                    </div>
                  </>
                )}

                <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "12px" }}>
                  {authMode === "login" ? "Log In as Patient" : "Complete Registration"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Route Panel Renderer */
          <>
            {activeView === "dashboard" && (
              <DashboardHome
                profile={profile}
                reminders={reminders}
                schedules={schedules}
                compliance={compliance}
                dietToday={dietToday}
                onAction={handleReminderAction}
                activeTabSetter={setActiveView}
              />
            )}
            {activeView === "prescriptions" && (
              <PrescriptionsView
                prescriptions={prescriptions}
                session={session}
                apiCall={api}
                onRefresh={loadPatientDashboard}
                setAlert={setAlert}
              />
            )}
            {activeView === "schedules" && (
              <SchedulesView
                schedules={schedules}
                session={session}
                apiCall={api}
                onRefresh={loadPatientDashboard}
                setAlert={setAlert}
              />
            )}
            {activeView === "diet" && (
              <DietView
                dietToday={dietToday}
                dietReminders={dietReminders}
                compliance={compliance}
                session={session}
                apiCall={api}
                onRefresh={loadPatientDashboard}
                setAlert={setAlert}
              />
            )}
            {activeView === "admin" && (
              <AdminPortal
                isLoggedIn={isAdminLoggedIn}
                patients={patients}
                session={session}
                apiCall={api}
                onRefresh={isAdminLoggedIn ? loadAdminDashboard : () => {}}
                saveAdminSession={saveAdminSession}
                setAlert={setAlert}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

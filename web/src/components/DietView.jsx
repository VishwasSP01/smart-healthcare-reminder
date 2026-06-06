import React from "react";
import { Coffee, Award, CheckCircle, AlertTriangle, Clock, Calendar } from "lucide-react";

export default function DietView({
  dietToday,
  dietReminders,
  compliance,
  session,
  apiCall,
  onRefresh,
  setAlert
}) {
  const percentage = compliance?.compliancePercentage ?? 0;
  // Circumference of radius 50 is ~314
  const strokeDashoffset = 314 - (314 * percentage) / 100;

  const markMealAction = async (status, reminderId) => {
    setAlert({ text: `Marking meal as ${status}...`, type: "info" });
    try {
      await apiCall(`/api/v1/diet/reminders/${reminderId}/${status}`, {
        method: "PATCH"
      }, session.accessToken);

      setAlert({ text: `Meal marked as ${status}!`, type: "success" });
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }} className="grid-responsive-layout">
        
        {/* Compliance Gauge Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "340px" }}>
          <div className="card-header" style={{ width: "100%", marginBottom: "16px" }}>
            <h3 className="card-title">Diet Compliance</h3>
            <Award className="card-icon" style={{ color: "var(--success)" }} />
          </div>
          
          <div style={{ position: "relative", width: "140px", height: "140px", margin: "20px 0" }}>
            <svg width="140" height="140" className="compliance-ring-svg">
              <circle r="50" cx="70" cy="70" className="compliance-ring-circle-bg" />
              <circle 
                r="50" 
                cx="70" 
                cy="70" 
                className="compliance-ring-circle-val" 
                strokeDasharray="314" 
                strokeDashoffset={strokeDashoffset} 
              />
            </svg>
            <div className="compliance-inner-text">
              <span style={{ fontSize: "1.8rem", fontWeight: 800 }}>{percentage}%</span>
              <span style={{ display: "block", fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Score</span>
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", lineHeight: 1.4, maxWidth: "240px", marginTop: "10px" }}>
            Your weekly nutritional compliance rating based on meals recorded. Keep it above 80%!
          </p>
        </div>

        {/* Meal Logging & Today's Plan */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Meal Reminders Checklist */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Log Today's Meals</h3>
              <CheckCircle className="card-icon" style={{ color: "var(--success)" }} />
            </div>

            {dietReminders.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", padding: "20px 0", fontSize: "0.9rem" }}>
                No meal reminders scheduled for today. Reminders are created 15 minutes before meal times.
              </p>
            ) : (
              <div className="list-group">
                {dietReminders.map((reminder) => {
                  const isPending = reminder.status === "PENDING";
                  return (
                    <div key={reminder.id} className="list-item" style={{
                      borderLeft: isPending ? "3px solid var(--warning)" : reminder.status === "EATEN" ? "3px solid var(--success)" : "3px solid var(--danger)",
                      opacity: isPending ? 1 : 0.7
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="list-item-title">{reminder.dietPlan.mealType}</span>
                          <span className={`badge ${
                            reminder.status === "EATEN" ? "badge-success" : 
                            reminder.status === "SKIPPED" ? "badge-danger" : "badge-warning"
                          }`} style={{ fontSize: "0.65rem" }}>
                            {reminder.status}
                          </span>
                        </div>
                        <div className="list-item-subtitle" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                          {reminder.dietPlan.description}
                        </div>
                        <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                          <span>Scheduled: {reminder.dietPlan.scheduledTime}</span>
                          <span>|</span>
                          <span>Calories: {reminder.dietPlan.calories || "-"} kcal</span>
                        </div>
                      </div>

                      {isPending && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: "8px 12px", fontSize: "0.8rem", backgroundColor: "var(--success)", boxShadow: "none" }}
                            onClick={() => markMealAction("eaten", reminder.id)}
                          >
                            Ate It
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "8px 12px", fontSize: "0.8rem" }}
                            onClick={() => markMealAction("skipped", reminder.id)}
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Diet Plan Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Active Diet Plans</h3>
              <Calendar className="card-icon" />
            </div>

            {dietToday.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                No active diet plans found. Please check with your system administrator.
              </p>
            ) : (
              <div className="data-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th>Menu Details</th>
                      <th>Time</th>
                      <th>Restrictions</th>
                      <th>Calories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietToday.map((diet) => (
                      <tr key={diet.id}>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Coffee style={{ width: "16px", color: "var(--primary)" }} />
                            {diet.mealType}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-primary)" }}>{diet.description}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{diet.scheduledTime}</td>
                        <td>
                          {diet.dietaryRestrictions ? (
                            <span className="badge badge-warning" style={{ fontSize: "0.65rem" }}>{diet.dietaryRestrictions}</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>None</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{diet.calories ? `${diet.calories} kcal` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

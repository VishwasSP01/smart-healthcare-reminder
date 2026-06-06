import React, { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Edit, Trash2, Plus, ArrowLeft } from "lucide-react";

export default function PrescriptionsView({
  prescriptions,
  session,
  apiCall,
  onRefresh,
  setAlert
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // OCR Review States
  const [reviewPrescription, setReviewPrescription] = useState(null); // The prescription currently being corrected
  const [reviewMedicines, setReviewMedicines] = useState([]); // List of medicines in review editor

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setAlert({ text: "Uploading prescription and running OCR...", type: "info" });
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const response = await fetch("/api/v1/prescriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload prescription");
      }

      setAlert({ text: "Prescription uploaded successfully!", type: "success" });
      setSelectedFile(null);
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Open OCR Verification Panel
  const startReview = (prescription) => {
    setReviewPrescription(prescription);
    // Deep clone the prescription's medicines list into local editor state
    const meds = (prescription.medicines || []).map(m => ({
      id: m.id || Math.random(),
      name: m.name || "",
      dosage: m.dosage || "",
      frequency: m.frequency || "ONCE_DAILY",
      duration: m.duration || "",
      confidence: m.confidence || 100
    }));
    setReviewMedicines(meds);
  };

  // Handle Edit within OCR Row
  const handleMedEdit = (id, field, value) => {
    setReviewMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Delete Medicine Row
  const deleteMedRow = (id) => {
    setReviewMedicines(prev => prev.filter(m => m.id !== id));
  };

  // Add Empty Medicine Row
  const addMedRow = () => {
    setReviewMedicines(prev => [...prev, {
      id: Math.random(),
      name: "",
      dosage: "",
      frequency: "ONCE_DAILY",
      duration: "",
      confidence: 100
    }]);
  };

  // Submit Corrected Medicines
  const submitReview = async () => {
    // Validate
    const invalid = reviewMedicines.some(m => !m.name.trim());
    if (invalid) {
      setAlert({ text: "All medicine names must be filled out", type: "error" });
      return;
    }

    setAlert({ text: "Submitting verified prescription details...", type: "info" });
    try {
      const payload = {
        medicines: reviewMedicines.map(m => ({
          name: m.name.trim(),
          dosage: m.dosage ? m.dosage.trim() : null,
          frequency: m.frequency,
          duration: m.duration ? m.duration.trim() : null,
          confidence: m.confidence ? Number(m.confidence) : 100
        }))
      };

      await apiCall(`/api/v1/prescriptions/${reviewPrescription.id}/medicines`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, session.accessToken);

      setAlert({ text: "Prescription medicines verified successfully!", type: "success" });
      setReviewPrescription(null);
      onRefresh();
    } catch (err) {
      setAlert({ text: err.message, type: "error" });
    }
  };

  // Render OCR review mode if active
  if (reviewPrescription) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="btn btn-secondary" onClick={() => setReviewPrescription(null)}>
            <ArrowLeft style={{ width: "16px" }} /> Back
          </button>
          <h2 className="header-title">Verify OCR Prescription Extracted Medicines</h2>
        </div>

        <div className="alert-banner info" style={{ borderLeft: "4px solid var(--warning)" }}>
          <AlertCircle className="alert-icon" style={{ color: "var(--warning)" }} />
          <div className="alert-text">
            Some medicines extracted below have a low confidence score or require review. Please cross-reference with the raw text extracted on the left and edit or verify the medicines list on the right.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }} className="grid-responsive-layout">
          {/* Left Side: Extracted Raw OCR Text */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText style={{ color: "var(--primary)" }} /> Raw Extracted Text
            </h3>
            <pre style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border-color)",
              padding: "16px",
              borderRadius: "12px",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              maxHeight: "450px",
              overflowY: "auto",
              color: "var(--text-secondary)"
            }}>
              {reviewPrescription.extractedText || "No raw text extracted"}
            </pre>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              * This is the exact text read by Textract/OCR. Read this to correct any typos in the medicines panel.
            </div>
          </div>

          {/* Right Side: Editable Medicines List */}
          <div className="card ocr-review-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 className="card-title">Corrected Medicine Schedule List</h3>
              <button className="btn btn-secondary btn-outline" onClick={addMedRow}>
                <Plus style={{ width: "16px" }} /> Add Medicine
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {reviewMedicines.length === 0 ? (
                <div style={{ padding: "30px", textalign: "center", color: "var(--text-secondary)", textAlign: "center" }}>
                  No medicine candidates currently. Press "Add Medicine" to enter manually.
                </div>
              ) : (
                reviewMedicines.map((med, index) => (
                  <div key={med.id} className="ocr-medicine-row" style={{
                    borderLeft: med.confidence < 70 ? "3px solid var(--warning)" : "1px solid var(--border-color)"
                  }}>
                    {/* Name */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.7rem" }}>Med Name</label>
                      <input 
                        type="text" 
                        value={med.name} 
                        onChange={(e) => handleMedEdit(med.id, "name", e.target.value)} 
                        placeholder="e.g. Paracetamol"
                      />
                    </div>
                    {/* Dosage */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.7rem" }}>Dosage</label>
                      <input 
                        type="text" 
                        value={med.dosage} 
                        onChange={(e) => handleMedEdit(med.id, "dosage", e.target.value)} 
                        placeholder="e.g. 500mg"
                      />
                    </div>
                    {/* Frequency */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.7rem" }}>Frequency</label>
                      <select 
                        value={med.frequency} 
                        onChange={(e) => handleMedEdit(med.id, "frequency", e.target.value)}
                      >
                        <option value="ONCE_DAILY">ONCE_DAILY (od)</option>
                        <option value="TWICE_DAILY">TWICE_DAILY (bd)</option>
                        <option value="THRICE_DAILY">THRICE_DAILY (tds)</option>
                        <option value="FOUR_TIMES_DAILY">FOUR_TIMES_DAILY</option>
                        <option value="EVERY_N_HOURS">EVERY_N_HOURS</option>
                        <option value="CUSTOM_INTERVAL">CUSTOM_INTERVAL</option>
                      </select>
                    </div>
                    {/* Duration */}
                    <div className="form-group">
                      <label style={{ fontSize: "0.7rem" }}>Duration</label>
                      <input 
                        type="text" 
                        value={med.duration} 
                        onChange={(e) => handleMedEdit(med.id, "duration", e.target.value)} 
                        placeholder="e.g. 7 days"
                      />
                    </div>
                    {/* Actions & Confidence */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                      <span className={`ocr-confidence-pill ${med.confidence >= 70 ? 'high' : 'low'}`}>
                        {med.confidence}%
                      </span>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: "6px", color: "var(--danger)", borderColor: "transparent" }}
                        onClick={() => deleteMedRow(med.id)}
                      >
                        <Trash2 style={{ width: "16px" }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn btn-secondary" onClick={() => setReviewPrescription(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitReview}>
                Verify & Create Schedules
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal List + Upload Mode
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }} className="grid-responsive-layout">
        {/* Prescription Upload Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upload Prescription</h3>
            <Upload className="upload-icon" style={{ width: "22px", height: "22px" }} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px", lineHeight: 1.5 }}>
            Upload a prescription image (JPG, PNG) or PDF document. The backend OCR extracts medicines automatically for schedule setup.
          </p>

          <form onSubmit={handleUploadSubmit}>
            <label className="upload-dropzone">
              <Upload className="upload-icon" />
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                  {selectedFile ? selectedFile.name : "Select Prescription File"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  JPG, PNG, or PDF up to 10MB
                </p>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
            </label>

            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={uploading || !selectedFile}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {uploading ? "Analyzing document..." : "Analyze Prescription"}
            </button>
          </form>
        </div>

        {/* Prescription History Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Prescription History</h3>
            <FileText className="card-icon" style={{ width: "20px" }} />
          </div>

          {prescriptions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No prescriptions uploaded yet.
            </div>
          ) : (
            <div className="data-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Original Filename</th>
                    <th>Uploaded Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((p) => {
                    const statusClass = 
                      p.status === "DONE" ? "badge-success" :
                      p.status === "MANUAL_REVIEW" ? "badge-warning" :
                      p.status === "FAILED" ? "badge-danger" : "badge-info";
                    
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.originalFileName}</td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {new Date(p.uploadedAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {p.status === "MANUAL_REVIEW" && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "6px 12px", fontSize: "0.8rem", color: "var(--warning)" }}
                                onClick={() => startReview(p)}
                              >
                                <Edit style={{ width: "14px", marginRight: "4px" }} /> Verify
                              </button>
                            )}
                            {p.presignedUrl && (
                              <a 
                                href={p.presignedUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-outline"
                                style={{ padding: "6px 12px", fontSize: "0.8rem", textDecoration: "none" }}
                              >
                                View File
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

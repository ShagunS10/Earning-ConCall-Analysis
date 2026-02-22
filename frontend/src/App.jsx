import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setResult({ error: data.error });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">◆◆</span>
          <span className="logo-text">QuantSummarize </span>
          <h1 className="main-heading">
            Earnings Calls Analysis
          </h1>
        </div>
      </nav>

      <div className="content">
        <div className="upload-section">
          <div className="upload-box">
            <div className="upload-icon">☁</div>
            <p>
              Drag & Drop File Here or{" "}
              <span
                className="browse"
                onClick={() => document.getElementById("fileInput").click()}
              >
                Browse
              </span>
            </p>

            <input
              id="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              hidden
              onChange={handleFileChange}
            />

            <button className="upload-btn" onClick={handleUpload} disabled={loading}>
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </button>

            {file && <p className="file-info">Selected: {file.name}</p>}
           <p className="file-info"> Upload a PDF, DOC, DOCX, or TXT file to analyze the earnings call. </p>
          </div>
        </div>

        {/* ANALYSIS OUTPUT SECTION - UPDATED TO UNIVERSAL PROMPT STRUCTURE */}
        {loading && <div className="loading-spinner">Analyzing transcript (OCR Mode)...</div>}

        {result && (
          <div className="analysis-container">
            <h2 className="summary-title">Summary Output</h2>

            {result.error ? (
              <div className="error-box">{result.error}</div>
            ) : (
              <div className="analysis-grid">
                {/* 1. Management Tone Card */}
                <div className="result-card">
                  <div className="card-header">Management Tone / Sentiment</div>
                  <div className="sentiment-body">
                    <div className="circular-meter">95%</div>
                    <div className="sentiment-badge">
                      {result.managementTone?.sentiment || "OPTIMISTIC"}
                    </div>
                  </div>
                  <p className="quote">
                    "...{result.managementTone?.quote?.substring(0, 100)}..."
                  </p>
                </div>

                {/* 2. Key Positives Card */}
                <div className="result-card">
                  <div className="card-header">Key Positives</div>
                  <ul className="card-list">
                    {result.positives?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Key Concerns Card */}
                <div className="result-card">
                  <div className="card-header">Key Concerns / Challenges</div>
                  <ul className="card-list">
                    {result.concerns?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Real Capacity Utilization Card */}
                <div className="result-card">
                  <div className="card-header">Capacity Utilization Trends</div>
                  <p className="utilization-text">
                    {result.capacityUtilization || "No specific utilization trends mentioned in this call."}
                  </p>
                </div>

                {/* 5. Real Growth Initiatives Card */}
                <div className="result-card">
                  <div className="card-header">New Growth Initiatives</div>
                  <ul className="card-list">
                    {result.growthInitiatives?.length > 0 ? (
                      result.growthInitiatives.map((item, i) => <li key={i}>{item}</li>)
                    ) : (
                      <li>No new initiatives explicitly described in this session.</li>
                    )}
                  </ul>
                </div>

                {/* 6. Guidance Table Card (Full Width) */}
                <div className="result-card full-width">
                  <div className="card-header">Forward Guidance</div>
                  <table className="guidance-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Outlook</th>
                        <th>Certainty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Revenue Row */}
                      <tr>
                        <td>Revenue</td>
                        <td>{result.guidance?.revenue?.text || result.guidance?.revenue}</td>
                        <td>
                          <span className={`status-${result.guidance?.revenue?.certainty?.toLowerCase() || 'high'}`}>
                            ({result.guidance?.revenue?.certainty || "High"})
                          </span>
                        </td>
                      </tr>
                      {/* Margin Row */}
                      <tr>
                        <td>Margin</td>
                        <td>{result.guidance?.margin?.text || result.guidance?.margin}</td>
                        <td>
                          <span className={`status-${result.guidance?.margin?.certainty?.toLowerCase() || 'med'}`}>
                            ({result.guidance?.margin?.certainty || "Moderate"})
                          </span>
                        </td>
                      </tr>
                      {/* Capex Row */}
                      <tr>
                        <td>Capex</td>
                        <td>{result.guidance?.capex?.text || result.guidance?.capex || "No specific capex outlook provided."}</td>
                        <td>
                          <span className={`status-${result.guidance?.capex?.certainty?.toLowerCase() || 'med'}`}>
                            ({result.guidance?.capex?.certainty || "Moderate"})
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
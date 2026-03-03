import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const styles = {
  body: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "40px 20px",
  },
  card: {
    maxWidth: 960,
    margin: "0 auto",
    background: "#1e293b",
    borderRadius: 16,
    padding: "32px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#38bdf8",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 28,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: 600,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
  },
  inputRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
    alignItems: "flex-end",
  },
  input: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    width: 100,
  },
  symbolInput: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    width: 160,
    textTransform: "uppercase",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnRefresh: {
    background: "transparent",
    color: "#38bdf8",
    border: "1px solid #38bdf8",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  status: {
    color: "#4ade80",
    fontSize: 13,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    display: "inline-block",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    borderRadius: 10,
    overflow: "hidden",
  },
  th: {
    background: "#0f172a",
    color: "#94a3b8",
    padding: "12px 14px",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 600,
    textAlign: "left",
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "12px 14px",
    fontSize: 14,
    borderBottom: "1px solid #1e293b",
  },
  rowEven: {
    background: "#1e293b",
  },
  rowOdd: {
    background: "#172033",
  },
  green: {
    color: "#4ade80",
    fontWeight: 600,
  },
  red: {
    color: "#f87171",
  },
  empty: {
    textAlign: "center",
    color: "#475569",
    padding: "40px 0",
    fontSize: 14,
  },
};

function App() {
  const [symbol, setSymbol] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [history, setHistory] = useState([]);
  const [monitoring, setMonitoring] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState("");
  const pollRef = useRef(null);

  // Poll the backend for new rows at the same interval
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchHistory = async (sym) => {
    const target = sym || activeSymbol || symbol;
    if (!target) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/history?symbol=${target}`
      );
      setHistory(res.data);
    } catch {
      // no history yet
    }
  };

  const startMonitoring = async () => {
    if (!symbol) return;

    // Tell backend to start the interval
    await axios.post("http://localhost:5000/start-monitoring", {
      symbol,
      minutes: Number(minutes),
      seconds: Number(seconds),
    });

    setActiveSymbol(symbol);
    setMonitoring(true);

    // Immediately fetch a first data point
    await axios.post("http://localhost:5000/refresh", { symbol });
    await fetchHistory(symbol);

    // Clear any previous poll and start a new one to pull new rows
    if (pollRef.current) clearInterval(pollRef.current);
    const intervalMs = (Number(minutes) * 60 + Number(seconds)) * 1000;
    pollRef.current = setInterval(() => {
      fetchHistory(symbol);
    }, intervalMs);
  };

  const refreshNow = async () => {
    const target = activeSymbol || symbol;
    if (!target) return;
    await axios.post("http://localhost:5000/refresh", { symbol: target });
    await fetchHistory(target);
  };

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <h2 style={styles.title}>Stock Monitor</h2>
        <p style={styles.subtitle}>
          Enter a stock symbol and refresh interval, then submit to start
          tracking.
        </p>

        <div style={styles.inputRow}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Symbol</label>
            <input
              placeholder="e.g. AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              style={styles.symbolInput}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Minutes</label>
            <input
              placeholder="0"
              type="number"
              min="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Seconds</label>
            <input
              placeholder="0"
              type="number"
              min="0"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.btnRow}>
          <button onClick={startMonitoring} style={styles.btnPrimary}>
            Submit
          </button>
          <button onClick={refreshNow} style={styles.btnRefresh}>
            Refresh Now
          </button>
        </div>

        {monitoring && (
          <div style={styles.status}>
            <span style={styles.dot}></span>
            Monitoring <strong>{activeSymbol}</strong> every{" "}
            {Number(minutes) > 0 && `${minutes}m `}
            {Number(seconds) > 0 && `${seconds}s`}
          </div>
        )}

        {history.length === 0 ? (
          <p style={styles.empty}>
            No data yet. Enter a symbol and hit Submit.
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Open Price</th>
                <th style={styles.th}>High Price</th>
                <th style={styles.th}>Low Price</th>
                <th style={styles.th}>Current Price</th>
                <th style={styles.th}>Previous Close</th>
                <th style={styles.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, index) => (
                <tr
                  key={index}
                  style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td style={styles.td}>${row.openPrice}</td>
                  <td style={{ ...styles.td, ...styles.green }}>
                    ${row.highPrice}
                  </td>
                  <td style={{ ...styles.td, ...styles.red }}>
                    ${row.lowPrice}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#fff" }}>
                    ${row.currentPrice}
                  </td>
                  <td style={styles.td}>${row.previousClosePrice}</td>
                  <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                    {new Date(row.time).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;

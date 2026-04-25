import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useSocket } from "../hooks/useSocket";

const DEFAULT_FORM = {
  testId: "",
  testName: "",
  mode: "whitelist",
  whitelistDomains: "erp.com",
  blacklistDomains: "youtube.com,chatgpt.com"
};

export default function Dashboard() {
  const [tab, setTab] = useState("dashboard");
  const [policyDraft, setPolicyDraft] = useState(() => {
    try {
      const saved = localStorage.getItem("domain_policy_defaults");
      if (!saved) return DEFAULT_FORM;
      return { ...DEFAULT_FORM, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_FORM;
    }
  });
  const [form, setForm] = useState(() => ({
    ...policyDraft,
    testId: "",
    testName: ""
  }));
  const [deviceForm, setDeviceForm] = useState({ studentId: "", studentName: "", macAddress: "", ipAddress: "" });
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDetailTestId, setSelectedDetailTestId] = useState("");
  const [detailAlerts, setDetailAlerts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = async () => {
    const [statsRes, alertsRes, devicesRes, historyRes, activeRes] = await Promise.all([
      api.get("/alerts/stats/live"),
      api.get("/alerts/active"),
      api.get("/devices"),
      api.get("/tests/history"),
      api.get("/tests/active")
    ]);
    setStats(statsRes.data);
    setAlerts(alertsRes.data);
    setDevices(devicesRes.data);
    setHistory(historyRes.data);
    setActiveTest(activeRes.data);
  };

  useEffect(() => {
    refresh();
  }, []);

  useSocket(
    useMemo(
      () => ({
        "alert:new": () => refresh(),
        "test:started": () => refresh(),
        "test:ended": () => refresh()
      }),
      []
    )
  );

  const startTest = async () => {
    await api.post("/tests/start", {
      ...form,
      whitelistDomains: form.whitelistDomains.split(",").map((x) => x.trim()).filter(Boolean),
      blacklistDomains: form.blacklistDomains.split(",").map((x) => x.trim()).filter(Boolean)
    });
    setForm(DEFAULT_FORM);
    await refresh();
  };

  const endTest = async () => {
    if (!activeTest) return;
    await api.put(`/tests/${activeTest.id}/end`);
    await refresh();
  };

  const addDevice = async () => {
    await api.post("/devices", deviceForm);
    setDeviceForm({ studentId: "", studentName: "", macAddress: "", ipAddress: "" });
    await refresh();
  };

  const removeDevice = async (deviceId) => {
    await api.delete(`/devices/${deviceId}`);
    await refresh();
  };

  const openStudentDrawer = async (device) => {
    setSelectedDevice(device);
    const defaultTestId = activeTest?.id || history[0]?.id || "";
    setSelectedDetailTestId(defaultTestId ? String(defaultTestId) : "");
    setDrawerOpen(true);
    if (defaultTestId) {
      await loadDeviceTimeline(device, defaultTestId);
    } else {
      setDetailAlerts([]);
    }
  };

  const loadDeviceTimeline = async (device, testId) => {
    if (!device || !testId) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/alerts/test/${testId}`);
      const rows = (res.data || []).filter(
        (a) =>
          String(a.mac_address || "").toLowerCase() === String(device.mac_address || "").toLowerCase() ||
          String(a.ip_address || "").toLowerCase() === String(device.ip_address || "").toLowerCase()
      );
      setDetailAlerts(rows);
    } finally {
      setDetailLoading(false);
    }
  };

  const applyPolicyToTestForm = () => {
    setForm((prev) => ({
      ...prev,
      mode: policyDraft.mode,
      whitelistDomains: policyDraft.whitelistDomains,
      blacklistDomains: policyDraft.blacklistDomains
    }));
  };

  const savePolicyDefaults = () => {
    localStorage.setItem("domain_policy_defaults", JSON.stringify(policyDraft));
  };

  const exportReport = async (testId, format) => {
    const token = localStorage.getItem("teacher_token");
    const url = `http://localhost:5000/api/alerts/export/${testId}?format=${format}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-${testId}-alerts.${format}`;
    link.click();
  };

  const severityClass = (severity) => {
    const value = String(severity || "").toLowerCase();
    if (value === "critical") return "pill pill-critical";
    if (value === "high") return "pill pill-high";
    return "pill pill-medium";
  };

  const timelineData = useMemo(() => {
    if (!detailAlerts.length) {
      return {
        domains: [],
        sequence: [],
        trend: []
      };
    }

    const domainsMap = new Map();
    detailAlerts.forEach((a) => {
      const key = a.domain_accessed || "N/A";
      domainsMap.set(key, (domainsMap.get(key) || 0) + 1);
    });
    const domains = [...domainsMap.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const sequence = [...detailAlerts]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-20);

    const trendMap = new Map();
    detailAlerts.forEach((a) => {
      const d = new Date(a.created_at);
      const key = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      trendMap.set(key, (trendMap.get(key) || 0) + 1);
    });
    const trend = [...trendMap.entries()].map(([minute, count]) => ({ minute, count })).slice(-20);

    return { domains, sequence, trend };
  }, [detailAlerts]);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2 className="brand">Exam Monitor Pro</h2>
        <div className="nav-list">
          <button className={`btn nav-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
            Dashboard
          </button>
          <button className={`btn nav-btn ${tab === "alerts" ? "active" : ""}`} onClick={() => setTab("alerts")}>
            Alerts
          </button>
          <button className={`btn nav-btn ${tab === "devices" ? "active" : ""}`} onClick={() => setTab("devices")}>
            Devices
          </button>
          <button className={`btn nav-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            Test History
          </button>
          <button className={`btn nav-btn ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
            Settings
          </button>
        </div>
      </aside>

      <main className="content">
        <section className="panel">
          <h2>Active Test Control</h2>
          <p className="muted">Create and manage the current exam session with whitelist/blacklist rules.</p>
          <div className="grid grid-2">
            <div className="field">
              <label>Test ID</label>
              <input className="input" placeholder="e.g. CSE-SEM6-NET" value={form.testId} onChange={(e) => setForm({ ...form, testId: e.target.value })} />
            </div>
            <div className="field">
              <label>Test Name</label>
              <input className="input" placeholder="e.g. Computer Networks Final" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
            </div>
            <div className="field">
              <label>Monitoring Mode</label>
              <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="whitelist">Whitelist</option>
                <option value="blacklist">Blacklist</option>
              </select>
            </div>
            <div className="field">
              <label>{form.mode === "whitelist" ? "Allowed Domains" : "Blocked Domains"}</label>
              <input
                className="input"
                placeholder="comma separated domains"
                value={form.mode === "whitelist" ? form.whitelistDomains : form.blacklistDomains}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [form.mode === "whitelist" ? "whitelistDomains" : "blacklistDomains"]: e.target.value
                  })
                }
              />
            </div>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={startTest}>Start Test</button>
            <button className="btn btn-danger" onClick={endTest} disabled={!activeTest}>End Test</button>
            <button className="btn btn-ghost" onClick={applyPolicyToTestForm}>Use Settings Policy</button>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            Active Test: {activeTest ? `${activeTest.test_name} (${activeTest.test_id})` : "None"}
          </p>
        </section>

        {tab === "dashboard" && (
          <section className="panel">
            <h2>Live Dashboard</h2>
            <div className="grid grid-4">
              <div className="stat-card">
                <div className="stat-label">Connected Devices (2 min)</div>
                <div className="stat-value">{stats?.totalDevicesConnected || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Alerts</div>
                <div className="stat-value">{stats?.activeAlertsCount || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Critical Alerts</div>
                <div className="stat-value">{stats?.severityBreakdown?.critical || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">High + Medium</div>
                <div className="stat-value">{(stats?.severityBreakdown?.high || 0) + (stats?.severityBreakdown?.medium || 0)}</div>
              </div>
            </div>
          </section>
        )}

        {tab === "alerts" && (
          <section className="panel">
            <h2>Real-Time Alerts</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Event</th>
                    <th>IP / MAC</th>
                    <th>Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">No active alerts right now.</td>
                    </tr>
                  )}
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td><span className={severityClass(a.severity)}>{a.severity}</span></td>
                      <td>{a.event_type}</td>
                      <td>{a.ip_address} / {a.mac_address}</td>
                      <td>{a.domain_accessed || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "devices" && (
          <section className="panel">
            <h2>Registered Devices</h2>
            <div className="grid grid-2">
              <div className="field">
                <label>Student ID</label>
                <input className="input" placeholder="e.g. 2203042" value={deviceForm.studentId} onChange={(e) => setDeviceForm({ ...deviceForm, studentId: e.target.value })} />
              </div>
              <div className="field">
                <label>Student Name</label>
                <input className="input" placeholder="e.g. Rahul Patil" value={deviceForm.studentName} onChange={(e) => setDeviceForm({ ...deviceForm, studentName: e.target.value })} />
              </div>
              <div className="field">
                <label>MAC Address</label>
                <input className="input" placeholder="00:1B:44:11:3A:B7" value={deviceForm.macAddress} onChange={(e) => setDeviceForm({ ...deviceForm, macAddress: e.target.value })} />
              </div>
              <div className="field">
                <label>IP Address</label>
                <input className="input" placeholder="192.168.1.11" value={deviceForm.ipAddress} onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })} />
              </div>
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={addDevice}>Add Device</button>
            </div>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>MAC</th>
                    <th>IP</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">No devices registered.</td>
                    </tr>
                  )}
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.student_name}</td>
                      <td>{d.student_id}</td>
                      <td>{d.mac_address}</td>
                      <td>{d.ip_address}</td>
                      <td className="actions">
                        <button className="btn btn-ghost" onClick={() => openStudentDrawer(d)}>View Timeline</button>
                        <button className="btn btn-ghost" onClick={() => removeDevice(d.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "history" && (
          <section className="panel">
            <h2>Test History</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Alerts</th>
                    <th>Devices</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">No test sessions found yet.</td>
                    </tr>
                  )}
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.test_name} ({h.test_id})</td>
                      <td>{h.status}</td>
                      <td>{h.total_alerts}</td>
                      <td>{h.devices_monitored}</td>
                      <td className="actions">
                        <button className="btn btn-ghost" onClick={() => exportReport(h.id, "csv")}>CSV</button>
                        <button className="btn btn-ghost" onClick={() => exportReport(h.id, "json")}>JSON</button>
                        <button className="btn btn-ghost" onClick={() => exportReport(h.id, "pdf")}>PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className="panel">
            <h2>Settings: Domain Policy</h2>
            <p className="muted">Save professional defaults for blacklist/whitelist domains. Use "Use Settings Policy" in Active Test Control to apply instantly.</p>
            <div className="grid">
              <div className="field">
                <label>Default Mode</label>
                <select className="select" value={policyDraft.mode} onChange={(e) => setPolicyDraft({ ...policyDraft, mode: e.target.value })}>
                  <option value="whitelist">Whitelist</option>
                  <option value="blacklist">Blacklist</option>
                </select>
              </div>
              <div className="field">
                <label>Whitelist Domains</label>
                <textarea
                  className="textarea"
                  placeholder="erp.com, docs.python.org"
                  value={policyDraft.whitelistDomains}
                  onChange={(e) => setPolicyDraft({ ...policyDraft, whitelistDomains: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Blacklist Domains</label>
                <textarea
                  className="textarea"
                  placeholder="youtube.com, chatgpt.com, instagram.com"
                  value={policyDraft.blacklistDomains}
                  onChange={(e) => setPolicyDraft({ ...policyDraft, blacklistDomains: e.target.value })}
                />
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={savePolicyDefaults}>Save Settings</button>
                <button className="btn btn-ghost" onClick={applyPolicyToTestForm}>Apply to Test Form</button>
              </div>
            </div>
          </section>
        )}

        {drawerOpen && selectedDevice && (
          <section className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
            <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div>
                  <h3 style={{ margin: 0 }}>{selectedDevice.student_name}</h3>
                  <p className="muted">ID: {selectedDevice.student_id} | MAC: {selectedDevice.mac_address}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setDrawerOpen(false)}>Close</button>
              </div>

              <div className="field">
                <label>Select Test Session For Timeline</label>
                <select
                  className="select"
                  value={selectedDetailTestId}
                  onChange={async (e) => {
                    const nextId = e.target.value;
                    setSelectedDetailTestId(nextId);
                    await loadDeviceTimeline(selectedDevice, nextId);
                  }}
                >
                  <option value="">Select test</option>
                  {activeTest && <option value={activeTest.id}>Active: {activeTest.test_name} ({activeTest.test_id})</option>}
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.test_name} ({h.test_id}) - {h.status}
                    </option>
                  ))}
                </select>
              </div>

              {detailLoading ? (
                <p className="muted">Loading timeline...</p>
              ) : (
                <div className="grid">
                  <div className="panel drawer-card">
                    <h3>Domains Visited</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Domain</th>
                            <th>Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timelineData.domains.length === 0 && (
                            <tr>
                              <td colSpan={2} className="muted">No domain events found.</td>
                            </tr>
                          )}
                          {timelineData.domains.map((d) => (
                            <tr key={d.domain}>
                              <td>{d.domain}</td>
                              <td>{d.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="panel drawer-card">
                    <h3>Alert Sequence</h3>
                    <div className="sequence-list">
                      {timelineData.sequence.length === 0 && <p className="muted">No alerts in this test for this student.</p>}
                      {timelineData.sequence.map((a) => (
                        <div key={a.id} className="sequence-item">
                          <span className={severityClass(a.severity)}>{a.severity}</span>
                          <strong>{a.event_type}</strong>
                          <span className="muted">{new Date(a.created_at).toLocaleString()}</span>
                          <span className="muted">{a.domain_accessed || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel drawer-card">
                    <h3>Suspicious Frequency Trend</h3>
                    <p className="muted">Alerts per minute (recent)</p>
                    <div className="trend-wrap">
                      {timelineData.trend.length === 0 && <p className="muted">No trend data available.</p>}
                      {timelineData.trend.map((t) => {
                        const max = Math.max(...timelineData.trend.map((x) => x.count), 1);
                        const width = Math.max((t.count / max) * 100, 8);
                        return (
                          <div key={t.minute} className="trend-row">
                            <span>{t.minute}</span>
                            <div className="trend-bar-bg">
                              <div className="trend-bar-fill" style={{ width: `${width}%` }} />
                            </div>
                            <strong>{t.count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

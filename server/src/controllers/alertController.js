import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { alertSchema } from "../validators/schemas.js";
import { createAlert, evaluatePolicy, getActiveAlerts, getAlertsByTest, getLiveStats } from "../services/alertService.js";
import { getActiveTest } from "../services/testService.js";
import { getSocketServer } from "../socket/socketStore.js";
import { isRegisteredDevice } from "../services/deviceService.js";

export async function createAlertHandler(req, res, next) {
  try {
    const payload = alertSchema.parse(req.body);
    const activeTest = await getActiveTest();
    if (!activeTest) return res.status(400).json({ message: "No active test session" });

    const policyResult = await evaluatePolicy(activeTest, payload.domainAccessed);
    if (policyResult) {
      payload.eventType = policyResult.eventType;
      payload.severity = policyResult.severity;
    }

    if (!(await isRegisteredDevice(payload.macAddress))) {
      payload.eventType = "UNAUTHORIZED_DEVICE";
      payload.severity = "critical";
    }

    const alert = await createAlert({ ...payload, testSessionId: activeTest.id });
    getSocketServer()?.emit("alert:new", alert);
    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
}

export async function activeAlerts(req, res, next) {
  try {
    res.json(await getActiveAlerts());
  } catch (error) {
    next(error);
  }
}

export async function testAlerts(req, res, next) {
  try {
    res.json(await getAlertsByTest(Number(req.params.testId)));
  } catch (error) {
    next(error);
  }
}

export async function liveStats(req, res, next) {
  try {
    res.json(await getLiveStats());
  } catch (error) {
    next(error);
  }
}

export async function exportAlerts(req, res, next) {
  try {
    const testId = Number(req.params.testId);
    const format = String(req.query.format || "json");
    const alerts = await getAlertsByTest(testId);

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(alerts);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=test-${testId}-alerts.csv`);
      return res.send(csv);
    }
    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=test-${testId}-alerts.pdf`);
      const doc = new PDFDocument({ margin: 30 });
      doc.pipe(res);
      doc.fontSize(16).text(`Test ${testId} Alerts Report`);
      doc.moveDown();
      alerts.forEach((a, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. [${a.severity}] ${a.event_type} | IP: ${a.ip_address} | MAC: ${a.mac_address} | Domain: ${a.domain_accessed || "N/A"} | Time: ${a.created_at}`
          );
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

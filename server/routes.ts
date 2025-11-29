import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { performScan, getLastScanTime } from "./scanner";
import { insertScanSchema, insertScheduledScanSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ Stats & Dashboard ============
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      const lastScanTime = await getLastScanTime();
      res.json({ ...stats, lastScanTime });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      const recentScans = await storage.getRecentScans(10);
      const lastScanTime = await getLastScanTime();
      
      // Calculate weekly data from recent scans
      const weeklyData = getWeeklyData(recentScans);
      
      res.json({
        stats: { ...stats, lastScanTime },
        recentScans,
        weeklyData,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ============ Scans ============
  app.get("/api/scans", async (_req, res) => {
    try {
      const scans = await storage.getAllScans();
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  app.get("/api/scans/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const scans = await storage.getRecentScans(limit);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent scans" });
    }
  });

  app.get("/api/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      const vulnerabilities = await storage.getVulnerabilitiesByScan(req.params.id);
      res.json({ ...scan, vulnerabilities });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan" });
    }
  });

  app.post("/api/scans", async (req, res) => {
    try {
      const parsed = insertScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scan data", details: parsed.error });
      }

      const scan = await storage.createScan(parsed.data);
      
      // Start scan asynchronously
      performScan(scan.id, parsed.data.targetUrl, parsed.data.scanType || "quick");
      
      res.status(201).json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scan" });
    }
  });

  app.delete("/api/scans/:id", async (req, res) => {
    try {
      await storage.deleteVulnerabilitiesByScan(req.params.id);
      const deleted = await storage.deleteScan(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Scan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scan" });
    }
  });

  // ============ Vulnerabilities ============
  app.get("/api/vulnerabilities", async (_req, res) => {
    try {
      const scans = await storage.getAllScans();
      const allVulns = [];
      for (const scan of scans) {
        const vulns = await storage.getVulnerabilitiesByScan(scan.id);
        allVulns.push(...vulns.map(v => ({ ...v, targetUrl: scan.targetUrl })));
      }
      res.json(allVulns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vulnerabilities" });
    }
  });

  app.get("/api/scans/:scanId/vulnerabilities", async (req, res) => {
    try {
      const vulnerabilities = await storage.getVulnerabilitiesByScan(req.params.scanId);
      res.json(vulnerabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vulnerabilities" });
    }
  });

  // ============ Scheduled Scans ============
  app.get("/api/schedules", async (_req, res) => {
    try {
      const schedules = await storage.getAllScheduledScans();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const parsed = insertScheduledScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid schedule data", details: parsed.error });
      }

      const schedule = await storage.createScheduledScan(parsed.data);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateScheduledScan(req.params.id, req.body);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScheduledScan(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  // ============ Settings ============
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      const apiKey = "zap_sk_" + randomUUID().substring(0, 16);
      res.json({ ...settings, apiKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const updated = await storage.updateSettings(settings.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/settings/regenerate-key", async (_req, res) => {
    try {
      const newKey = "zap_sk_" + randomUUID().substring(0, 16);
      res.json({ apiKey: newKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to regenerate API key" });
    }
  });

  // ============ Reports (Export) ============
  app.get("/api/reports/export/:scanId", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.scanId);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      const vulnerabilities = await storage.getVulnerabilitiesByScan(req.params.scanId);
      
      const format = req.query.format || "json";
      
      if (format === "json") {
        res.json({
          report: {
            generatedAt: new Date().toISOString(),
            scan,
            vulnerabilities,
            summary: {
              total: vulnerabilities.length,
              critical: scan.criticalCount,
              high: scan.highCount,
              medium: scan.mediumCount,
              low: scan.lowCount,
            },
          },
        });
      } else {
        // HTML format
        const html = generateHTMLReport(scan, vulnerabilities);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export report" });
    }
  });

  return httpServer;
}

function getWeeklyData(scans: any[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekData = days.map(day => ({ day, scans: 0, vulnerabilities: 0 }));
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (const scan of scans) {
    if (scan.startedAt) {
      const scanDate = new Date(scan.startedAt);
      if (scanDate >= weekAgo) {
        const dayIndex = scanDate.getDay();
        weekData[dayIndex].scans++;
        weekData[dayIndex].vulnerabilities += scan.totalVulnerabilities || 0;
      }
    }
  }
  
  // Reorder to start from Monday
  return [...weekData.slice(1), weekData[0]];
}

function generateHTMLReport(scan: any, vulnerabilities: any[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>ZAP Scan Report - ${scan.targetUrl}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
    .header { border-bottom: 2px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat { background: #2a2a2a; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #14b8a6; }
    .vuln { background: #2a2a2a; margin-bottom: 15px; padding: 20px; border-radius: 8px; border-left: 4px solid; }
    .critical { border-color: #dc2626; }
    .high { border-color: #ea580c; }
    .medium { border-color: #eab308; }
    .low { border-color: #14b8a6; }
    .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .severity.critical { background: #dc2626; }
    .severity.high { background: #ea580c; }
    .severity.medium { background: #eab308; color: #000; }
    .severity.low { background: #14b8a6; }
    h1, h2, h3 { color: #14b8a6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ZAP Vulnerability Scan Report</h1>
    <p>Target: ${scan.targetUrl}</p>
    <p>Scan Type: ${scan.scanType}</p>
    <p>Completed: ${scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'N/A'}</p>
  </div>
  
  <div class="summary">
    <div class="stat"><div class="stat-value">${vulnerabilities.length}</div>Total</div>
    <div class="stat"><div class="stat-value" style="color:#dc2626">${scan.criticalCount || 0}</div>Critical</div>
    <div class="stat"><div class="stat-value" style="color:#ea580c">${scan.highCount || 0}</div>High</div>
    <div class="stat"><div class="stat-value" style="color:#eab308">${scan.mediumCount || 0}</div>Medium</div>
  </div>
  
  <h2>Vulnerabilities</h2>
  ${vulnerabilities.map(v => `
    <div class="vuln ${v.severity.toLowerCase()}">
      <span class="severity ${v.severity.toLowerCase()}">${v.severity}</span>
      <h3>${v.title}</h3>
      <p><strong>Type:</strong> ${v.type}</p>
      <p>${v.description}</p>
      <p><strong>Affected URL:</strong> ${v.affectedUrl}</p>
      <p><strong>Remediation:</strong> ${v.remediation || 'N/A'}</p>
    </div>
  `).join('')}
</body>
</html>`;
}

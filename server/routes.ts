import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { performScan, getLastScanTime } from "./scanner";
import { insertScanSchema, insertScheduledScanSchema } from "@shared/schema";
import { randomUUID } from "crypto";

let currentApiKey: string = "zap_sk_" + Math.random().toString(36).substring(2, 18);

// Middleware to extract API key from header
function getApiKey(req: any): string | null {
  return req.headers["x-api-key"] || req.query.apiKey || null;
}

function getUserId(req: any): string | null {
  return (req.session as any)?.userId || null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ Authentication ============
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser({ username, password });
      (req.session as any).userId = user.id;
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.status(201).json({ user: { id: user.id, username: user.username } });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      (req.session as any).userId = user.id;
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ user: { id: user.id, username: user.username } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // ============ Google OAuth ============
  app.get("/api/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({ error: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ error: "Google OAuth is not configured" });
      }
      passport.authenticate("google", { failureRedirect: "/login" })(req, res, next);
    },
    (req, res) => {
      res.redirect("/");
    }
  );
  
  // ============ Stats & Dashboard ============
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userScans = await storage.getUserScans(userId);
      const totalVulnerabilities = userScans.reduce((sum, s) => sum + (s.totalVulnerabilities || 0), 0);
      const criticalCount = userScans.reduce((sum, s) => sum + (s.criticalCount || 0), 0);
      
      const stats = {
        totalScans: userScans.length,
        totalVulnerabilities,
        criticalCount,
      };
      const lastScanTime = await getLastScanTime();
      res.json({ ...stats, lastScanTime });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userScans = await storage.getUserScans(userId);
      const totalVulnerabilities = userScans.reduce((sum, s) => sum + (s.totalVulnerabilities || 0), 0);
      const criticalCount = userScans.reduce((sum, s) => sum + (s.criticalCount || 0), 0);
      
      const stats = {
        totalScans: userScans.length,
        totalVulnerabilities,
        criticalCount,
      };
      const lastScanTime = await getLastScanTime();
      const recentScans = userScans.slice(0, 10);
      
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
  app.get("/api/scans", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const scans = await storage.getUserScans(userId);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  app.get("/api/scans/recent", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const userScans = await storage.getUserScans(userId);
      res.json(userScans.slice(0, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent scans" });
    }
  });

  app.get("/api/scans/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const scan = await storage.getScan(req.params.id);
      if (!scan || scan.userId !== userId) {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parsed = insertScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scan data", details: parsed.error });
      }

      const scan = await storage.createScan({ ...parsed.data, userId });
      performScan(scan.id, parsed.data.targetUrl, parsed.data.scanType || "quick");
      
      res.status(201).json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scan" });
    }
  });

  app.delete("/api/scans/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const scan = await storage.getScan(req.params.id);
      if (!scan || scan.userId !== userId) {
        return res.status(404).json({ error: "Scan not found" });
      }
      
      await storage.deleteVulnerabilitiesByScan(req.params.id);
      const deleted = await storage.deleteScan(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scan" });
    }
  });

  // ============ Vulnerabilities ============
  app.get("/api/vulnerabilities", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userScans = await storage.getUserScans(userId);
      const allVulns = [];
      for (const scan of userScans) {
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
  app.get("/api/schedules", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const allSchedules = await storage.getAllScheduledScans();
      const userSchedules = allSchedules.filter(s => s.userId === userId);
      res.json(userSchedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const parsed = insertScheduledScanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid schedule data", details: parsed.error });
      }

      const schedule = await storage.createScheduledScan({ ...parsed.data, userId } as any);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const schedule = await storage.getScheduledScan(req.params.id);
      if (!schedule || schedule.userId !== userId) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      const updated = await storage.updateScheduledScan(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const schedule = await storage.getScheduledScan(req.params.id);
      if (!schedule || schedule.userId !== userId) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      const deleted = await storage.deleteScheduledScan(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  // ============ Settings ============
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({ ...settings, apiKey: currentApiKey });
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
      currentApiKey = "zap_sk_" + Math.random().toString(36).substring(2, 18);
      res.json({ apiKey: currentApiKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to regenerate API key" });
    }
  });

  // ============ Reports (Export) ============
  app.get("/api/reports/export/:scanId", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const scan = await storage.getScan(req.params.scanId);
      if (!scan || scan.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized: This report belongs to another user" });
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

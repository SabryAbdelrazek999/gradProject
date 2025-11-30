import { 
  type User, type InsertUser,
  type Scan, type InsertScan,
  type Vulnerability, type InsertVulnerability,
  type ScheduledScan, type InsertScheduledScan,
  type Settings, type InsertSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserApiKey(id: string, apiKey: string): Promise<User | undefined>;

  getScan(id: string): Promise<Scan | undefined>;
  getAllScans(): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  updateScan(id: string, updates: Partial<Scan>): Promise<Scan | undefined>;
  deleteScan(id: string): Promise<boolean>;
  getRecentScans(limit: number): Promise<Scan[]>;

  getVulnerability(id: string): Promise<Vulnerability | undefined>;
  getVulnerabilitiesByScan(scanId: string): Promise<Vulnerability[]>;
  createVulnerability(vuln: InsertVulnerability): Promise<Vulnerability>;
  deleteVulnerabilitiesByScan(scanId: string): Promise<boolean>;

  getScheduledScan(id: string): Promise<ScheduledScan | undefined>;
  getAllScheduledScans(): Promise<ScheduledScan[]>;
  createScheduledScan(schedule: InsertScheduledScan): Promise<ScheduledScan>;
  updateScheduledScan(id: string, updates: Partial<ScheduledScan>): Promise<ScheduledScan | undefined>;
  deleteScheduledScan(id: string): Promise<boolean>;

  getSettings(userId?: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: string, updates: Partial<Settings>): Promise<Settings | undefined>;

  getStats(): Promise<{ totalScans: number; totalVulnerabilities: number; criticalCount: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scans: Map<string, Scan>;
  private vulnerabilities: Map<string, Vulnerability>;
  private scheduledScans: Map<string, ScheduledScan>;
  private settings: Map<string, Settings>;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.vulnerabilities = new Map();
    this.scheduledScans = new Map();
    this.settings = new Map();

    // Default settings
    const defaultSettings: Settings = {
      id: randomUUID(),
      userId: null,
      scanDepth: "medium",
      autoScan: false,
      emailNotifications: true,
    };
    this.settings.set(defaultSettings.id, defaultSettings);

    // Demo scan
    const demoScanId1 = randomUUID();
    this.scans.set(demoScanId1, {
      id: demoScanId1,
      targetUrl: "https://example.com",
      scanType: "quick",
      status: "completed",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalVulnerabilities: 5,
      criticalCount: 1,
      highCount: 1,
      mediumCount: 2,
      lowCount: 1
    });

    // Demo vulnerabilities
    this.vulnerabilities.set(randomUUID(), {
      id: randomUUID(),
      scanId: demoScanId1,
      type: "XSS",
      severity: "Medium",
      title: "Reflected XSS",
      description: "Input not sanitized",
      affectedUrl: "https://example.com/search",
      remediation: "Escape input",
      details: null,
    });

    this.vulnerabilities.set(randomUUID(), {
      id: randomUUID(),
      scanId: demoScanId1,
      type: "CSRF",
      severity: "High",
      title: "CSRF token missing",
      description: "Form vulnerable to CSRF attacks",
      affectedUrl: "https://example.com/form",
      remediation: "Add CSRF token",
      details: null,
    });
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, apiKey: null };
    this.users.set(id, user);
    return user;
  }
  async updateUserApiKey(id: string, apiKey: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) { user.apiKey = apiKey; this.users.set(id, user); }
    return user;
  }

  // --- Scans ---
  async getScan(id: string): Promise<Scan | undefined> { return this.scans.get(id); }
  async getAllScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) => (b.startedAt ? new Date(b.startedAt).getTime() : 0) - (a.startedAt ? new Date(a.startedAt).getTime() : 0));
  }
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = randomUUID();
    const scan: Scan = {
      id,
      targetUrl: insertScan.targetUrl,
      scanType: insertScan.scanType || "quick",
      status: "pending",
      startedAt: null,
      completedAt: null,
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
    this.scans.set(id, scan);
    return scan;
  }
  async updateScan(id: string, updates: Partial<Scan>): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (scan) { const updated = { ...scan, ...updates }; this.scans.set(id, updated); return updated; }
    return undefined;
  }
  async deleteScan(id: string): Promise<boolean> { return this.scans.delete(id); }
  async getRecentScans(limit: number): Promise<Scan[]> {
    return (await this.getAllScans()).slice(0, limit);
  }

  // --- Vulnerabilities ---
  async getVulnerability(id: string): Promise<Vulnerability | undefined> { return this.vulnerabilities.get(id); }
  async getVulnerabilitiesByScan(scanId: string): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values()).filter(v => v.scanId === scanId);
  }
  async createVulnerability(insertVuln: InsertVulnerability): Promise<Vulnerability> {
    const id = randomUUID();
    const vuln: Vulnerability = { id, ...insertVuln, remediation: insertVuln.remediation ?? null, details: insertVuln.details ?? null };
    this.vulnerabilities.set(id, vuln);
    return vuln;
  }
  async deleteVulnerabilitiesByScan(scanId: string): Promise<boolean> {
    Array.from(this.vulnerabilities.entries())
      .filter(([_, v]) => v.scanId === scanId)
      .map(([id]) => id)
      .forEach(id => this.vulnerabilities.delete(id));
    return true;
  }

  // --- Scheduled Scans ---
  async getScheduledScan(id: string): Promise<ScheduledScan | undefined> { return this.scheduledScans.get(id); }
  async getAllScheduledScans(): Promise<ScheduledScan[]> { return Array.from(this.scheduledScans.values()); }
  async createScheduledScan(insertSchedule: InsertScheduledScan): Promise<ScheduledScan> {
    const id = randomUUID();
    const schedule: ScheduledScan = { id, ...insertSchedule, enabled: insertSchedule.enabled ?? true, lastRun: null, nextRun: null };
    this.scheduledScans.set(id, schedule);
    return schedule;
  }
  async updateScheduledScan(id: string, updates: Partial<ScheduledScan>): Promise<ScheduledScan | undefined> {
    const schedule = this.scheduledScans.get(id);
    if (schedule) { const updated = { ...schedule, ...updates }; this.scheduledScans.set(id, updated); return updated; }
    return undefined;
  }
  async deleteScheduledScan(id: string): Promise<boolean> { return this.scheduledScans.delete(id); }

  // --- Settings ---
  async getSettings(userId?: string): Promise<Settings | undefined> {
    if (userId) return Array.from(this.settings.values()).find(s => s.userId === userId);
    return Array.from(this.settings.values())[0];
  }
  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = randomUUID();
    const settings: Settings = { id, userId: insertSettings.userId ?? null, scanDepth: insertSettings.scanDepth ?? "medium", autoScan: insertSettings.autoScan ?? false, emailNotifications: insertSettings.emailNotifications ?? true };
    this.settings.set(id, settings);
    return settings;
  }
  async updateSettings(id: string, updates: Partial<Settings>): Promise<Settings | undefined> {
    const settings = this.settings.get(id);
    if (settings) { const updated = { ...settings, ...updates }; this.settings.set(id, updated); return updated; }
    return undefined;
  }

  async getStats(): Promise<{ totalScans: number; totalVulnerabilities: number; criticalCount: number }> {
    const scans = Array.from(this.scans.values());
    return {
      totalScans: scans.length,
      totalVulnerabilities: scans.reduce((sum, s) => sum + (s.totalVulnerabilities || 0), 0),
      criticalCount: scans.reduce((sum, s) => sum + (s.criticalCount || 0), 0)
    };
  }
}

export const storage = new MemStorage();

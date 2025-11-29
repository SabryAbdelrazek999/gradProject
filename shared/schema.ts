import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Scans table
export const scans = pgTable("scans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  targetUrl: text("target_url").notNull(),
  scanType: text("scan_type").notNull().default("quick"),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalVulnerabilities: integer("total_vulnerabilities").default(0),
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
});

export const insertScanSchema = createInsertSchema(scans).pick({
  targetUrl: true,
  scanType: true,
});

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

// Vulnerabilities table
export const vulnerabilities = pgTable("vulnerabilities", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scanId: varchar("scan_id", { length: 36 }).notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedUrl: text("affected_url").notNull(),
  remediation: text("remediation"),
  details: jsonb("details"),
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).omit({
  id: true,
});

export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilities.$inferSelect;

// Scheduled scans table
export const scheduledScans = pgTable("scheduled_scans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  targetUrl: text("target_url").notNull(),
  frequency: text("frequency").notNull(),
  time: text("time").notNull(),
  enabled: boolean("enabled").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
});

export const insertScheduledScanSchema = createInsertSchema(scheduledScans).pick({
  targetUrl: true,
  frequency: true,
  time: true,
  enabled: true,
});

export type InsertScheduledScan = z.infer<typeof insertScheduledScanSchema>;
export type ScheduledScan = typeof scheduledScans.$inferSelect;

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  scanDepth: text("scan_depth").default("medium"),
  autoScan: boolean("auto_scan").default(false),
  emailNotifications: boolean("email_notifications").default(true),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

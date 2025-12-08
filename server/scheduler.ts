import cron from "node-cron";
import { storage } from "./storage";
import { performScan } from "./scanner";
import { log } from "./index";

// Store active cron tasks
const activeTasks = new Map<string, cron.ScheduledTask>();

export function initScheduler() {
  log("Initializing scheduler...", "scheduler");

  // Check for scheduled scans every minute
  cron.schedule("* * * * *", async () => {
    try {
      const schedules = await storage.getAllScheduledScans();
      const now = new Date();

      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        const shouldRun = checkIfShouldRun(schedule, now);
        
        // Log checking for debugging
        if (now.getSeconds() < 10) { // Log occasionally to avoid spam
             log(`Checking schedule ${schedule.id} for ${schedule.targetUrl}. Time: ${schedule.time}, Now: ${now.getHours()}:${now.getMinutes()}. Should run: ${shouldRun}`, "scheduler");
        }
        
        if (shouldRun) {
          log(`Running scheduled scan for ${schedule.targetUrl}`, "scheduler");
          
          // Create and run scan
          const scan = await storage.createScan({
            userId: schedule.userId,
            targetUrl: schedule.targetUrl,
            scanType: "quick",
          });

          // Run scan asynchronously
          performScan(scan.id, schedule.targetUrl, "quick").catch(err => {
            log(`Scheduled scan failed: ${err.message}`, "scheduler");
          });

          // Update last run time
          await storage.updateScheduledScan(schedule.id, {
            lastRun: now,
            nextRun: calculateNextRun(schedule.frequency, schedule.time, now),
          });
        }
      }
    } catch (error) {
      log(`Scheduler error: ${error}`, "scheduler");
    }
  });

  log("Scheduler initialized", "scheduler");
}

function checkIfShouldRun(schedule: any, now: Date): boolean {
  const [hours, minutes] = schedule.time.split(":").map(Number);
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // Check if current time matches scheduled time (within the current minute)
  if (currentHours !== hours || currentMinutes !== minutes) {
    return false;
  }

  // Check if already ran today/this period
  if (schedule.lastRun) {
    const lastRun = new Date(schedule.lastRun);
    const timeSinceLastRun = now.getTime() - lastRun.getTime();
    
    // Safety check: Don't run if we just ran it less than a minute ago
    if (timeSinceLastRun < 60 * 1000) {
      return false;
    }

    switch (schedule.frequency) {
      case "daily":
        // Run once per day
        return timeSinceLastRun >= 24 * 60 * 60 * 1000;
      case "weekly":
        // Run once per week
        return timeSinceLastRun >= 7 * 24 * 60 * 60 * 1000;
      case "monthly":
        // Run once per month (30 days)
        return timeSinceLastRun >= 30 * 24 * 60 * 60 * 1000;
      case "quarterly":
        // Run once per quarter (90 days)
        return timeSinceLastRun >= 90 * 24 * 60 * 60 * 1000;
      case "annually":
        // Run once per year (365 days)
        return timeSinceLastRun >= 365 * 24 * 60 * 60 * 1000;
      default:
        return false;
    }
  }

  // If never ran before, run now
  return true;
}

function calculateNextRun(frequency: string, time: string, fromDate: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const nextRun = new Date(fromDate);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "daily":
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case "weekly":
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case "monthly":
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case "quarterly":
      nextRun.setMonth(nextRun.getMonth() + 3);
      break;
    case "annually":
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
  }

  return nextRun;
}
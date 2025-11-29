import { FileText, ShieldAlert, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import ActivityTable, { ActivityItem } from "@/components/ActivityTable";

// todo: remove mock functionality
const mockStats = {
  totalScans: 125,
  criticalVulnerabilities: 85,
  lastScan: "Just Now",
};

// todo: remove mock functionality
const mockActivities: ActivityItem[] = [
  { id: 1, type: "Completed Scans", status: "Completed", timestamp: "15:10 29.50", action: "Sourtexis" },
  { id: 2, type: "Completed Scans", status: "Reports", timestamp: "27.00 20.21", action: "Sourtexis" },
  { id: 3, type: "Completed Scans", status: "Completed", timestamp: "32.30 20.20", action: "Sourtexis" },
];

export default function Home() {
  const handleViewDetails = (type: string) => {
    console.log(`View details for: ${type}`);
  };

  const handleViewSource = (id: number) => {
    console.log(`View source for activity: ${id}`);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-home">
      <h1 className="text-2xl font-semibold text-foreground">Welcome Home</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          title="Total Scans"
          value={mockStats.totalScans}
          subtitle="Lead Developer"
          onViewDetails={() => handleViewDetails("total-scans")}
        />
        <StatCard
          icon={ShieldAlert}
          title="Critical Vulnerabilities"
          value={mockStats.criticalVulnerabilities}
          subtitle="Security Researcher"
          onViewDetails={() => handleViewDetails("vulnerabilities")}
        />
        <StatCard
          icon={Clock}
          title="Last Scan"
          value={mockStats.lastScan}
          subtitle="Just Now"
          onViewDetails={() => handleViewDetails("last-scan")}
        />
      </div>

      <ActivityTable activities={mockActivities} onViewSource={handleViewSource} />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle } from "lucide-react";

// todo: remove mock functionality
const weeklyData = [
  { day: "Mon", scans: 12, vulnerabilities: 8 },
  { day: "Tue", scans: 19, vulnerabilities: 15 },
  { day: "Wed", scans: 8, vulnerabilities: 5 },
  { day: "Thu", scans: 15, vulnerabilities: 12 },
  { day: "Fri", scans: 22, vulnerabilities: 18 },
  { day: "Sat", scans: 6, vulnerabilities: 3 },
  { day: "Sun", scans: 4, vulnerabilities: 2 },
];

// todo: remove mock functionality
const severityData = [
  { name: "Critical", value: 15, color: "hsl(0, 85%, 45%)" },
  { name: "High", value: 28, color: "hsl(25, 85%, 50%)" },
  { name: "Medium", value: 42, color: "hsl(45, 85%, 50%)" },
  { name: "Low", value: 35, color: "hsl(180, 85%, 40%)" },
];

// todo: remove mock functionality
const recentFindings = [
  { id: 1, type: "XSS", severity: "Critical", target: "https://example.com/search" },
  { id: 2, type: "SQL Injection", severity: "Critical", target: "https://test.org/login" },
  { id: 3, type: "Missing Headers", severity: "Medium", target: "https://demo.app" },
  { id: 4, type: "Outdated SSL", severity: "Low", target: "https://secure.io" },
];

export default function Dashboard() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "destructive";
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold text-foreground">1,284</p>
              </div>
              <div className="flex items-center text-primary text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                12%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                <p className="text-2xl font-bold text-foreground">432</p>
              </div>
              <div className="flex items-center text-destructive text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                8%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-foreground">15</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-foreground">89%</p>
              </div>
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vulnerabilities" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Vulnerability Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Shield className="w-5 h-5 text-primary" />
            Recent Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFindings.map((finding) => (
              <div
                key={finding.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md bg-muted/50 border border-border"
                data-testid={`finding-${finding.id}`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityColor(finding.severity) as "destructive" | "secondary"}>
                    {finding.severity}
                  </Badge>
                  <span className="font-medium text-foreground">{finding.type}</span>
                </div>
                <span className="font-mono text-sm text-muted-foreground truncate max-w-xs">
                  {finding.target}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Search, Eye, Trash2 } from "lucide-react";

// todo: remove mock functionality
const mockReports = [
  {
    id: 1,
    target: "https://example.com",
    date: "2025-11-29",
    vulnerabilities: 12,
    critical: 3,
    status: "completed",
  },
  {
    id: 2,
    target: "https://test-site.org",
    date: "2025-11-28",
    vulnerabilities: 8,
    critical: 1,
    status: "completed",
  },
  {
    id: 3,
    target: "https://demo.app",
    date: "2025-11-27",
    vulnerabilities: 25,
    critical: 7,
    status: "completed",
  },
  {
    id: 4,
    target: "https://secure.io",
    date: "2025-11-26",
    vulnerabilities: 3,
    critical: 0,
    status: "completed",
  },
];

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" ||
      (severityFilter === "critical" && report.critical > 0) ||
      (severityFilter === "clean" && report.critical === 0);
    return matchesSearch && matchesSeverity;
  });

  const handleViewReport = (id: number) => {
    console.log("View report:", id);
  };

  const handleDownloadReport = (id: number) => {
    console.log("Download report:", id);
  };

  const handleDeleteReport = (id: number) => {
    console.log("Delete report:", id);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-reports">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <Button variant="default" data-testid="button-export-all">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Scan Reports
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-reports"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40" data-testid="select-severity-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="clean">Clean Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Target URL</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Vulnerabilities</TableHead>
                <TableHead className="text-muted-foreground">Critical</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="border-border" data-testid={`report-row-${report.id}`}>
                  <TableCell className="font-mono text-sm text-foreground">
                    {report.target}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{report.vulnerabilities}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.critical > 0 ? "destructive" : "secondary"}>
                      {report.critical}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-primary/20 text-primary">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewReport(report.id)}
                        data-testid={`button-view-report-${report.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadReport(report.id)}
                        data-testid={`button-download-report-${report.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReport(report.id)}
                        data-testid={`button-delete-report-${report.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

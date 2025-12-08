import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, Search, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Settings, Report, Scan, Vulnerability } from "@shared/schema";

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState<(Scan & { vulnerabilities: Vulnerability[] }) | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const { toast } = useToast();

  const { data: settings } = useQuery<Settings & { apiKey: string }>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.apiKey) {
      setApiKey(settings.apiKey);
    }
  }, [settings]);

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Report Deleted",
        description: "The scan report has been removed",
      });
    },
  });

  const filteredReports = (reports || []).filter((rep) => {
    const matchesSearch = rep.reportName.toLowerCase().includes(searchQuery.toLowerCase()) || (rep.reportPath || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleViewReport = async (reportPath: string) => {
    try {
      // reportPath is stored as something like '/api/reports/export/<scanId>'
      const url = `${reportPath}?format=json`;
      const data = await apiRequest("GET", url);
      // api returns { report: { generatedAt, scan, vulnerabilities, summary } }
      if (data && data.report) {
        setSelectedScan({ ...(data.report.scan || {}), vulnerabilities: data.report.vulnerabilities || [] } as any);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report details",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = (reportPath: string, format: string = "json") => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "API key not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    const url = `${reportPath}?format=${format}&apiKey=${encodeURIComponent(apiKey)}`;
    window.open(url, "_blank");
  };

  const handleDeleteReport = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="page-reports">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-reports">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
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
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {reports?.length === 0 
                ? "No reports yet. Start a scan to see reports here."
                : "No reports match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Target / Report</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Total</TableHead>
                  <TableHead className="text-muted-foreground">Critical</TableHead>
                  <TableHead className="text-muted-foreground">High</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((rep) => (
                  <TableRow key={rep.id} className="border-border" data-testid={`report-row-${rep.id}`}>
                    <TableCell className="font-mono text-sm text-foreground max-w-xs truncate">
                      {rep.reportName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rep.total ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rep.critical && rep.critical > 0 ? "destructive" : "secondary"}>{rep.critical ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rep.high && rep.high > 0 ? "destructive" : "secondary"}>{rep.high ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewReport(rep.reportPath)}
                          data-testid={`button-view-report-${rep.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadReport(rep.reportPath, "html")}
                          data-testid={`button-download-report-${rep.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(rep.id)}
                          data-testid={`button-delete-report-${rep.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan Report</DialogTitle>
            <DialogDescription className="font-mono">
              {selectedScan?.targetUrl}
            </DialogDescription>
          </DialogHeader>
          {selectedScan && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-bold">{selectedScan.totalVulnerabilities}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-md">
                  <p className="text-xl font-bold text-destructive">{selectedScan.criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="text-center p-3 bg-orange-500/10 rounded-md">
                  <p className="text-xl font-bold text-orange-500">{selectedScan.highCount}</p>
                  <p className="text-xs text-muted-foreground">High</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-md">
                  <p className="text-xl font-bold text-yellow-500">{selectedScan.mediumCount}</p>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Vulnerabilities</h4>
                {selectedScan.vulnerabilities?.length === 0 ? (
                  <p className="text-muted-foreground">No vulnerabilities found.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedScan.vulnerabilities?.map((vuln, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-muted/30 rounded-md border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant={vuln.severity === "Critical" || vuln.severity === "High" ? "destructive" : "secondary"}>
                            {vuln.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{vuln.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{vuln.description}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-2">
                              Affected: {vuln.affectedUrl}
                            </p>
                            {vuln.remediation && (
                              <p className="text-sm text-primary mt-2">
                                <strong>Fix:</strong> {vuln.remediation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => handleDownloadReport(`/api/reports/export/${selectedScan.id}`, "json")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                  <Button onClick={() => handleDownloadReport(`/api/reports/export/${selectedScan.id}`, "html")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download HTML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Play, Loader2, Globe, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScanNow() {
  const [url, setUrl] = useState("");
  const [scanType, setScanType] = useState("quick");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  // todo: remove mock functionality
  const recentUrls = [
    "https://example.com",
    "https://test-site.org",
    "https://demo.app",
  ];

  const handleStartScan = () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to scan",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    toast({
      title: "Scan Started",
      description: `Scanning ${url} with ${scanType} scan...`,
    });

    // todo: remove mock functionality - simulate scan
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: "Vulnerability scan completed successfully",
      });
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-scan-now">
      <h1 className="text-2xl font-semibold text-foreground">Scan Now</h1>
      
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Start New Scan
          </CardTitle>
          <CardDescription>
            Enter the target URL and select scan type to begin vulnerability assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target-url">Target URL</Label>
            <div className="flex gap-2">
              <Input
                id="target-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12"
                data-testid="input-target-url"
              />
              <Button
                onClick={handleStartScan}
                disabled={isScanning}
                className="h-12 px-6"
                data-testid="button-start-scan"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scan-type">Scan Type</Label>
            <Select value={scanType} onValueChange={setScanType}>
              <SelectTrigger className="w-full md:w-64" data-testid="select-scan-type">
                <SelectValue placeholder="Select scan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Scan
                  </div>
                </SelectItem>
                <SelectItem value="deep">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Deep Scan
                  </div>
                </SelectItem>
                <SelectItem value="full">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Full Scan
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recently Scanned</Label>
            <div className="flex flex-wrap gap-2">
              {recentUrls.map((recentUrl) => (
                <Badge
                  key={recentUrl}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setUrl(recentUrl)}
                  data-testid={`badge-recent-${recentUrl.replace(/[^a-z0-9]/gi, '-')}`}
                >
                  {recentUrl}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isScanning && (
        <Card className="bg-card border-card-border border-primary/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium text-foreground">Scanning in progress...</p>
                <p className="text-sm text-muted-foreground">Analyzing {url}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

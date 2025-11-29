import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Key, Bell, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("zap_sk_***************");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scanDepth, setScanDepth] = useState("medium");
  const [autoScan, setAutoScan] = useState(false);

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const handleRegenerateKey = () => {
    setApiKey("zap_sk_" + Math.random().toString(36).substring(2, 15));
    toast({
      title: "API Key Regenerated",
      description: "Your new API key has been generated",
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-settings">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

      <div className="grid gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Manage your API keys for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  readOnly
                  className="font-mono"
                  data-testid="input-api-key"
                />
                <Button variant="secondary" onClick={handleRegenerateKey} data-testid="button-regenerate-key">
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this key to authenticate API requests
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Scan Settings
            </CardTitle>
            <CardDescription>
              Configure default scanning behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default Scan Depth</Label>
              <Select value={scanDepth} onValueChange={setScanDepth}>
                <SelectTrigger className="w-full md:w-64" data-testid="select-scan-depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shallow">Shallow - Quick scan</SelectItem>
                  <SelectItem value="medium">Medium - Standard scan</SelectItem>
                  <SelectItem value="deep">Deep - Comprehensive scan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-scan">Auto-scan new URLs</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically start scanning when a new URL is added
                </p>
              </div>
              <Switch
                id="auto-scan"
                checked={autoScan}
                onCheckedChange={setAutoScan}
                data-testid="switch-auto-scan"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive email alerts when scans complete
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                data-testid="switch-email-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} data-testid="button-save-settings">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Clock, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockSchedules = [
  {
    id: 1,
    url: "https://example.com",
    frequency: "daily",
    time: "02:00",
    enabled: true,
    lastRun: "2025-11-29 02:00",
  },
  {
    id: 2,
    url: "https://test-site.org",
    frequency: "weekly",
    time: "03:00",
    enabled: true,
    lastRun: "2025-11-25 03:00",
  },
  {
    id: 3,
    url: "https://demo.app",
    frequency: "monthly",
    time: "01:00",
    enabled: false,
    lastRun: "2025-11-01 01:00",
  },
];

export default function Scheduling() {
  const [schedules, setSchedules] = useState(mockSchedules);
  const [newUrl, setNewUrl] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("02:00");
  const { toast } = useToast();

  const handleAddSchedule = () => {
    if (!newUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to schedule",
        variant: "destructive",
      });
      return;
    }

    const newSchedule = {
      id: Date.now(),
      url: newUrl,
      frequency,
      time,
      enabled: true,
      lastRun: "Never",
    };

    setSchedules([...schedules, newSchedule]);
    setNewUrl("");
    toast({
      title: "Schedule Added",
      description: `Scheduled ${frequency} scan for ${newUrl}`,
    });
  };

  const handleToggleSchedule = (id: number) => {
    setSchedules(
      schedules.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    toast({
      title: "Schedule Removed",
      description: "Scheduled scan has been deleted",
    });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-scheduling">
      <h1 className="text-2xl font-semibold text-foreground">Scheduling</h1>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Schedule
          </CardTitle>
          <CardDescription>
            Set up automated scans to run at regular intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="schedule-url">Target URL</Label>
              <Input
                id="schedule-url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                data-testid="input-schedule-url"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger data-testid="select-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-schedule-time"
              />
            </div>
          </div>
          <Button onClick={handleAddSchedule} data-testid="button-add-schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Scheduled Scans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No scheduled scans. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/50 border border-border"
                  data-testid={`schedule-item-${schedule.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground truncate">
                      {schedule.url}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary">{schedule.frequency}</Badge>
                      <span className="text-xs text-muted-foreground">
                        at {schedule.time}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Last run: {schedule.lastRun}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {schedule.enabled ? (
                        <Play className="w-4 h-4 text-primary" />
                      ) : (
                        <Pause className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={() => handleToggleSchedule(schedule.id)}
                        data-testid={`switch-schedule-${schedule.id}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      data-testid={`button-delete-schedule-${schedule.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ActivityItem {
  id: number;
  type: string;
  status: string;
  timestamp: string;
  action: string;
}

interface ActivityTableProps {
  activities: ActivityItem[];
  onViewSource?: (id: number) => void;
}

export default function ActivityTable({ activities, onViewSource }: ActivityTableProps) {
  return (
    <Card className="bg-card border-card-border" data-testid="activity-table">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-12">#</TableHead>
              <TableHead className="text-muted-foreground">Completed Scans</TableHead>
              <TableHead className="text-muted-foreground">Collaterals</TableHead>
              <TableHead className="text-muted-foreground">Scanteles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow 
                key={activity.id} 
                className="border-border"
                data-testid={`activity-row-${activity.id}`}
              >
                <TableCell className="text-foreground font-medium">{activity.id}</TableCell>
                <TableCell className="text-foreground">{activity.status}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{activity.timestamp}</TableCell>
                <TableCell>
                  <button
                    onClick={() => onViewSource?.(activity.id)}
                    className="text-primary hover:underline text-sm"
                    data-testid={`link-source-${activity.id}`}
                  >
                    {activity.action}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

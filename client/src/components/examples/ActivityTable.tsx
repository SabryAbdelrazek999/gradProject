import ActivityTable from '../ActivityTable';

// todo: remove mock functionality
const mockActivities = [
  { id: 1, type: 'Completed Scans', status: 'Completed', timestamp: '15:10 29.50', action: 'Sourtexis' },
  { id: 2, type: 'Completed Scans', status: 'Reports', timestamp: '27.00 20.21', action: 'Sourtexis' },
  { id: 3, type: 'Completed Scans', status: 'Completed', timestamp: '32.30 20.20', action: 'Sourtexis' },
];

export default function ActivityTableExample() {
  return (
    <div className="p-4">
      <ActivityTable 
        activities={mockActivities} 
        onViewSource={(id) => console.log('View source for activity:', id)}
      />
    </div>
  );
}

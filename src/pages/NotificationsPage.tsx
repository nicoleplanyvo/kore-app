import { Bell } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import t from '../locales/de.json';

export function NotificationsPage() {
  return (
    <EmptyState
      icon={Bell}
      title={t.notifications.title}
      description={t.notifications.empty}
    />
  );
}

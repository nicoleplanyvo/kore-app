import { GraduationCap } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import t from '../locales/de.json';

export function TrainingPage() {
  return (
    <EmptyState
      icon={GraduationCap}
      title={t.training.title}
      description={t.training.description}
    />
  );
}

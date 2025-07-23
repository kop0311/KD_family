import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { TasksContent } from '@/components/features/tasks/TasksContent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: '任务管理 - KD之家',
  description: '管理和完成家务任务'
};

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <TasksContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

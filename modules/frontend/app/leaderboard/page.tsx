import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { LeaderboardContent } from '@/components/features/leaderboard/LeaderboardContent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: '排行榜 - KD之家',
  description: '查看家庭成员积分排行榜'
};

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <LeaderboardContent />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

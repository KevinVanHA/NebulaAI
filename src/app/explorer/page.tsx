'use client'; // Required for client-side hooks

export const dynamic = 'force-dynamic'; // Disable static generation

import { Suspense } from 'react'; // Add this
import BlockchainExplorer from '@/app/components/BlockchainExplorer';

export default function ExplorerPage() {
  return (
    <div className="h-screen">
      {/* Wrap the component in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <BlockchainExplorer />
      </Suspense>
    </div>
  );
}
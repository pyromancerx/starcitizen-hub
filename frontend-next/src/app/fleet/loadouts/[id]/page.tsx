import React, { Suspense } from 'react';
import LoadoutBuilderClient from './LoadoutBuilderClient';

export async function generateStaticParams() {
  // We only statically export 'new'. 
  // Existing loadouts will be handled via client-side routing in the exported app
  // or we could fetch all IDs from the DB if it were a build-time DB.
  // Since it's a self-hosted app with its own DB, 'new' is the only safe static path.
  return [{ id: 'new' }];
}

export default function LoadoutBuilderPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center uppercase font-black text-sc-blue animate-pulse tracking-[0.5em]">Synchronizing Neural Link...</div>}>
            <LoadoutBuilderClient />
        </Suspense>
    );
}

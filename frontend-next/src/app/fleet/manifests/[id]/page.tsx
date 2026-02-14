import React, { Suspense } from 'react';
import ManifestBuilderClient from './ManifestBuilderClient';

export async function generateStaticParams() {
  return [{ id: 'new' }];
}

export default function ManifestBuilderPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black text-sc-blue animate-pulse tracking-[0.5em]">Accessing Logistics Core...</div>}>
      <ManifestBuilderClient />
    </Suspense>
  );
}

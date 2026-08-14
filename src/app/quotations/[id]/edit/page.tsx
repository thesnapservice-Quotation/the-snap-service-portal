'use me';
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import NewQuotationPage from '../../new/page';

export default function EditQuotationPage() {
  const params = useParams();
  const id = params.id as string;

  // We reuse the main editor component by rendering it with query param / ID context
  return <NewQuotationPage />;
}

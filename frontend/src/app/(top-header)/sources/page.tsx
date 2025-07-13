"use client";

import { useState } from "react";
import { DocumentUpload } from "./_components/document-upload";
import { SourcesList } from "./_components/sources-list";

export default function SourcesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sources</h1>
          <p className="text-gray-600">
            Manage your document sources. Upload new documents and view existing sources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>
          <div>
            <SourcesList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
} 
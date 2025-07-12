import { DocumentUpload } from "./_components/document-upload";

export default function TestIngestionPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Ingestion Pipeline</h1>
          <p className="text-gray-600">
            Upload documents to test the ingestion pipeline. Supports PDF, DOCX, and TXT files.
          </p>
        </div>
        
        <DocumentUpload />
      </div>
    </div>
  );
} 
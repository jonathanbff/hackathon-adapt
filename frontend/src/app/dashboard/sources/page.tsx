import { DocumentUpload } from "~/app/(top-header)/sources/_components/document-upload";
import { SourcesList } from "~/app/(top-header)/sources/_components/sources-list";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sources</h1>
        <p className="text-muted-foreground">
          Upload and manage your learning documents
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <DocumentUpload />
        <SourcesList />
      </div>
    </div>
  );
} 
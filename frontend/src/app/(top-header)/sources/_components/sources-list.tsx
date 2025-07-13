"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { FileText, File, Clock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { api } from "~/trpc/react";

interface SourcesListProps {
  refreshTrigger?: number;
}

export function SourcesList({ refreshTrigger }: SourcesListProps) {
  const [limit] = useState(20);
  const [offset] = useState(0);

  const { data: sourcesData, isLoading, refetch } = api.sources.getAll.useQuery({
    limit,
    offset,
  });

  // Poll every 3 seconds when there are pending documents
  useEffect(() => {
    const hasPending = sourcesData?.documents?.some(doc => doc.processingStatus === "pending");
    if (hasPending) {
      const interval = setInterval(() => {
        refetch();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sourcesData, refetch]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const { data: stats, refetch: refetchStats } = api.sources.getStats.useQuery({});

  // Poll stats every 5 seconds when there are pending documents
  useEffect(() => {
    const hasPending = stats?.processing && stats.processing > 0;
    if (hasPending) {
      const interval = setInterval(() => {
        refetchStats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [stats, refetchStats]);

  // Refetch stats when main data changes
  useEffect(() => {
    refetchStats();
  }, [sourcesData, refetchStats]);

  // Add mutation to fix stuck documents
  const fixStuckDocuments = api.sources.fixStuckDocuments.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
    },
  });

  const getFileIcon = (documentType: string) => {
    switch (documentType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "docx":
        return <File className="h-5 w-5 text-blue-500" />;
      case "txt":
        return <File className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default" as const,
      pending: "secondary" as const,
      failed: "destructive" as const,
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const documents = sourcesData?.documents || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sources</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
              {stats && stats.processing > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fixStuckDocuments.mutate()}
                  disabled={fixStuckDocuments.isPending}
                >
                  {fixStuckDocuments.isPending ? "Fixing..." : "Fix Stuck"}
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Your uploaded documents and their processing status
          </CardDescription>
          {stats && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total: {stats.total}</span>
              <span>Processing: {stats.processing}</span>
              <span>Completed: {stats.completed}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No sources uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.documentType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium truncate">
                        {doc.filename}
                      </p>
                      {getStatusBadge(doc.processingStatus)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{doc.documentType.toUpperCase()}</span>
                      <span>{formatFileSize(doc.assetSize)}</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(doc.processingStatus)}
                    {doc.assetUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.assetUrl!, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
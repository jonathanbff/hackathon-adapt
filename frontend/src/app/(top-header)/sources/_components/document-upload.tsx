"use client";

import { useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { uploadDocument } from "../_actions/upload-document";
import { Upload, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface UploadStatus {
  status: "idle" | "uploading" | "processing" | "completed" | "error";
  message: string;
  documentId?: string;
}

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    message: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    setSelectedFile(file);
    setUploadStatus({ status: "idle", message: "" });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ status: "uploading", message: "Uploading document..." });

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await uploadDocument(formData);

      if (result.error) {
        setUploadStatus({
          status: "error",
          message: result.error,
        });
        return;
      }

      setUploadStatus({
        status: "processing",
        message: "Document uploaded successfully. Processing in background...",
        documentId: result.documentId,
      });

      // Immediately call success callback to refresh the sources list
      onUploadSuccess?.();

      // Reset form after a short delay to show the success message
      setTimeout(() => {
        setUploadStatus({
          status: "completed",
          message: "Document has been added to your sources",
        });
        setSelectedFile(null);
        if (fileRef.current) {
          fileRef.current.value = "";
        }
      }, 1000);
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: "Upload failed. Please try again.",
      });
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Source</CardTitle>
          <CardDescription>
            Upload documents to add them to your sources library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              handleFileChange(file);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  Drop your document here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, or TXT files up to 10MB
                </p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadStatus.status === "uploading"}
                size="sm"
              >
                {uploadStatus.status === "uploading" ? "Uploading..." : "Upload"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadStatus.message && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <p className="text-sm">{uploadStatus.message}</p>
            </div>
            {uploadStatus.documentId && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                Document ID: {uploadStatus.documentId}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
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
  progress?: string;
}

export function DocumentUpload() {
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
        alert(result.error);
        return;
      }

      setUploadStatus({
        status: "processing",
        message: "Document uploaded successfully. Processing in background...",
        documentId: result.documentId,
      });

      alert("Document uploaded and processing started!");
      
      setSelectedFile(null);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: "Upload failed. Please try again.",
      });
      alert("Upload failed. Please try again.");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Choose a PDF, DOCX, or TXT file to process through the ingestion pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">1. Document validation (pass-through)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">2. Store document in blob storage</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">3. Parse PDF to markdown (PDF only)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">4. Extract metadata and layout</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">5. Split content and create vector embeddings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
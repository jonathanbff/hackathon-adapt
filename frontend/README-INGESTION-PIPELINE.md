# Document Ingestion Pipeline

This document ingestion pipeline is built using Trigger.dev to process documents, extract content, and store them in a vector database for retrieval. The pipeline is organized as numbered tasks with a main orchestration task.

## Pipeline Structure

### Individual Tasks

1. **00-validate-document.ts** - Validates uploaded documents using AI
2. **01-store-document-blob.ts** - Stores documents in Vercel Blob storage
3. **02-parse-pdf-to-markdown.ts** - Converts PDFs to markdown using LlamaParse
4. **03-store-markdown-blob.ts** - Stores markdown content in Vercel Blob
5. **04-extract-metadata-layout.ts** - Extracts metadata and layout information
6. **05-split-and-vectorize.ts** - Splits content and stores in Upstash Vector
7. **main-ingestion-task.ts** - Main orchestration task

### Pipeline Flow

```
Document Upload
    ↓
1. Validate Document (AI validation)
    ↓
2. Store Document Blob (Vercel Blob)
    ↓
3. Parse PDF to Markdown (LlamaParse) [PDF only]
    ↓
4. Store Markdown Blob (Vercel Blob) [PDF only]
    ↓
5. Extract Metadata & Layout (AI extraction)
    ↓
6. Split & Vectorize (Upstash Vector)
    ↓
Complete
```

## Required Dependencies

Install the following packages:

```bash
pnpm add @vercel/blob ai @ai-sdk/openai @upstash/vector @ai-sdk/groq @clerk/nextjs
```

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# LlamaParse API
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key

# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Groq API (optional)
GROQ_API_KEY=your_groq_api_key
```

## Database Schema

The pipeline uses two new database tables:

### Assets Table
- Stores document blobs and metadata
- Links to user via `_clerk` field
- Tracks file URLs, paths, and content types

### Content Table
- Stores processed document content
- Contains markdown text and extracted metadata
- Links to user via `_clerk` field

Run database migration:
```bash
pnpm db:generate
pnpm db:push
```

## Usage

### Triggering the Pipeline

```typescript
import { tasks } from "@trigger.dev/sdk/v3";
import { mainIngestionTask } from "~/server/trigger/ingestion";

// Trigger the main ingestion task
await tasks.trigger<typeof mainIngestionTask>("ingestion.main", {
  document: {
    id: "document-uuid",
    url: "https://document-url.com/file.pdf",
    filename: "document.pdf"
  },
  userId: "user-clerk-id"
});
```

### Pipeline Features

1. **Document Validation**: AI-powered validation ensures only valid documents are processed
2. **Multi-format Support**: Handles PDF, DOCX, TXT, and other document types
3. **Blob Storage**: Stores original documents and processed markdown in Vercel Blob
4. **Metadata Extraction**: Extracts document metadata, layout information, and bounding boxes
5. **Vector Storage**: Splits content into chunks and stores embeddings in Upstash Vector
6. **Error Handling**: Comprehensive error handling with retry logic
7. **Progress Tracking**: Real-time status updates via Trigger.dev metadata

### Processing Steps

For **PDF documents**:
1. Validate document authenticity
2. Store original document in blob storage
3. Parse PDF to markdown using LlamaParse
4. Store markdown in blob storage
5. Extract metadata and layout information
6. Split content and create vector embeddings

For **non-PDF documents**:
1. Validate document authenticity
2. Store original document in blob storage
3. Extract text content directly
4. Extract metadata and layout information
5. Split content and create vector embeddings

## Configuration

### Chunk Settings
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Embedding Model**: OpenAI text-embedding-3-small
- **Vector Batch Size**: 100 items per upload

### Retry Configuration
- **Document Validation**: 3 attempts
- **Blob Storage**: 3 attempts
- **PDF Parsing**: 3 attempts
- **Vectorization**: 3 attempts
- **Main Pipeline**: 1 attempt (individual tasks handle retries)

## Monitoring

The pipeline provides detailed logging and status updates:
- Document validation results
- Blob storage confirmations
- PDF parsing progress
- Vectorization statistics
- Error details and retry attempts

## Error Handling

Common error scenarios:
1. **Invalid Document**: AI validation rejects non-document files
2. **Blob Storage Failure**: Network issues or storage quota exceeded
3. **PDF Parsing Timeout**: Large documents may require extended processing
4. **Vector Database Limits**: Upstash quota or rate limits
5. **Missing Environment Variables**: Configuration errors

## Integration Points

The pipeline integrates with:
- **Trigger.dev**: Background job processing
- **Vercel Blob**: Document and markdown storage
- **LlamaParse**: PDF to markdown conversion
- **Upstash Vector**: Vector database for embeddings
- **OpenAI**: AI validation and embeddings
- **Drizzle ORM**: Database operations
- **Clerk**: User authentication

## Performance Considerations

- **Parallel Processing**: Individual tasks can run in parallel where possible
- **Batch Operations**: Vector uploads are batched for efficiency
- **Streaming**: Large documents are processed in chunks
- **Caching**: Blob storage provides built-in caching
- **Rate Limiting**: Respects API rate limits for external services

## Extending the Pipeline

To add new processing steps:
1. Create a new numbered task file (e.g., `06-new-task.ts`)
2. Follow the existing task structure and patterns
3. Add the task to the main orchestration flow
4. Update the index.ts exports
5. Add appropriate error handling and logging

The pipeline is designed to be modular and extensible, allowing for easy addition of new processing steps or modification of existing ones. 
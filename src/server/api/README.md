# tRPC API Documentation

This document explains the structure and usage of the tRPC API in this project.

## Architecture Overview

The API follows a **separation of concerns** pattern with a clear directory structure:

```
src/server/api/
├── trpc.ts              # tRPC configuration and procedures
├── root.ts              # Main router that combines all sub-routers
└── routers/             # Domain-specific routers
    ├── post/            # Post-related endpoints
    └── user/            # User-related endpoints
        ├── index.ts     # Main user router
        └── procedures/  # Individual procedures
            ├── index.ts          # Export all procedures
            ├── get-profile.ts    # Get user profile
            └── get-all-users.ts  # Get all users with pagination
```

## Key Concepts

### Procedures
Procedures are the individual API endpoints. Each procedure is defined in its own file for better organization and maintainability.

### Routers
Routers group related procedures together. Each domain (user, post, etc.) has its own router.

### Separation of Concerns
- **Procedures**: Individual API logic
- **Routers**: Group related procedures
- **Root Router**: Combines all routers
- **tRPC Configuration**: Handles middleware and context

## Usage Examples

### Client-side Usage

```typescript
import { api } from "~/trpc/react";

// Get user profile
const { data: userProfile } = api.user.getProfile.useQuery({
  userId: "user-uuid-here"
});

// Get all users with pagination
const { data: usersData } = api.user.getAllUsers.useQuery({
  limit: 20,
  offset: 0
});

// Example with post router
const { data: greeting } = api.post.hello.useQuery({
  text: "World"
});
```

### Server-side Usage

```typescript
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

// Create a server-side caller
const trpc = createCaller(await createTRPCContext({ headers: new Headers() }));

// Call procedures directly
const userProfile = await trpc.user.getProfile({
  userId: "user-uuid-here"
});
```

## Available Endpoints

### User Router (`api.user`)

#### `getProfile`
Get a specific user's profile information.

**Input:**
```typescript
{
  userId: string; // UUID format
}
```

**Output:**
```typescript
{
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `getAllUsers`
Get a paginated list of all users.

**Input:**
```typescript
{
  limit?: number;  // 1-100, default: 10
  offset?: number; // default: 0
}
```

**Output:**
```typescript
{
  users: Array<{
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

### Post Router (`api.post`)

#### `hello`
Simple greeting endpoint for testing.

**Input:**
```typescript
{
  text: string;
}
```

**Output:**
```typescript
{
  greeting: string;
}
```

#### `getLatest`
Get the latest post (mock data for now).

**Input:** None

**Output:**
```typescript
{
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}
```

## Adding New Procedures

To add a new procedure, follow these steps:

1. **Create the procedure file** in the appropriate router's `procedures/` directory:
   ```typescript
   // src/server/api/routers/user/procedures/create-user.ts
   import { publicProcedure } from "~/server/api/trpc";
   import { z } from "zod";
   
   export const createUser = publicProcedure
     .input(
       z.object({
         email: z.string().email(),
         name: z.string().min(1),
         password: z.string().min(8),
       })
     )
     .mutation(async ({ ctx, input }) => {
       // Implementation here
     });
   ```

2. **Export the procedure** in the procedures index file:
   ```typescript
   // src/server/api/routers/user/procedures/index.ts
   export { createUser } from "./create-user";
   ```

3. **Add to the router**:
   ```typescript
   // src/server/api/routers/user/index.ts
   import { createUser } from "./procedures";
   
   export const userRouter = createTRPCRouter({
     // ... existing procedures
     createUser,
   });
   ```

## Error Handling

The API uses tRPC's built-in error handling with custom error codes:

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "NOT_FOUND",
  message: "User not found",
});
```

Common error codes:
- `NOT_FOUND`: Resource doesn't exist
- `BAD_REQUEST`: Invalid input
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `INTERNAL_SERVER_ERROR`: Server error

## Type Safety

All procedures are fully type-safe from client to server:
- Input validation with Zod schemas
- Automatic TypeScript inference
- End-to-end type safety with tRPC
- Database type safety with Drizzle ORM

## Development Notes

- All procedures currently use `publicProcedure` since authentication isn't implemented yet
- The structure is designed to easily add `protectedProcedure` when authentication is ready
- Each procedure includes proper error handling and validation
- The separation of concerns makes testing and maintenance easier 
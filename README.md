# TaskFlow

TaskFlow is a backend task and project management API built with Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, and BullMQ.

## Features

### Authentication

- User registration and login
- JWT access tokens
- Refresh tokens
- Refresh-token rotation
- Refresh-token revocation
- Logout
- Protected API routes
- Password hashing with bcrypt

### Organizations

- Create, list, and retrieve organizations
- Add and manage organization members
- Change member roles
- Remove members

### Projects

- Create, list, retrieve, update, and delete projects

### Tasks

- Create, list, retrieve, update, and delete tasks
- Status and priority management
- Due dates
- Filtering by status, priority, assignee, and due-date range

### Assignments

- Assign users to tasks
- List task assignments
- Remove task assignments

### Comments

- Create comments
- List comments
- Update comments
- Delete comments

### Background Jobs

- Redis-backed task reminder queue
- BullMQ delayed jobs
- Dedicated background worker
- Retry with exponential backoff

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| TypeScript | Application language |
| Express | REST API |
| PostgreSQL | Database |
| Prisma | ORM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Redis | Queue backend |
| BullMQ | Background jobs |
| Zod | Request validation |
| Docker Compose | Service orchestration |
| Node.js Test Runner | Automated testing |

## Architecture

```text
Client
  |
  v
Express API :3000
  |
  +------ PostgreSQL
  |
  +------ Redis
             |
             v
           BullMQ
             |
             v
           Worker
       Task Reminders

Authentication
  |
  +-- Access Token
  |
  +-- Refresh Token
      |
      +-- Rotation
      +-- Revocation

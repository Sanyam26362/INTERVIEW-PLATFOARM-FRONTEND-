# InterviewAI — Frontend

Next.js 16 + TypeScript + Tailwind + shadcn/ui + Clerk Auth

## Backend
`https://ai-mock-interview-platform-backend.onrender.com`

## Setup

### 1. Install dependencies
```bash
pnpm install
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```

Fill in your Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=https://ai-mock-interview-platform-backend.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://ai-mock-interview-platform-backend.onrender.com
```

### 3. Run dev server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/signin` | Clerk sign in |
| `/signup` | Clerk sign up |
| `/dashboard` | Candidate dashboard (protected) |
| `/interview/[sessionId]` | Live AI interview (protected) |
| `/report/[reportId]` | Evaluation report (protected) |
| `/profile` | User profile & settings (protected) |

## User Journey

```
Sign up → Dashboard → Select domain + language → Start Interview
→ Chat with AI (Socket.io) → End Interview → Evaluation Report
```

## Deploy to Vercel

```bash
pnpm build   # test build locally first
vercel       # deploy
```

Add all `.env.local` variables to Vercel dashboard under Project → Settings → Environment Variables.

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Auth**: Clerk (`@clerk/nextjs`)
- **UI**: shadcn/ui + Tailwind CSS v4
- **API**: Axios with auto JWT attachment
- **Real-time**: Socket.io client
- **Charts**: Recharts
- **Notifications**: Sonner

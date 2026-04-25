# Meet Point - Group Travel Platform

A modern Next.js 14 app for planning group trips with friends. Built with Supabase for authentication and real-time data.

## Features

- User authentication with Supabase
- Create and manage group trips
- Invite attendees via email
- Track member responses and preferences
- Responsive design with Monzo-inspired aesthetics
- Real-time updates with Supabase

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser

### Installation

1. Extract the project files
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
meet-point-app/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (app)/               # Protected app pages
│   │   ├── dashboard/       # Main dashboard
│   │   └── trips/           # Trip management
│   ├── auth/
│   │   └── callback/        # OAuth callback handler
│   ├── globals.css
│   └── layout.tsx
├── components/              # Reusable components
├── lib/
│   └── supabase/            # Supabase client setup
├── types/
│   └── database.ts          # TypeScript database types
├── middleware.ts            # Auth middleware
└── public/

```

## Key Technologies

- **Framework**: Next.js 14 with App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React for icons
- **Type Safety**: TypeScript

## Environment Variables

The app comes pre-configured with Supabase credentials in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://vkbsecdwtaknysbpjaep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are public credentials (anon key) and are safe to commit.

## Database Schema

The app expects the following Supabase tables:

### trips
- id: UUID (primary key)
- name: text
- organiser_id: UUID (foreign key to auth.users)
- group_size: integer
- start_date: date
- end_date: date
- trip_type: text
- payment_method: text
- status: enum ('collecting', 'ready', 'booked')
- created_at: timestamp
- updated_at: timestamp

### trip_members
- id: UUID (primary key)
- trip_id: UUID (foreign key)
- user_id: UUID (nullable, foreign key to auth.users)
- invite_email: text (nullable)
- role: enum ('organiser', 'attendee')
- status: enum ('pending', 'accepted', 'declined')
- created_at: timestamp
- updated_at: timestamp

### member_preferences
- id: UUID (primary key)
- trip_id: UUID (foreign key)
- user_id: UUID (foreign key)
- preferred_airport: text (nullable)
- budget_min: integer (nullable)
- budget_max: integer (nullable)
- created_at: timestamp
- updated_at: timestamp

### trip_options
- id: UUID (primary key)
- trip_id: UUID (foreign key)
- category: text
- title: text
- description: text (nullable)
- estimated_cost: integer (nullable)
- created_at: timestamp

## Design System

The app uses a Monzo-inspired design with:

- **Primary color**: #1a1a2e (dark blue)
- **Accent color**: #e94560 (red)
- **Background soft**: #f8f9fb (light gray)
- **Font**: Inter (from Google Fonts)
- **Border radius**: 16px for cards, 10px for inputs
- **Clean, spacious layout** with excellent typography

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## How to Use

### Sign Up
1. Click "Get started" on the homepage
2. Complete the 3-step signup process
3. Verify your email (if enabled in Supabase)

### Create a Trip
1. Click "+ New trip" in the navigation
2. Fill in trip details (name, dates, type, etc.)
3. Add attendees by their email addresses
4. (Optional) Set your travel preferences
5. Create the trip

### Manage a Trip
1. View all trips on the dashboard
2. Click any trip to see details
3. Track member responses
4. View trip status and timeline

## Common Issues

### "Cannot find module '@supabase/ssr'"
Make sure dependencies are installed: `npm install`

### "Connection refused" error
- Check your internet connection
- Verify Supabase is running
- Check environment variables in `.env.local`

### Styling looks broken
Clear your Next.js cache: `rm -rf .next` then `npm run dev`

## Architecture Notes

- **Server Components**: Used for data fetching and auth checks
- **Client Components**: Used for interactive forms and state management
- **Middleware**: Handles auth token refresh and route protection
- **SSR Pattern**: Uses `@supabase/ssr` for secure cookie-based auth

## Future Enhancements

- Email notifications for invites
- Payment integration for expense splitting
- Vote/poll system for decisions
- Activity feed and comments
- File uploads for trip documents
- Mobile app with React Native

## Support

For issues or questions, check the Supabase documentation:
https://supabase.com/docs

## License

MIT

# Meet Point - Setup & Getting Started

## What's Included

This is a complete, working Next.js 14 application for managing group travel. It includes:

✅ User authentication with Supabase
✅ Protected routes and middleware
✅ Create and manage trips
✅ Invite attendees
✅ Track member responses
✅ Responsive design with Monzo-inspired UI
✅ TypeScript support
✅ All dependencies pre-configured

## Quick Start (2 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Open in browser
Go to: http://localhost:3000

## First Use

### Sign Up
1. Click "Get started" button
2. Enter email and create password
3. Complete 3-step signup (Account → Profile → Preferences)
4. Click "Create account"

### Create a Trip
1. After signup, you'll see the dashboard
2. Click "+ New trip" button
3. Fill in trip details (name, dates, etc.)
4. Add attendees by email
5. (Optional) Set your preferences
6. Click "Create trip"

### View Dashboard
- See all your trips and events
- Track member responses
- Click any trip to view details

## Files Structure

```
meet-point-app/
├── app/
│   ├── (auth)/              # Login & signup pages
│   ├── (app)/               # Protected pages (after login)
│   │   ├── dashboard/       # Your trips overview
│   │   └── trips/           # Trip creation & details
│   ├── auth/callback/       # OAuth callback
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # Reusable UI components
├── lib/supabase/            # Supabase configuration
├── types/database.ts        # Database TypeScript types
├── middleware.ts            # Auth middleware
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind CSS config
└── .env.local               # Environment variables (pre-filled)
```

## Technology Stack

- **Framework**: Next.js 14 (React 18)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Dates**: date-fns
- **Language**: TypeScript

## Environment Variables

The app comes pre-configured with Supabase credentials in `.env.local`. These are:
- Public URL for your Supabase project
- Anon key (safe to use in browser)

No additional setup needed!

## Available Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## How the App Works

### Authentication Flow
1. User signs up with email & password
2. Supabase creates an auth user
3. Profile data stored in user metadata
4. Auth token saved in secure cookie
5. Middleware refreshes token on each request

### Trip Creation Flow
1. User fills in trip details
2. Trip created in `trips` table
3. Organiser added as member with 'accepted' status
4. Attendees added with 'pending' status
5. Trip status set to 'collecting'
6. User redirected to trip detail page

### Member Management
- Organisers can create trips and invite attendees
- Attendees receive invite (email optional)
- Track responses: pending → accepted/declined
- Progress bar shows % of group that responded

## Database Tables

The app uses these Supabase tables:

**trips** - Trip metadata (name, dates, status, organiser_id)
**trip_members** - Trip attendees and their responses
**member_preferences** - User preferences (airport, budget)
**trip_options** - Accommodation, flight, activity options

## Design System (Monzo-Inspired)

- **Primary**: #1a1a2e (dark)
- **Accent**: #e94560 (red)
- **Soft BG**: #f8f9fb (light gray)
- **Font**: Inter (Google Fonts)
- **Rounded corners**: 16px cards, 10px inputs
- **Clean, spacious layout** with excellent whitespace

## Common Tasks

### Test the App

1. **Create an account**: Sign up with any email
2. **Create a trip**: Add trip details and invite attendees
3. **View dashboard**: See all your trips
4. **Check trip detail**: Click a trip to see members & status

### View Data in Supabase

1. Go to https://supabase.com
2. Log in with your Supabase account
3. Open the Meet Point project
4. Browse tables to see trips and members you created

### Make Changes

- Edit components in `/components`
- Edit pages in `/app`
- Edit styles in `/app/globals.css` or Tailwind classes
- Changes auto-reload in dev server

## Troubleshooting

### "Cannot find module" error
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```
(or use any other free port)

### Styling looks broken
```bash
rm -rf .next
npm run dev
```

### Connection errors
- Check internet connection
- Verify Supabase credentials in `.env.local`
- Check Supabase project is running

## Next Steps

1. **Customize**: Edit the design colors in `tailwind.config.ts`
2. **Add features**: Extend the database schema and create new pages
3. **Deploy**: Deploy to Vercel (built for Next.js)

## Deployment

Ready to deploy? Options:

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Docker
```bash
docker build -t meet-point .
docker run -p 3000:3000 meet-point
```

### Self-hosted
```bash
npm run build
npm start
```

## Support

- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- Tailwind docs: https://tailwindcss.com/docs
- React docs: https://react.dev

## Notes

- The app uses Server Components for auth checks and data fetching
- Client Components are used only for interactive forms
- Middleware handles auth token refresh on every request
- All form submissions are client-side with Supabase SDK
- Database queries are read-only on the browser (SSR only)

## License

MIT - Feel free to use and modify!

---

**Ready to run?** Execute:
```bash
npm install && npm run dev
```

That's it! 🚀

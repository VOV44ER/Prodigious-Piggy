# The Prodigious Piggy

AI-powered foodie discovery platform for finding the best restaurants, cafes, bars, and dining spots in Casablanca, Morocco.

## 🚀 Features

- **AI-Powered Chat**: Chat with Piggy, your foodie discovery assistant powered by OpenAI
- **Interactive Maps**: Explore places on beautiful Mapbox maps with location-based search
- **Curated Places**: Hand-picked restaurants, cafes, and bakeries in Casablanca
- **Smart Recommendations**: Get personalized suggestions based on your preferences
- **User Authentication**: Secure auth with Supabase
- **Real-time Data**: Powered by Supabase for real-time updates

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI GPT-4o-mini
- **Maps**: Mapbox GL
- **Analytics**: Plausible (stub)
- **Payments**: Paddle (sandbox)
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key
- Mapbox access token (optional, for maps)
- Paddle vendor ID (optional, for payments)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd Prodigious-Piggy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# Mapbox (optional)
VITE_MAPBOX_TOKEN=your_mapbox_token

# Paddle (optional, for payments)
VITE_PADDLE_VENDOR_ID=your_paddle_vendor_id
VITE_PADDLE_SANDBOX=true

# Plausible (optional, for analytics)
VITE_PLAUSIBLE_DOMAIN=your_domain
VITE_PLAUSIBLE_API_HOST=https://plausible.io
```

### 4. Set up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `src/db/schema.sql` in your Supabase SQL Editor
3. Or use the migration file in `supabase/migrations/`

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── chat/          # Chat components
│   ├── filters/       # Filter components
│   ├── layout/        # Layout components
│   ├── place/         # Place-related components
│   └── ui/            # shadcn/ui components
├── config/            # Configuration files
├── data/              # Static data (places, etc.)
├── db/                # Database schema
├── hooks/             # Custom React hooks
├── integrations/      # Third-party integrations
│   ├── mapbox/       # Mapbox integration
│   ├── openai/       # OpenAI integration
│   ├── paddle/       # Paddle payment integration
│   ├── plausible/    # Plausible analytics integration
│   └── supabase/     # Supabase client and types
├── lib/              # Utility functions
├── pages/            # Page components
└── main.tsx          # Entry point
```

## 🗄️ Database Schema

The project uses Supabase with the following main tables:

- `profiles` - User profiles
- `places` - Restaurant and venue data
- `user_reactions` - User interactions (likes, saves, etc.)
- `chat_sessions` - Chat conversation sessions
- `chat_messages` - Individual chat messages
- `subscriptions` - User subscription data

See `src/db/schema.sql` for the complete schema with RLS policies.

## 🚢 Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app is a SPA and can be deployed to any static hosting:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

### Build for production

```bash
npm run build
```

The `dist/` folder contains the production build.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## 🔐 Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the client.

Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY`

Optional:
- `VITE_MAPBOX_TOKEN` - For map functionality
- `VITE_PADDLE_VENDOR_ID` - For payment processing
- `VITE_PADDLE_SANDBOX` - Enable Paddle sandbox mode
- `VITE_PLAUSIBLE_DOMAIN` - For analytics
- `VITE_PLAUSIBLE_API_HOST` - Plausible API host

## 📝 Features in Development

- [ ] Full Supabase integration for places data
- [ ] Real-time chat history persistence
- [ ] User favorites and lists
- [ ] Advanced filtering and search
- [ ] Payment processing with Paddle
- [ ] Analytics with Plausible

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Maps powered by [Mapbox](https://www.mapbox.com/)
- AI powered by [OpenAI](https://openai.com/)
- Backend by [Supabase](https://supabase.com/)

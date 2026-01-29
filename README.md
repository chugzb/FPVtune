# FPVTune

Neural Network-Powered FPV Drone Tuning Assistant

FPVTune is a neural network-powered assistant for FPV drone PID tuning and configuration optimization. Built with Next.js 15, deployed on Cloudflare Pages.

## Features

- Neural network-powered PID tuning recommendations
- Flight controller configuration analysis
- Blackbox log analysis
- Multi-language support (English/Chinese)
- Google OAuth authentication

## Tech Stack

- Framework: Next.js 15 + React 19 + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL + Drizzle ORM
- Auth: Better Auth (Google OAuth)
- Payment: Stripe
- Deployment: Cloudflare Pages

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Build for Cloudflare
pnpm cf:build

# Deploy to Cloudflare
pnpm cf:deploy
```

## Environment Variables

Copy `env.example` to `.env.local` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `RESEND_API_KEY` - Resend API key for emails

## Links

- Website: [fpvtune.com](https://fpvtune.com)
- Discord: [discord.gg/fpvtune](https://discord.gg/fpvtune)

## License

See [LICENSE](LICENSE) file.

# FitSocial Frontend

This is a [Next.js](https://nextjs.org) project for FitSocial, a fitness challenge platform built on Movement blockchain.

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```bash
# Privy Authentication (Public - safe for client-side)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Shinami Gas Sponsorship (Server-side only - keep secret!)
SHINAMI_API_KEY=your_shinami_api_key_here
SHINAMI_API_URL=https://api.shinami.com  # Optional, defaults to this value
```

#### Environment Variable Details

- **NEXT_PUBLIC_PRIVY_APP_ID** (Required)
  - Your Privy application ID from the [Privy Dashboard](https://dashboard.privy.io/)
  - This is a public identifier and safe to expose in client-side code
  - Used for user authentication and wallet management

- **SHINAMI_API_KEY** (Required for transactions)
  - Your Shinami API key for gas sponsorship
  - **IMPORTANT**: This is a server-side secret. Never expose this in client-side code.
  - Used by `/api/shinami/sponsor` route to sponsor gas fees for user transactions

- **SHINAMI_API_URL** (Optional)
  - Base URL for the Shinami API
  - Defaults to `https://api.shinami.com` if not provided
  - Adjust if using a different Shinami endpoint

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture Overview

### Authentication & Wallet Management

This application uses **Privy** for authentication and wallet management:

- Users sign in with email or social accounts (Google)
- Privy automatically creates and manages Movement wallets for users
- All transactions use Privy-managed wallets (no browser extension required)
- Native wallet options (Nightly, etc.) have been removed

### Transaction Flow

All blockchain transactions follow this flow:

1. **Client**: User initiates a transaction (e.g., increment counter)
2. **Client**: Transaction is built using Aptos SDK
3. **Client**: Transaction is signed using Privy's `signRawHash()` function
4. **Client**: Signed transaction is sent to `/api/shinami/sponsor`
5. **Server**: Server calls Shinami API to sponsor gas fees
6. **Server**: Shinami submits the transaction to Movement network
7. **Server**: Transaction hash is returned to client
8. **Client**: Client waits for transaction confirmation

### Key Files

- `lib/transactions.ts` - Transaction building and signing logic
- `app/api/shinami/sponsor/route.ts` - Server-side gas sponsorship endpoint
- `lib/aptos.ts` - Aptos SDK configuration for Movement network
- `components/auth-button.tsx` - Privy authentication UI
- `hooks/useMovementAuth.ts` - Movement wallet integration hook

### Network Configuration

The app is configured for Movement Testnet by default. To switch networks, update `CURRENT_NETWORK` in `lib/aptos.ts`:

```typescript
export const CURRENT_NETWORK = 'testnet' as keyof typeof MOVEMENT_CONFIGS;
// or
export const CURRENT_NETWORK = 'mainnet' as keyof typeof MOVEMENT_CONFIGS;
```

## Testing

### Manual Testing Flow

1. **Setup**: Ensure all environment variables are set in `.env.local`

2. **Start Server**:
   ```bash
   npm run dev
   ```

3. **Authentication**:
   - Visit the app
   - Click "Sign In"
   - Choose email or Google login
   - Complete Privy authentication flow
   - Verify a Movement wallet is created (check browser console)

4. **Transaction Testing**:
   - Perform an action that triggers a transaction (if applicable)
   - Verify the client signs the transaction
   - Verify the transaction is sent to `/api/shinami/sponsor`
   - Verify Shinami sponsors and submits the transaction
   - Verify transaction appears on Movement explorer

### Troubleshooting

- **"NEXT_PUBLIC_PRIVY_APP_ID is not set"**: Add your Privy App ID to `.env.local`
- **"Gas sponsorship service is not configured"**: Add `SHINAMI_API_KEY` to `.env.local`
- **Transaction failures**: Check server logs for Shinami API errors
- **Network errors**: Verify `SHINAMI_API_URL` is correct

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)
- [Movement Network Documentation](https://docs.movementnetwork.xyz/)
- [Shinami Documentation](https://docs.shinami.com/) - Check for latest API details

## Deploy on Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_PRIVY_APP_ID`
   - `SHINAMI_API_KEY`
   - `SHINAMI_API_URL` (optional)
4. Deploy!

**Note**: Ensure `SHINAMI_API_KEY` is added as an environment variable in Vercel (not in `.env.local` that gets committed).

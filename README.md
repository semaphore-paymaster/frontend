# Frontend for Semaphore + Paymaster Project

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Environment Variables

To configure the project, you'll need to set up the following environment variables in a `.env.local` file at the root of your project:

- `NEXT_PUBLIC_ZERODEV_APP_ID=xyz-abc-123`: The ZeroDev application ID used for configuring ZeroDev services.
- `NEXT_PUBLIC_POAP_CONTRACT=0x`: The address of the POAP contract.
- `NEXT_PUBLIC_PAYMASTER_CONTRACT=0x`: The address of the Paymaster contract.
- `NEXT_PUBLIC_GATEKEEPER_CONTRACT=0x`: The address of the Gatekeeper contract.
- `NEXT_PUBLIC_SEMAPHORE_CONTRACT=0x`: The address of the Semaphore contract.
- `NEXT_PUBLIC_SEMAPHORE_GROUP_ID=0`: The Semaphore group ID.
- `NEXT_PUBLIC_STORAGE_CONTRACT=0x`: The address of the storage contract.
- `NEXT_PUBLIC_MACI_FACTORY=0x`: The address of the MACI factory contract.
- `NEXT_PUBLIC_MACI_POLL=0x`: The address of the MACI poll contract.

## ZeroDev Configuration

The configuration for ZeroDev services, including bundler, paymaster, and passkey server URLs, is provided through the ZeroDev dashboard. To set up these configurations, please refer to the [ZeroDev documentation](https://docs.zerodev.app/).

## Learn More

To learn more about Next.js and the technologies used in this project, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

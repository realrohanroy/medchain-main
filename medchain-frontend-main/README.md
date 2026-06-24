# MedChain 🧬🔗

**MedChain** is a decentralized, secure, and zero-trust digital sanctuary for medical records. Built on modern web technologies, it empowers patients with data sovereignty while providing medical practitioners with a secure platform to manage patient registries and verify records on-chain.

## Features ✨

- **Role-Based Access Control**: Tailored dashboards and features for Patients, Providers, and Researchers.
- **Decentralized Security**: Connect with Ethereum-compatible wallets (e.g., MetaMask) for blockchain-verified authentication and secure access.
- **Zero-Trust Environment**: Your private keys are never stored. Wallets are strictly used to sign transactions and verify ownership of health data.
- **Clinical Etherealism Design**: A premium, highly responsive user interface with modern typography, subtle micro-animations, and a calming clinical color palette.

## Technology Stack 🛠️

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started 🚀

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

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

## Project Structure 📁

- `src/app/`: Next.js App Router pages and layouts.
- `src/components/`: Reusable React components.
  - `auth/`: Components related to the registration, role selection, and wallet connection flows.
- `src/app/(dashboard)/`: Protected dashboard routes for different user roles.


## License 📄

© 2024 MedChain Health Systems. All rights reserved.
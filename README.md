# FakeGuard

FakeGuard is a React/Vite and Express/MongoDB application with:

- Email/password registration and login
- Google Sign-In
- Facebook Login
- JWT-based application sessions
- Community alert and supply-chain features

## Repository safety

This GitHub-ready package intentionally excludes:

- `.env` files
- MongoDB credentials
- JWT secrets
- Facebook App Secret
- provider tokens
- `node_modules`
- build output
- local Git history
- local HTTPS certificate files

Only `.env.example` templates are included. Create local `.env` files before running the project.

## Setup

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and add your own credentials, then run:

```bash
npm run dev
```

The backend runs at `http://localhost:5001`.

### Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and add your own Google Client ID and Facebook App ID, then run:

```bash
npm run dev
```

The frontend runs at `https://localhost:5000`. Because development HTTPS uses a self-signed certificate, the browser may show a local certificate warning.

See [SOCIAL_LOGIN_SETUP.md](./SOCIAL_LOGIN_SETUP.md) for provider configuration.

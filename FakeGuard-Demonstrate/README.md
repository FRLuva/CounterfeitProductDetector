# FakeGuard-Demonstrate

FakeGuard-Demonstrate is a full-stack product-verification demonstration project. It includes email/password authentication, Google login, Facebook login, community alerts, geo-location based verification, and supply-chain traceability features.


## Main features

- Clickable home-page feature cards
- Community fake-product alert submission with optional GPS capture
- Geo-location product verification against the latest GPS-enabled supply-chain event
- Public barcode and batch-number chain tracing
- Protected chain-record and chain-event management
- Email/password, Google, and Facebook authentication

## Project structure

- `frontend/` — React and Vite client
- `backend/` — Express and MongoDB API
- `SOCIAL_LOGIN_SETUP.md` — Google and Facebook configuration guide

## Local setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Add your own MongoDB URI, JWT secret, Google Client ID, Facebook App ID, and Facebook App Secret to `backend/.env`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Add your own Google Client ID and Facebook App ID to `frontend/.env`. The development site runs at `https://localhost:5000`.

## Security

Real `.env` files, access tokens, database credentials, JWT secrets, private keys, `node_modules`, build output, and Git history are not included in the GitHub-ready archive. Never commit secrets.

See [SOCIAL_LOGIN_SETUP.md](./SOCIAL_LOGIN_SETUP.md) for provider-specific configuration.

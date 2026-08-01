# FakeGuard Social Login Setup

This project keeps email/password authentication and adds Google and Facebook login. Provider credentials are verified by the backend before FakeGuard issues its own JWT.

## 1. Create local environment files

Do not put real credentials in GitHub.

### Backend

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5001
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=https://localhost:5000

GOOGLE_CLIENT_ID=your_google_web_client_id

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_GRAPH_VERSION=v26.0
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=/api

VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_GRAPH_VERSION=v26.0
```

The Google Client ID must match in both files. The Facebook App ID must match in both files. Never place the Facebook App Secret in the frontend.

## 2. Google configuration

In Google Auth Platform:

1. Create a Web application OAuth client.
2. Configure the consent screen and test users.
3. Add these Authorized JavaScript origins for local development:

```text
https://localhost
https://localhost:5000
```

4. Put the generated Web Client ID in both local `.env` files.

## 3. Facebook configuration

In Meta for Developers:

1. Create an app with the Facebook Login use case.
2. Enable `email` and `public_profile` for testing.
3. Enable Login with the JavaScript SDK.
4. Add `localhost` under Allowed Domains for the JavaScript SDK.
5. Put the App ID in both local `.env` files.
6. Put the App Secret only in `backend/.env`.

The frontend uses HTTPS because the Facebook JavaScript SDK does not permit `FB.login()` from ordinary HTTP pages.

## 4. Install and run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
https://localhost:5000
```

A browser warning is expected for the self-signed local certificate. Proceed only for your own localhost development server.

## 5. API routes

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/facebook
```

## 6. Production deployment

For public users:

- Deploy both frontend and backend
- Use real HTTPS domains
- Add the production frontend origin in Google Auth Platform
- Add the production domain in Meta for Developers
- Configure privacy-policy and data-deletion URLs
- Complete any Meta review or verification required for public access
- Store production secrets in the hosting provider's environment-variable settings

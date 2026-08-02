# FakeGuard-Demonstrate Social Login Setup

This version keeps the existing email/password login and adds:

- Continue with Google
- Continue with Facebook
- Backend verification of provider credentials
- Existing FakeGuard-Demonstrate JWT generation after successful social authentication
- Automatic account creation and email-based account linking

Google Identity Services and the Facebook JavaScript SDK are loaded from their official browser SDK URLs. The frontend also uses `@vitejs/plugin-basic-ssl` to provide HTTPS during local development.

## 1. Security first

Keep all real credentials in local `.env` files only.

1. Use a private MongoDB Atlas connection string.
2. Generate a long random `JWT_SECRET`.
3. Never commit `.env` to GitHub.
4. Keep only `.env.example` in the repository.

## 2. Backend environment

Inside `backend`, copy `.env.example` to `.env` and fill in the real values:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://localhost:5000

GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_GRAPH_VERSION=v26.0
```

The Google client ID in the backend must be the same Web Client ID used by the frontend.

## 3. Frontend environment

Inside `frontend`, copy `.env.example` to `.env`:

```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_GRAPH_VERSION=v26.0
```

Never place the Facebook App Secret in the frontend.

## 4. Google configuration

In Google Cloud Console:

1. Create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID with application type **Web application**.
4. Add this Authorized JavaScript origin for local development:

```text
https://localhost:5000
```

5. Add your production website origin later, for example:

```text
https://your-domain.com
```

6. Put the generated Web Client ID in both frontend and backend environment files.

This integration uses the Google Identity Services button. The frontend receives a Google ID token, and the backend validates its signature and claims before issuing the FakeGuard-Demonstrate JWT.

## 5. Facebook configuration

In Meta for Developers:

1. Create an app and add Facebook Login for the web.
2. Add the Website platform and set the local Site URL:

```text
https://localhost:5000/
```

3. Enable Client OAuth Login and Web OAuth Login.
4. Add your production domain and HTTPS URL before deployment.
5. Copy the App ID to frontend and backend `.env` files.
6. Copy the App Secret only to the backend `.env` file.
7. While the app is in Development Mode, only app developers, testers, and configured test users can log in.

The integration requests only `public_profile` and `email`. If Facebook does not return an email, FakeGuard-Demonstrate creates a stable provider-specific internal email so the account can still be stored.

## 6. Install and run

Open two terminals.

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
https://localhost:5000
```

## 7. Added API routes

```text
POST /api/auth/google
POST /api/auth/facebook
```

Google request body:

```json
{
  "credential": "google_id_token"
}
```

Facebook request body:

```json
{
  "accessToken": "facebook_user_access_token"
}
```

Both routes return the same response format as the existing login route:

```json
{
  "success": true,
  "message": "Google login successful",
  "token": "fakeguard_demonstrate_jwt",
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "role": "user",
    "avatar": "...",
    "providers": ["google"]
  }
}
```

## 8. Main modified files

```text
backend/src/controllers/authController.js
backend/src/routes/authRoutes.js
backend/src/models/User.js
backend/src/middleware/errorMiddleware.js
backend/.env.example
frontend/src/App.jsx
frontend/src/App.css
frontend/src/main.jsx
frontend/src/components/ProtectedPage.jsx
frontend/.env.example
```

## 9. Validation status

- Frontend ESLint: passed
- Backend JavaScript syntax checks: passed
- Full Vite build could not be executed in the Linux validation environment because the uploaded `node_modules` was created for Windows and did not include Vite/Rolldown's Linux native optional binary. Running `npm install` on the user's own computer will install the correct platform-specific package.

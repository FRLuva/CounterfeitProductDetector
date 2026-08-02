import { validationResult } from "express-validator";
import { createPublicKey, verify as verifySignature } from "node:crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";



let googleJwksCache = {
  keys: [],
  expiresAt: 0
};

const decodeJwtPart = (value) => {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
};

const getGoogleJwks = async () => {
  if (googleJwksCache.keys.length && googleJwksCache.expiresAt > Date.now()) {
    return googleJwksCache.keys;
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");

  if (!response.ok) {
    throw new Error("Unable to load Google signing keys");
  }

  const result = await response.json();
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = Number(maxAgeMatch?.[1] || 3600);

  googleJwksCache = {
    keys: result.keys || [],
    expiresAt: Date.now() + maxAgeSeconds * 1000
  };

  return googleJwksCache.keys;
};

const verifyGoogleCredential = async (credential) => {
  const tokenParts = credential.split(".");

  if (tokenParts.length !== 3) {
    throw new Error("Malformed Google credential");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = tokenParts;
  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Google credential");
  }

  const jwks = await getGoogleJwks();
  const signingKey = jwks.find((key) => key.kid === header.kid);

  if (!signingKey) {
    googleJwksCache.expiresAt = 0;
    const refreshedKeys = await getGoogleJwks();
    const refreshedSigningKey = refreshedKeys.find((key) => key.kid === header.kid);

    if (!refreshedSigningKey) {
      throw new Error("Google signing key was not found");
    }

    const publicKey = createPublicKey({ key: refreshedSigningKey, format: "jwk" });
    const validSignature = verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url")
    );

    if (!validSignature) {
      throw new Error("Invalid Google credential signature");
    }
  } else {
    const publicKey = createPublicKey({ key: signingKey, format: "jwk" });
    const validSignature = verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url")
    );

    if (!validSignature) {
      throw new Error("Invalid Google credential signature");
    }
  }

  const validIssuer = ["accounts.google.com", "https://accounts.google.com"].includes(
    payload?.iss
  );
  const notExpired = Number(payload?.exp || 0) > Math.floor(Date.now() / 1000);

  if (
    !payload?.sub ||
    !payload?.email ||
    payload.email_verified !== true ||
    payload.aud !== process.env.GOOGLE_CLIENT_ID ||
    !validIssuer ||
    !notExpired
  ) {
    throw new Error("Google credential claims are invalid");
  }

  return payload;
};

const userResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
  providers: user.providers || []
});

const sendAuthResponse = (res, user, message, statusCode = 200) => {
  const token = generateToken(user._id);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userResponse(user)
  });
};

const safeFullName = (name, email) => {
  const candidate = String(name || email?.split("@")[0] || "FakeGuard-Demonstrate User")
    .trim()
    .slice(0, 50);

  return candidate.length >= 3 ? candidate : `${candidate} User`.slice(0, 50);
};

const findOrCreateSocialUser = async ({
  provider,
  providerId,
  fullName,
  email,
  avatar = ""
}) => {
  const providerField = provider === "google" ? "googleId" : "facebookId";
  const normalizedEmail = email?.trim().toLowerCase();

  let user = await User.findOne({ [providerField]: providerId }).select(
    "+googleId +facebookId"
  );

  if (!user && normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail }).select(
      "+googleId +facebookId"
    );
  }

  if (!user) {
    user = await User.create({
      fullName: safeFullName(fullName, normalizedEmail),
      email:
        normalizedEmail ||
        `${provider}-${providerId}@users.fakeguard-demonstrate.local`,
      [providerField]: providerId,
      providers: [provider],
      avatar
    });
  } else {
    if (!user.isActive) {
      const error = new Error("Your account has been disabled");
      error.statusCode = 403;
      throw error;
    }

    user[providerField] = providerId;
    user.fullName = user.fullName || safeFullName(fullName, normalizedEmail);
    user.avatar = avatar || user.avatar;
    user.providers = Array.from(new Set([...(user.providers || []), provider]));
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  }

  if (!user.lastLogin) {
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  }

  return user;
};

export const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      providers: ["local"]
    });

    return sendAuthResponse(
      res,
      user,
      "Account created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled"
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      const socialOnly = !user.password && user.providers?.length;

      return res.status(401).json({
        success: false,
        message: socialOnly
          ? `This account uses ${user.providers.join(" or ")} login.`
          : "Invalid email or password"
      });
    }

    user.lastLogin = new Date();
    user.providers = Array.from(new Set([...(user.providers || []), "local"]));
    await user.save({ validateBeforeSave: false });

    return sendAuthResponse(res, user, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: "Google login is not configured on the server"
      });
    }

    let payload;

    try {
      payload = await verifyGoogleCredential(credential);
    } catch (verificationError) {
      if (verificationError.message === "Unable to load Google signing keys") {
        return res.status(503).json({
          success: false,
          message: "Google verification service is temporarily unavailable"
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google credential"
      });
    }

    const user = await findOrCreateSocialUser({
      provider: "google",
      providerId: payload.sub,
      fullName: payload.name,
      email: payload.email,
      avatar: payload.picture
    });

    return sendAuthResponse(res, user, "Google login successful");
  } catch (error) {
    next(error);
  }
};

export const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Facebook access token is required"
      });
    }

    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;
    const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v26.0";

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Facebook login is not configured on the server"
      });
    }

    const debugUrl = new URL(
      `https://graph.facebook.com/${graphVersion}/debug_token`
    );
    debugUrl.searchParams.set("input_token", accessToken);
    debugUrl.searchParams.set(
      "access_token",
      `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
    );

    const debugResponse = await fetch(debugUrl);
    const debugResult = await debugResponse.json();
    const tokenData = debugResult?.data;

    if (
      !debugResponse.ok ||
      !tokenData?.is_valid ||
      String(tokenData.app_id) !== String(FACEBOOK_APP_ID)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Facebook access token"
      });
    }

    const profileUrl = new URL(
      `https://graph.facebook.com/${graphVersion}/me`
    );
    profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    profileUrl.searchParams.set("access_token", accessToken);

    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile?.id) {
      return res.status(401).json({
        success: false,
        message: "Facebook profile could not be verified"
      });
    }

    const user = await findOrCreateSocialUser({
      provider: "facebook",
      providerId: profile.id,
      fullName: profile.name,
      email: profile.email,
      avatar: profile.picture?.data?.url
    });

    return sendAuthResponse(res, user, "Facebook login successful");
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      ...userResponse(req.user),
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    }
  });
};

import { useCallback, useEffect, useRef, useState } from "react";
import api from "./api/client";
import "./App.css";

const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

const facebookGraphVersion =
  import.meta.env.VITE_FACEBOOK_GRAPH_VERSION || "v26.0";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const getErrorMessage = (error) => {
  const validationMessage =
    error.response?.data?.errors?.[0]?.msg ||
    error.response?.data?.errors?.[0]?.message;

  return (
    validationMessage ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
};

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  const [facebookReady, setFacebookReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const googleButtonRef = useRef(null);

  const resetMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  const saveAuthentication = useCallback(
    (response, successMessage) => {
      const responseData = response?.data || {};

      const token =
        responseData.token ||
        responseData.accessToken ||
        responseData.data?.token ||
        responseData.user?.token;

      const loggedInUser =
        responseData.user ||
        responseData.data?.user ||
        responseData.data ||
        responseData;

      if (!token) {
        throw new Error(
          "Authentication token was not returned by the server."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      setMessageType("success");
      setMessage(successMessage);
    },
    []
  );

  /*
   * Google Login
   */
  const handleGoogleSuccess = useCallback(
    (credentialResponse) => {
      const completeGoogleLogin = async () => {
        resetMessage();
        setSocialLoading("google");

        try {
          const credential = credentialResponse?.credential;

          if (!credential) {
            throw new Error("Google credential was not returned.");
          }

          const response = await api.post("/auth/google", {
            credential,
            idToken: credential
          });

          saveAuthentication(
            response,
            "Google login successful."
          );
        } catch (error) {
          setMessageType("error");
          setMessage(getErrorMessage(error));
        } finally {
          setSocialLoading("");
        }
      };

      void completeGoogleLogin();
    },
    [resetMessage, saveAuthentication]
  );

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let cancelled = false;

    const initializeGoogle = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSuccess
      });

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 250
        }
      );

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();

      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(
      "google-identity-services"
    );

    if (!script) {
      script = document.createElement("script");

      script.id = "google-identity-services";
      script.src =
        "https://accounts.google.com/gsi/client";

      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }

    script.addEventListener("load", initializeGoogle, {
      once: true
    });

    const handleGoogleScriptError = () => {
      if (!cancelled) {
        setMessageType("error");
        setMessage(
          "Google Identity Services could not be loaded."
        );
      }
    };

    script.addEventListener(
      "error",
      handleGoogleScriptError,
      {
        once: true
      }
    );

    return () => {
      cancelled = true;

      script.removeEventListener(
        "load",
        initializeGoogle
      );

      script.removeEventListener(
        "error",
        handleGoogleScriptError
      );
    };
  }, [handleGoogleSuccess]);

  /*
   * Facebook SDK
   */
  useEffect(() => {
    if (!facebookAppId) {
      return undefined;
    }

    let cancelled = false;

    const initializeFacebook = () => {
      if (cancelled || !window.FB) {
        return;
      }

      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: facebookGraphVersion
      });

      setFacebookReady(true);
    };

    window.fbAsyncInit = initializeFacebook;

    if (window.FB) {
      initializeFacebook();

      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(
      "facebook-jssdk"
    );

    if (!script) {
      script = document.createElement("script");

      script.id = "facebook-jssdk";
      script.src =
        "https://connect.facebook.net/en_US/sdk.js";

      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";

      document.body.appendChild(script);
    }

    const handleFacebookScriptError = () => {
      if (!cancelled) {
        setMessageType("error");
        setMessage(
          "Facebook SDK could not be loaded."
        );
      }
    };

    script.addEventListener(
      "error",
      handleFacebookScriptError,
      {
        once: true
      }
    );

    return () => {
      cancelled = true;

      script.removeEventListener(
        "error",
        handleFacebookScriptError
      );
    };
  }, []);

  /*
   * Email Login/Register
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    resetMessage();
    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/auth/login"
        : "/auth/register";

      const payload = isLogin
        ? {
            email: email.trim(),
            password
          }
        : {
            fullName: fullName.trim(),
            email: email.trim(),
            password
          };

      const response = await api.post(
        endpoint,
        payload
      );

      saveAuthentication(
        response,
        isLogin
          ? "Login successful. Welcome back!"
          : "Registration successful. Your account has been created."
      );

      setFullName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  /*
   * Facebook Login
   *
   * Facebook requires a normal synchronous callback.
   * Async work is performed inside completeFacebookLogin().
   */
  const handleFacebookLogin = () => {
    resetMessage();

    if (!facebookAppId) {
      setMessageType("error");
      setMessage(
        "Facebook App ID is missing from the frontend .env file."
      );
      return;
    }

    if (!facebookReady || !window.FB) {
      setMessageType("error");
      setMessage(
        "Facebook login is still loading. Please try again."
      );
      return;
    }

    setSocialLoading("facebook");

    window.FB.login(
      (facebookResponse) => {
        const completeFacebookLogin = async () => {
          try {
            const accessToken =
              facebookResponse?.authResponse?.accessToken;

            if (!accessToken) {
              throw new Error(
                "Facebook login was cancelled or not authorized."
              );
            }

            const response = await api.post(
              "/auth/facebook",
              {
                accessToken
              }
            );

            saveAuthentication(
              response,
              "Facebook login successful."
            );
          } catch (error) {
            setMessageType("error");
            setMessage(getErrorMessage(error));
          } finally {
            setSocialLoading("");
          }
        };

        void completeFacebookLogin();
      },
      {
        scope: "public_profile,email"
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setMessageType("success");
    setMessage("Logged out successfully.");
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="brand-box">
          <div className="logo-circle">
            FP
          </div>

          <h1>Fake Product Detection</h1>

          <p>
            Verify product authenticity, report suspicious
            products, and track supply chain history from one
            secure platform.
          </p>
        </div>

        <div className="feature-list">
          <div>
            <span>✓</span>
            Community fake product alerts
          </div>

          <div>
            <span>✓</span>
            Geo-location based verification
          </div>

          <div>
            <span>✓</span>
            Supply chain traceability
          </div>
        </div>
      </section>

      <main className="auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              resetMessage();
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              resetMessage();
            }}
          >
            Register
          </button>
        </div>

        <h2>
          {isLogin
            ? "Welcome Back"
            : "Create Account"}
        </h2>

        <p className="auth-subtitle">
          {isLogin
            ? "Login with email, Google, or Facebook."
            : "Create an account with your details or use a social account."}
        </p>

        {!user && (
          <>
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Example: User123"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  required
                />
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Login"
                    : "Register"}
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social-buttons">
              <div className="google-login-slot">
                {googleClientId ? (
                  <div
                    ref={googleButtonRef}
                    aria-label="Continue with Google"
                  />
                ) : (
                  <button
                    className="social-fallback"
                    type="button"
                    onClick={() => {
                      setMessageType("error");
                      setMessage(
                        "Google Client ID is missing from the frontend .env file."
                      );
                    }}
                  >
                    Continue with Google
                  </button>
                )}
              </div>

              <button
                className="facebook-btn"
                type="button"
                onClick={handleFacebookLogin}
                disabled={
                  socialLoading === "facebook"
                }
              >
                <span className="facebook-icon">
                  f
                </span>

                {socialLoading === "facebook"
                  ? "Connecting..."
                  : "Continue with Facebook"}
              </button>
            </div>

            {googleClientId && !googleReady && (
              <p className="social-status">
                Loading Google login...
              </p>
            )}

            {socialLoading === "google" && (
              <p className="social-status">
                Completing Google login...
              </p>
            )}
          </>
        )}

        {message && (
          <p className={`message ${messageType}`}>
            {message}
          </p>
        )}

        {user && (
          <div className="user-box">
            <div className="user-summary">
              {(user.avatar ||
                user.picture ||
                user.photoURL) && (
                <img
                  src={
                    user.avatar ||
                    user.picture ||
                    user.photoURL
                  }
                  alt={
                    user.fullName ||
                    user.name ||
                    "User"
                  }
                />
              )}

              <div>
                <p>Logged in user:</p>

                <strong>
                  {user.fullName ||
                    user.name ||
                    user.email}
                </strong>

                {user.email && (
                  <small>{user.email}</small>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
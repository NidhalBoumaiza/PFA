import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3,
  LogIn,
  Loader2,
  Shield,
  UserCheck,
  AlertCircle,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiUrl } from "../../services/api";

// Error Modal Component
const ErrorModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Login Error
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-5">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [credentialError, setCredentialError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleLoginAttempt = async () => {
    // Always clear previous errors
    setError("");
    setConnectionError(false);
    setCredentialError("");

    console.log("Attempting login with:", formData.email);

    if (!formData.email.trim() || !formData.password.trim()) {
      setCredentialError("Please enter both email and password");
      setShowErrorModal(true);
      return;
    }

    try {
      const success = await login(formData.email, formData.password);

      console.log("Login result:", success);

      if (success) {
        navigate("/dashboard");
      } else {
        // If login returns false but no error was thrown
        setCredentialError(
          "Invalid credentials or insufficient permissions"
        );
        setShowErrorModal(true);
      }
    } catch (err: any) {
      console.error("Login error caught in component:", err);

      // Check for network/connection errors
      if (!err.response) {
        console.log("Connection error detected");
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check if the server is running."
        );
        return;
      }

      // Handle specific HTTP status codes
      if (err.response?.status === 403) {
        console.log("Permission error (403)");
        setError(
          "Access denied. Only admins and team leaders can log in."
        );
        setShowErrorModal(true);
      } else if (err.response?.status === 401) {
        console.log(
          "Authentication error (401) - Invalid credentials"
        );
        setCredentialError("Invalid email or password");
        setShowErrorModal(true);
      } else {
        console.log("Other API error:", err.response?.status);
        setError(
          err.response?.data?.message ||
            "An error occurred during login. Please try again."
        );
        setShowErrorModal(true);
      }
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Call the login function
    handleLoginAttempt();

    // Prevent form submission
    return false;
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <BarChart3 className="h-10 w-10 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              TeamFlow
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your credentials to continue
          </p>
        </div>

        {connectionError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-400 dark:border-red-800 flex items-center gap-3">
            <Wifi className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-sm mt-1">API Server: {apiUrl}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-200 dark:bg-red-800 px-3 py-1 rounded text-sm hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {!connectionError && error && !showErrorModal && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-400 dark:border-red-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted, preventing default");
            handleLoginAttempt();
            return false;
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`appearance-none block w-full px-3 py-2 border ${
                  credentialError && !showErrorModal
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                className={`appearance-none block w-full px-3 py-2 border ${
                  credentialError && !showErrorModal
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                placeholder="Enter your password"
              />
              {credentialError && !showErrorModal && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{credentialError}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                console.log("Login button clicked");
                handleLoginAttempt();
              }}
              disabled={loading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing In
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Forgot your password?{" "}
            <Link
              to="/forgot-password"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Reset Password
            </Link>
          </p>
        </div>

        {/* Error Modal */}
        {showErrorModal && (
          <ErrorModal
            message={
              credentialError ||
              error ||
              "An error occurred during login"
            }
            onClose={closeErrorModal}
          />
        )}
      </div>
    </div>
  );
};

export default SignIn;

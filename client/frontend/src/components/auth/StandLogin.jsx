import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword,sendEmailVerification } from "firebase/auth";
import { auth } from "../../config/firebase";

const StandLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
        const [unverifiedUser, setUnverifiedUser] = useState(null);
    const [resendLoading, setResendLoading] = useState(false);



    const { login } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Check if email is verified
            if (!userCredential.user.emailVerified) {
                                setUnverifiedUser(userCredential.user);

                setError("Please verify your email before logging in. Check your spam folder for the verification email.");
                setLoading(false);
                return;
            }

         

            const firebaseToken = await userCredential.user.getIdToken();

            // 2. Verify with backend & check domain permissions
            const response = await fetch(`${API_URL}/firebaseAuth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: firebaseToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Login failed.");
                return;
            }

            // 3. Update app auth context
            login({
                ...data.user,
                token: data.token,
            });

            navigate("/dashboard");
        } catch (err) {
            switch (err.code) {
                case "auth/user-not-found":
                    setError("No account found with this email.");
                    break;
                case "auth/wrong-password":
                    setError("Incorrect password.");
                    break;
                case "auth/invalid-credential":
                    setError("Invalid email or password.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many attempts. Please try again later.");
                    break;
                default:
                    setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


    const handleResendVerification = async () => {
        if (!unverifiedUser) return;
        
        setResendLoading(true);
        try {
            await sendEmailVerification(unverifiedUser);
            setError("Verification email sent! Check your inbox.");
            setUnverifiedUser(null); // Clear unverified user after sending
        } catch (err) {
            setError("Failed to resend verification email.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
                <div className="p-3 text-center bg-red-100 text-red-700 border border-red-400 rounded">
                    {error}
                    {unverifiedUser && (
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                            className="text-center justify-around mt-2 text-blue-600 hover:underline disabled:opacity-50"
                        >
                            {resendLoading ? "Sending..." : "Resend verification email"}
                        </button>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <span
                    onClick={() => navigate("/register")}
                    className="text-blue-600 hover:underline cursor-pointer font-medium"
                >
                    Register
                </span>
            </p>
        </form>
    );
};

export default StandLogin;
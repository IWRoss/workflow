import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword,sendEmailVerification } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../config/firebase";

const StandRegister = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
const [verificationSent, setVerificationSent] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // 2. Send email verification ✅
            await sendEmailVerification(user);

            // 3. Save user data to Firebase Realtime Database
            await set(ref(database, `users/${user.uid}`), {
                email: user.email,
                uid: user.uid,
                createdAt: new Date().toISOString(),
                role: "user",
            });

            
            setVerificationSent(true);

        } catch (err) {
            console.error("Register error:", err);
            switch (err.code) {
                case "auth/email-already-in-use":
                    setError("This email is already registered.");
                    break;
                case "auth/invalid-email":
                    setError("Invalid email address.");
                    break;
                case "auth/weak-password":
                    setError("Password is too weak.");
                    break;
                default:
                    setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };



    if (verificationSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Check your email</h2>
                    <p className="text-gray-600 mb-6">
                        We've sent a verification link to <span className="font-semibold text-blue-600">{email}</span>.
                        Please verify your email before logging in.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        Go to Login
                    </button>
                    <p className="mt-4 text-sm text-gray-400">
                        Didn't receive it? Check your spam folder.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Create an Account
                </h2>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 text-center bg-red-100 text-red-700 border border-red-400 rounded">
                            {error}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default StandRegister;
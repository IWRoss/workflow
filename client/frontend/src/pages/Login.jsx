import { useAuth } from "../hooks/useAuth";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { Navigate } from "react-router-dom";

const Login = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Cegos</h2>
                <GoogleLoginButton />
            </div>
        </div>
    );
}

export default Login;
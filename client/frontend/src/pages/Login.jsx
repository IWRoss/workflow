import { useAuth } from "../hooks/useAuth";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { Navigate } from "react-router-dom";
import MicrosoftLoginButton from "../components/auth/MicrosoftLoginButton";
import StandLogin from "../components/auth/StandLogin";

const Login = ({ msalError, clearMsalError }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Welcome to Cegos
                </h2>
                <div className="mb-6">
                    <p className="text-gray-600 mb-4 text-center">
                        Please log in with your Google or Microsoft account to
                        continue.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <GoogleLoginButton />
                    <MicrosoftLoginButton
                        errorMessage={msalError}
                        onClearError={clearMsalError}
                    />
                </div>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-sm text-gray-500">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <StandLogin />
            </div>
        </div>
    );
};

export default Login;

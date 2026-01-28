import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL;

    const handleGoogleLoginSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(`${API_URL}/googleAuth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: credentialResponse.credential,
                }),
            });
            const data = await response.json();

            if (data.success) {
                const userData = {
                    ...data.user,
                    token: data.token,
                };

                login(userData);
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Google Login Error:", error);
        }
    };

    const handleGoogleLoginError = () => {
        console.error("Google Login Failed");
    };

    return (
        <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            theme="outline"
            size="large"
        />
    );
};

export default GoogleLoginButton;

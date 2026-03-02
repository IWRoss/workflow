import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../config/firebase";

const EmailActionHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("verifying");

    useEffect(() => {
        const handleAction = async () => {
            const mode = searchParams.get("mode");
            const actionCode = searchParams.get("oobCode");

            if (!actionCode) {
                setStatus("error");
                return;
            }

            // Handle email verification
            if (mode === "verifyEmail") {
                try {
                    await applyActionCode(auth, actionCode);
                    setStatus("success");
                    setTimeout(() => navigate("/login"), 2000);
                } catch (error) {
                    console.error("Verification error:", error);
                    setStatus("error");
                }
            } else {
                navigate("/login");
            }
        };

        handleAction();
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                {status === "verifying" && (
                    <p className="text-gray-600">Verifying your email...</p>
                )}
                {status === "success" && (
                    <>
                        <p className="text-green-600 font-semibold">✓ Email verified!</p>
                        <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
                    </>
                )}
                {status === "error" && (
                    <p className="text-red-600">✗ Verification failed. Please try again.</p>
                )}
            </div>
        </div>
    );
};

export default EmailActionHandler;
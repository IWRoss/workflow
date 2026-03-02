import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useNavigate } from "react-router-dom"; 
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {
    msalInstance,
    msalReady,
    loginRequest,
} from "./components/microsoftAuthConfig/msalConfig";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SequoiaDashboard from "./pages/SequoiaDashboard";
import RevenueCalendar from "./pages/RevenueCalendar";
import StandRegister from "./pages/StandRegister";
import OpsDashboard from "./pages/OpsDashboard";
import SOWPage from "./pages/SOWPage";

function App() {
    const [msalHandled, setMsalHandled] = useState(false);
    const [msalError, setMsalError] = useState(null);

    const { login } = useAuth(); 
    const navigate = useNavigate(); 
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const handleRedirect = async () => {
            await msalReady;
            try {
                const response = await msalInstance.handleRedirectPromise();
                if (response) {
                    // Set the active account for future token requests
                    msalInstance.setActiveAccount(response.account);

                    // Now we need to acquire a token to call our backend
                    const tokenRes = await msalInstance.acquireTokenSilent({
                        ...loginRequest,
                        account: response.account,
                    });

                    const graphAccessToken = tokenRes.accessToken;

                    const res = await fetch(
                        `${API_URL}/microsoftAuth/microsoft-login`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: graphAccessToken }),
                        },
                    );

                    const data = await res.json();

                    if (data.success) {
                        login({ ...data.user, token: data.token });
                        navigate("/dashboard");
                    } else {
                        console.error("Microsoft login failed:", data.error);
                        setMsalError(data.error || "Microsoft login failed.");
                        navigate("/login");
                    }
                }
            } catch (err) {
                console.warn("MSAL redirect handling failed:", err);
                msalInstance.clearCache();
                setMsalError("Microsoft login failed. Please try again.");
                navigate("/login");
            }
            setMsalHandled(true);
        };
        handleRedirect();
    }, []);

    if (!msalHandled) return null;

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <Login
                        msalError={msalError}
                        clearMsalError={() => setMsalError(null)}
                    />
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/sequoia-dashboard"
                element={
                    <ProtectedRoute requiredPermission="sequoia-dashboard">
                        <SequoiaDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/revenue-calendar"
                element={
                    <ProtectedRoute requiredPermission="revenue-calendar">
                        <RevenueCalendar />
                    </ProtectedRoute>
                }
            />


            <Route
                path="/ops-dashboard"
                element={
                    <ProtectedRoute requiredPermission="ops-dashboard">
                        <OpsDashboard />
                    </ProtectedRoute>
                }
            />

             <Route
                path="/ops-dashboard/sow/:id"
                element={
                    <ProtectedRoute requiredPermission="ops-dashboard">
                        <SOWPage />
                    </ProtectedRoute>
                }
            />

            <Route path="/register" element={<StandRegister />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
            <Route path="/auth/action" element={<EmailActionHandler />} />
        </Routes>
    );
}

export default App;

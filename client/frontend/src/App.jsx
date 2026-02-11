import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { msalInstance, msalReady } from "./components/microsoftAuthConfig/msalConfig";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SequoiaDashboard from "./pages/SequoiaDashboard";
import RevenueCalendar from "./pages/RevenueCalendar";

function App() {
    const [msalHandled, setMsalHandled] = useState(false);

    // This effect runs once on app load to handle the Microsoft login redirect response
    useEffect(() => {
        const handleRedirect = async () => {
            await msalReady;
            const response = await msalInstance.handleRedirectPromise();
            if (response) {
                sessionStorage.setItem(
                    "msalResponse",
                    JSON.stringify({
                        accessToken: response.accessToken,
                        account: response.account,
                    })
                );
            }
            setMsalHandled(true);
        };
        handleRedirect();
    }, []);

    if (!msalHandled) return null;

    return (
        <Routes>
            <Route path="/login" element={<Login />} />

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

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";  
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SequoiaDashboard from "./pages/SequoiaDashboard";
import RevenueCalendar from "./pages/RevenueCalendar";


function App() {
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

            <Route path="*" element={<Navigate to="/login" replace />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
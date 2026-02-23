import { createContext, useState, useEffect } from "react";
import {
    msalInstance,
    msalReady,
} from "../components/microsoftAuthConfig/msalConfig";

import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const verifyToken = async () => {
            const storedUser = localStorage.getItem("user");

            if (!storedUser) {
                setLoading(false);
                return;
            }

            try {
                const userData = JSON.parse(storedUser);

                // Verify token with backend
                const response = await fetch(
                    `${API_URL}/googleAuth/verify-token`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ token: userData.token }),
                    },
                );

                const data = await response.json();

                //console.log('Token verification response:', data);

                if (data.success && data.valid) {
                    const updatedUserData = {
                        ...userData,
                        ...data.user,
                    };

                    setUser(updatedUserData);
                    localStorage.setItem(
                        "user",
                        JSON.stringify(updatedUserData),
                    );
                } else {
                    localStorage.removeItem("user");
                    setUser(null);
                }
            } catch (error) {
                console.error("Token verification failed:", error);
                localStorage.removeItem("user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem("user");

        // Sign out from Firebase
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Firebase sign out error:", err);
        }

        await msalReady;

        // Remove all accounts individually
        const accounts = msalInstance.getAllAccounts();
        accounts.forEach((account) => {
            msalInstance.setActiveAccount(null);
        });

        msalInstance.clearCache();

        // Also clear any MSAL entries from sessionStorage
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("msal.")) sessionStorage.removeItem(key);
        });
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

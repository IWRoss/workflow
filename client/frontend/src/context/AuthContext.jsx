import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const verifyToken = async () => {
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        
        // Verify token with backend
        const response = await fetch(`${API_URL}/googleAuth/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: userData.token }),
        });

        const data = await response.json();

        console.log('Token verification response:', data);

        if (data.success && data.valid) {
          setUser(userData);  
        } else {
          localStorage.removeItem('user');  
          setUser(null);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
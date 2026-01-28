import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google' 
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'

export default function Providers({ children }) {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    return (
        <BrowserRouter>
            <GoogleOAuthProvider clientId={CLIENT_ID}>
                <AuthProvider>
                    <div className="h-screen flex flex-col">
                        <Navbar />
                        <main className="flex-1 min-h-0">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    )
}
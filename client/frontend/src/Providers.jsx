import { BrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'

export default function Providers({ children }) {
    return (
        <BrowserRouter>
            <div className="h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 min-h-0">
                    {children}
                </main>
            </div>
        </BrowserRouter>
    )
}
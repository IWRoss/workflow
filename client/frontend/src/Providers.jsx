import { BrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'

export default function Providers({ children }) {
    return (
        <BrowserRouter>
            <Navbar />
            {children}
        </BrowserRouter>
    )
}
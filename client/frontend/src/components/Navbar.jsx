// client/src/components/Navbar/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import cegosLogo from "../assets/CegosLogo.jpg";

export default function Navbar({ session, signOut }) {
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const settingsRef = useRef(null);

    const toggleSettingsModal = () => setSettingsModalOpen(!settingsModalOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target)
            ) {
                setSettingsModalOpen(false);
            }
        };
        if (settingsModalOpen)
            document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsModalOpen]);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur ">
            <div className="w-full px-4 h-16 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="relative h-10 w-30 overflow-hidden rounded-full">
                            <img
                                src={cegosLogo}
                                alt="Cegos Logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="text-gray-900 font-bold tracking-tight">
                            WorkFlow
                        </span>
                    </Link>

                    <div className="hidden md:flex gap-6">
                        <Link
                            to="/"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Dashboard
                        </Link>
                        
                    </div>
                </div>

                {session && (
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={toggleSettingsModal}
                            className="flex items-center gap-3 focus:outline-none group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                                    {session.user.name}
                                </p>
                            </div>
                            <div
                                className={`relative h-9 w-9 rounded-full ring-2 ring-transparent transition-all ${
                                    settingsModalOpen
                                        ? "ring-blue-500"
                                        : "group-hover:ring-gray-200"
                                }`}
                            >
                                <img
                                    className="h-full w-full rounded-full object-cover"
                                    src={session.user.image}
                                    alt={session.user.name}
                                />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {settingsModalOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-lg shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">
                                        Signed in as
                                    </p>
                                    <p className="text-sm text-gray-900 truncate font-medium">
                                        {session.user.email ||
                                            session.user.name}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <button
                                        onClick={signOut}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

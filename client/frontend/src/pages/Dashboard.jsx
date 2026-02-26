import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import Sequoia_Logo from "../assets/sequoia_logo.png";

const Dashboard = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const dashboardCards = [
        {
            id: "revenue-calendar",
            title: "Revenue Recognition Calendar",
            route: "/revenue-calendar",
            permission: "revenue-calendar",
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-blue-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            ),
        },
        {
            id: "sequoia-dashboard",
            title: "Sequoia Dashboard",
            route: "/sequoia-dashboard",
            permission: "sequoia-dashboard",
            icon: (
                <img
                    src={Sequoia_Logo}
                    alt="Sequoia Logo"
                    className="h-12 w-auto mb-4"
                />
            ),
        },
        {
            id: "ops-dashboard",
            title: "Ops Dashboard",
            route: "/ops-dashboard",
            permission: "ops-dashboard",
            icon: (
                <svg
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M19.4 15L20.6 16.2C21.1 16.7 21.1 17.5 20.6 18L18 20.6C17.5 21.1 16.7 21.1 16.2 20.6L15 19.4"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M15 4.6L16.2 3.4C16.7 2.9 17.5 2.9 18 3.4L20.6 6C21.1 6.5 21.1 7.3 20.6 7.8L19.4 9"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 19.4L7.8 20.6C7.3 21.1 6.5 21.1 6 20.6L3.4 18C2.9 17.5 2.9 16.7 3.4 16.2L4.6 15"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4.6 9L3.4 7.8C2.9 7.3 2.9 6.5 3.4 6L6 3.4C6.5 2.9 7.3 2.9 7.8 3.4L9 4.6"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    <path
                        d="M12 2V4"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 20V22"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M2 12H4"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M20 12H22"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },
    ];

    const permittedCards = dashboardCards.filter((card) =>
        hasPermission(card.permission),
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>

                {/* Cards */}

                {permittedCards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {permittedCards.map((card) => (
                            <div
                                key={card.id}
                                id={card.id}
                                onClick={() => navigate(card.route)}
                                className="bg-gray-100 hover:bg-gray-50 hover:cursor-pointer rounded-lg shadow-md flex flex-col items-center justify-center p-6 transition-colors"
                            >
                                {card.icon}
                                <h2 className="text-lg font-semibold text-center">
                                    {card.title}
                                </h2>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            You don't have access to any dashboards yet.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Please contact your administrator for access.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

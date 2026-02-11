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

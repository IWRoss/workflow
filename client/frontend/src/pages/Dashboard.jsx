import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Card for Revenue Recognition Calendar */}
                    <div
                        onClick={() => navigate("/revenue-calendar")}
                        className="bg-gray-100 hover:bg-gray-50 hover:cursor-pointer rounded-lg shadow-md flex flex-col items-center justify-center p-6  transition-colors"
                    >
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
                        <h2 className="text-lg font-semibold text-center">
                            Revenue Recognition Calendar
                        </h2>
                    </div>

                    {/* Card for Sequoia Dashboard */}
                    <div
                        onClick={() => navigate("/sequoia-dashboard")}
                        className="bg-gray-100 hover:bg-gray-50 hover:cursor-pointer rounded-lg shadow-md flex flex-col items-center justify-center p-6  transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-green-500 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 17a2 2 0 104 0v-5a2 2 0 10-4 0m4 0H9m4 0h4m-4 0v1m0 4h.01M5 13h.01M5 17h.01M5 9h.01M5 5h.01M19 13h.01M19 17h.01M19 9h.01M19 5h.01"
                            />
                        </svg>
                        <h2 className="text-lg font-semibold text-center">
                            Sequoia Dashboard
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

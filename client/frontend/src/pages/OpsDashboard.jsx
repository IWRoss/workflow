import { useEffect, useState } from "react";
import { firebaseService } from "../services/firebaseService";
import { Link } from "react-router-dom";

import { SearchBar } from "../components/searchbar/SearchBar";
import { useSearch } from "../hooks/useSearch";
import { useSort } from "../hooks/useSort";
export default function OpsDashboard() {
    const [sows, setSows] = useState([]);
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [loading, setLoading] = useState(true);

    const {
        query,
        handleSearchChange,
        clearSearch,
        filteredItems: filteredSows,
        resultsCount,
        isSearching,
    } = useSearch(sows, [
        "client",
        "projectName",
        "projectCode",
        "clientEmail",
    ]);

    const sortedSows = useSort(filteredSows, sortField, sortOrder);

    useEffect(() => {
        const fetchSows = async () => {
            try {
                const data = await firebaseService.getAllSOWs();
                console.log("Fetched SOWs:", data);
                setSows(data);
            } catch (error) {
                console.error("Error fetching sows:", error);
            }
        };

        fetchSows().finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading SOWs...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto bg-white p-6 rounded shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-[#003E00]">
                        Ops Dashboard
                    </h1>
                </div>
                {/* Search Bar */}
                <SearchBar
                    value={query}
                    onChange={handleSearchChange}
                    onClear={clearSearch}
                    placeholder="Search by client, project, or status..."
                    resultsCount={resultsCount}
                    isSearching={isSearching}
                />

                <div className="mt-6">
                    {sortedSows.length === 0 ? (
                        <p className="text-gray-500">No SOWs available.</p>
                    ) : (
                        <div className="space-y-2 overflow-x-auto ">
                            {/* Fixed Headers */}
                            <div className="flex pl-2 min-w-max gap-4 border-b-2 border-[#003E00] pb-2 ">
                                <div
                                    onClick={() => {
                                        setSortField("client");
                                        setSortOrder(
                                            sortOrder === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                    className="sticky left-0  z-10 w-32 flex-shrink-0 p-2 hover:cursor-pointer bg-white"
                                >
                                    <p className="text-sm font-bold ">
                                        Client / <br />
                                        <span> Project Code</span>
                                        <span className="ml-1 text-xs text-gray-500">
                                            {sortField === "client"
                                                ? sortOrder === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </span>
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSortField("projectName");
                                        setSortOrder(
                                            sortOrder === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                    className="w-74 flex-shrink-0 p-2 hover:cursor-pointer"
                                >
                                    <p className="text-sm font-bold">
                                        Project Name
                                        <span className="ml-1 text-xs text-gray-500">
                                            {sortField === "projectName"
                                                ? sortOrder === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </span>
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSortField("status");
                                        setSortOrder(
                                            sortOrder === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                    className="w-24 flex-shrink-0 p-2 hover:cursor-pointer"
                                >
                                    <p className="text-sm font-bold">
                                        Status
                                        <span className="ml-1 text-xs text-gray-500">
                                            {sortField === "status"
                                                ? sortOrder === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </span>
                                    </p>
                                </div>
                                <div className="w-48 flex-shrink-0 p-2 ">
                                    <p className="text-sm font-bold">
                                        Timeline
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSortField("clientEmail");
                                        setSortOrder(
                                            sortOrder === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                    className="w-48 flex-shrink-0 p-2 hover:cursor-pointer"
                                >
                                    <p className="text-sm font-bold">
                                        Client Email
                                        <span className="ml-1 text-xs text-gray-500">
                                            {sortField === "clientEmail"
                                                ? sortOrder === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </span>
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSortField("createdAt");
                                        setSortOrder(
                                            sortOrder === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                    className="w-32 flex-shrink-0 p-2 hover:cursor-pointer"
                                >
                                    <p className="text-sm font-bold">
                                        Created At
                                        <span className="ml-1 text-xs text-gray-500">
                                            {sortField === "createdAt"
                                                ? sortOrder === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : ""}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {sortedSows.map((sow) => (
                                <Link
                                    key={sow.id}
                                    to={`/ops-dashboard/sow/${sow.id}`}
                                    className="group flex rounded-lg  p-2  hover:bg-gray-200 hover:cursor-pointer"
                                >
                                    <div className="flex pl-2 min-w-max gap-4">
                                        {/* Fixed Column */}
                                        <div className="sticky left-0 bg-gray-100 group-hover:bg-gray-200 transition-colors p-2 z-10 w-32 flex-shrink-0">
                                            <p className="text-sm font-bold">
                                                {sow.client}
                                                <br />
                                                <span className="text-gray-500 text-sm">
                                                    {sow.projectCode
                                                        ? sow.projectCode
                                                        : "N/A"}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="w-74 flex-shrink-0">
                                            <p className="text-gray-500 text-sm">
                                                {sow.projectName}
                                            </p>
                                        </div>

                                        <div className="w-24 flex-shrink-0">
                                            <p className="text-gray-500 text-sm">
                                                {sow.status}
                                            </p>
                                        </div>

                                        <div className="w-48 flex-shrink-0">
                                            <p className="text-gray-500 text-sm">
                                                {sow.timeline?.startDate
                                                    ? new Date(
                                                          sow.timeline
                                                              .startDate,
                                                      ).toLocaleDateString()
                                                    : "N/A"}{" "}
                                                -{" "}
                                                {sow.timeline?.endDate
                                                    ? new Date(
                                                          sow.timeline.endDate,
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div className="w-48 flex-shrink-0">
                                            <p className="text-gray-500 text-sm">
                                                {sow.clientEmail}
                                            </p>
                                        </div>
                                        <div className="w-32 flex-shrink-0">
                                            <p className="text-gray-500 text-sm">
                                                {sow.createdAt
                                                    ? new Date(
                                                          sow.createdAt,
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

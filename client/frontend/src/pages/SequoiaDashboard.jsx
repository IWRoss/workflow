import { useState, useEffect } from "react";
import { mondayService } from "../services/mondayService";
import BatteryChart from "../components/charts/BatteryChart";
import {
    getProjectsWithTimeTracking,
    formatSeconds,
} from "../utils/getProjectsWithTimeTracking";
import { useMemo } from "react";

const SequoiaDashboard = () => {
    const [opsBoardData, setOpsBoardData] = useState(null);
    const [studioBoardData, setStudioBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStudioHours, setTotalStudioHours] = useState([]);
    const [totalStudioCost, setTotalStudioCost] = useState(0);
    const [totalConsultantHours, setTotalConsultantHours] = useState(0);

    const opsBoardId = import.meta.env.VITE_OPS_MONDAY_BOARD;
    const studioBoardId = import.meta.env.VITE_STUDIO_MONDAY_BOARD;
    const consultantBoardId = import.meta.env.VITE_CONSULTANT_MONDAY_BOARD;

    const studioRate = 156.25;
    const consultantRate = 312.5;
    const projectBudget = 15000;

    useEffect(() => {
        let cancelled = false;
        const getAllOpsBoardDataByProjectCode = async () => {
            try {
                const opsResult = await mondayService.getBoardByProjectCode(
                    opsBoardId,
                    "COU011"
                );
                const studioResult = await mondayService.getBoardByProjectCode(
                    studioBoardId,
                    "COU011"
                );

                if (cancelled) return;
                const opsProjects = opsResult.data.boards[0].items_page.items;
                setOpsBoardData(opsProjects);
                const studioProjects =
                    studioResult.data.boards[0].items_page.items;

                const studioTimeTrackingProjects =
                    getProjectsWithTimeTracking(studioProjects);

                console.log(
                    "Studio Time Tracking Projects:",
                    studioTimeTrackingProjects
                );
                setTotalStudioHours(studioTimeTrackingProjects);

                

                setStudioBoardData(studioProjects);

                console.log("Filtered Ops Projects:", opsProjects);
                console.log("Filtered Studio Projects:", studioProjects);
            } catch (error) {
                console.error("Error:", error);
                setError(error.message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        getAllOpsBoardDataByProjectCode();

        return () => {
            cancelled = true;
        };
    }, [opsBoardId]);


    // Calculate total studio cost whenever totalStudioHours changes
    // Studio cost = hours * $156.25
    useMemo(() => {

        //Convert seconds to hours and multiply by rate
        const totalCost = totalStudioHours.reduce((acc, proj) => {
            return acc + (proj.duration / 3600) * studioRate;
        }, 0);
        console.log("Total Studio Cost:", totalCost);
        setTotalStudioCost(totalCost.toFixed(2));
    }, [totalStudioHours]);

    if (loading) {
        return (
            <div className="p-8 max-w-7xl bg-white rounded shadow-md mx-auto mt-10">
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl bg-white rounded shadow-md mx-auto mt-10">
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    }
    return (
        <div className="p-8 max-w-7xl bg-white rounded shadow-md mx-auto mt-10">
            <div className="">
                <h1 className="text-3xl font-bold">Sequoia Dashboard</h1>
            </div>
            <div className="mt-6">
                {opsBoardData.map((project, projectIndex) => (
                    <div key={projectIndex} className="mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                            {/**
                             * Only show project code, Total,Currency, Client
                             */}
                            {project.column_values.map((col, colIndex) => {
                                if (
                                    ![
                                        "Project Code",
                                        "Total",
                                        "Currency",
                                        "Client",
                                        "Billed Hours",
                                        "Consulting Fee",
                                        "Studio Fee",
                                        "Project fee",
                                    ].includes(col.column.title)
                                ) {
                                    return null;
                                }
                                //Remove quotes from values
                                const cleanValue =
                                    col.value?.replace(/"/g, "") || "N/A";

                                if (!col.value) return null;

                                return (
                                    <div
                                        key={colIndex}
                                        className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                            {col.column.title}
                                        </h3>
                                        <p className="text-lg font-medium text-gray-900">
                                            {cleanValue}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/**
             * Calculate
             * Studio hours * $156.25 = Studio usage
             * Consultant hours * $312.50 = Consultant usage
             * (Studio usage + Consultant usage) / $15,000 = % used
             */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                <h2 className="text-2xl font-bold mb-4">Project Usage</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors h-fit">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 ">
                            Number of Tasks (Studio)
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                            {studioBoardData.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Hours used (Studio)
                        </h3>
                        <div className="text-lg font-medium text-gray-900">
                            {/**
                            // List all the projects */}
                            {totalStudioHours.map((proj) => {
                                return (
                                    <div key={proj.id}>
                                        <p className="text-sm">
                                            {proj.name}:
                                            <span className="font-bold ">
                                                {proj.formatted} hours
                                            </span>
                                        </p>
                                    </div>
                                );
                            })}
                            <div className="mt-2 font-bold">
                                <p>
                                    Total hours spent:
                                    <span className="">
                                        {formatSeconds(
                                            totalStudioHours.reduce(
                                                (acc, proj) =>
                                                    acc + proj.duration,
                                                0
                                            )
                                        )}
                                    </span>
                                </p>
                                <p>
                                    Total cost:
                                    <span className="">
                                        $ {" "}
                                        {totalStudioCost
                                        }
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
<div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Number of tasks (Consultant)
                        </h3>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Hours used (Consultant)
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequoiaDashboard;

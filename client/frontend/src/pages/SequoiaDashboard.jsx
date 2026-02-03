import { useState, useEffect } from "react";
import { mondayService } from "../services/mondayService";
import {
    getProjectsWithTimeTracking,
    formatSeconds,
} from "../utils/getProjectsWithTimeTracking";
import { useMemo } from "react";
import StrokeGaugeChart from "../components/charts/StrokeGaugeChart";
import { filterProjectsByDateRange } from "../utils/filterProjectsByDateRange";
import SimplePieChart from "../components/charts/SimplePieChart";

const SequoiaDashboard = () => {
    const [opsBoardData, setOpsBoardData] = useState(null);
    const [studioBoardData, setStudioBoardData] = useState(null);
    const [consultantBoardData, setConsultantBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStudioHours, setTotalStudioHours] = useState([]);
    const [totalStudioCost, setTotalStudioCost] = useState(0);
    const [totalConsultantHours, setTotalConsultantHours] = useState([]);
    const [totalConsultantCost, setTotalConsultantCost] = useState(0);
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            start: startOfMonth.toISOString().split("T")[0],
            end: now.toISOString().split("T")[0],
        };
    });

    const opsBoardId = import.meta.env.VITE_OPS_MONDAY_BOARD;
    const studioBoardId = import.meta.env.VITE_STUDIO_MONDAY_BOARD;
    const consultantBoardId = import.meta.env.VITE_CONSULTANT_MONDAY_BOARD;

    const studioRate = 156.25;
    const consultantRate = 312.5;
    const projectBudget = 15000;
    const projectCode = import.meta.env.VITE_SEQUOIA_DASHBOARD_PROJECT_CODE;

    useEffect(() => {
        let cancelled = false;
        const getAllOpsBoardDataByProjectCode = async () => {
            try {
                const opsResult = await mondayService.getBoardByProjectCode(
                    opsBoardId,
                    projectCode
                );
                const studioResult = await mondayService.getBoardByProjectCode(
                    studioBoardId,
                    projectCode
                );

                const consultantResult = await mondayService.getBoard(
                    consultantBoardId
                );

                if (cancelled) return;

                const opsProjects = opsResult.data.boards[0].items_page.items;
                const opsProjectID = opsProjects[0].id;

                //console.log("ProjectID", opsProjectID);
                setOpsBoardData(opsProjects);

                const studioProjects =
                    studioResult.data.boards[0].items_page.items;

                const consultantProjects =
                    consultantResult.data.boards[0].items_page.items;

                //Filter consultantProjects by opsProjectID
                const filteredConsultantProjects = consultantProjects.filter(
                    (item) => {
                        for (const col of item.column_values) {
                            // Check if this column has linked_item_ids
                            if (
                                col.linked_item_ids &&
                                col.linked_item_ids.includes(opsProjectID)
                            ) {
                                return true;
                            }
                        }
                        return false;
                    }
                );

                setConsultantBoardData(filteredConsultantProjects);

                //console.log(
                //    "Filtered Consultant Projects:",
                //    filteredConsultantProjects
                //);

                //console.log("Consultant Projects:", consultantProjects);

                // Calculate total hours for studio projects
                const studioTimeTrackingProjects =
                    getProjectsWithTimeTracking(studioProjects);

                const consultantTimeTrackingProjects =
                    getProjectsWithTimeTracking(filteredConsultantProjects);

                //console.log(
                //    "Consultant Time Tracking Projects:",
                //    consultantTimeTrackingProjects
                //);
                setTotalConsultantHours(consultantTimeTrackingProjects);

                //console.log(
                //    "Studio Time Tracking Projects:",
                //    studioTimeTrackingProjects
                //);
                setTotalStudioHours(studioTimeTrackingProjects);

                setStudioBoardData(studioProjects);

                //console.log("Filtered Ops Projects:", opsProjects);
                //console.log("Filtered Studio Projects:", studioProjects);
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

    // Filter projects by date range
    const filteredStudioHours = useMemo(() => {
        return filterProjectsByDateRange(
            totalStudioHours,
            dateRange.start,
            dateRange.end
        );
    }, [totalStudioHours, dateRange.start, dateRange.end]);

    const filteredConsultantHours = useMemo(() => {
        return filterProjectsByDateRange(
            totalConsultantHours,
            dateRange.start,
            dateRange.end
        );
    }, [totalConsultantHours, dateRange.start, dateRange.end]);

    // Calculate total studio cost whenever totalStudioHours changes
    // Studio cost = hours * $156.25
    useMemo(() => {
        //Convert seconds to hours and multiply by rate
        const totalCost = filteredStudioHours.reduce((acc, proj) => {
            return acc + (proj.duration / 3600) * studioRate;
        }, 0);
        //console.log("Total Studio Cost:", totalCost);
        setTotalStudioCost(totalCost.toFixed(2));
    }, [filteredStudioHours]);

    // Calculate total consultant hours whenever totalConsultantHours changes
    // Consultant cost = hours * $312.50
    useMemo(() => {
        const totalHours = filteredConsultantHours.reduce((acc, proj) => {
            return acc + proj.duration;
        }, 0);
        //console.log("Total Consultant Hours (seconds):", totalHours);
        setTotalConsultantCost(
            ((totalHours / 3600) * consultantRate).toFixed(2)
        );
    }, [filteredConsultantHours]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="p-8 rounded-lg flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#004741] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white mt-4">
                        Loading Sequoia Dashboard...
                    </p>
                </div>
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Sequoia Dashboard</h1>
                </div>

                <div className="flex items-center">
                    {/** Date range picker **/}
                    <input
                        type="date"
                        value={dateRange.start || ""}
                        onChange={(e) =>
                            setDateRange((prev) => ({
                                ...prev,
                                start: e.target.value,
                            }))
                        }
                        className="border border-gray-300 rounded px-3 py-2 mt-4"
                    />
                    <span className="mx-2">to</span>
                    <input
                        type="date"
                        value={dateRange.end || ""}
                        onChange={(e) =>
                            setDateRange((prev) => ({
                                ...prev,
                                end: e.target.value,
                            }))
                        }
                        className="border border-gray-300 rounded px-3 py-2 mt-4"
                    />
                </div>
            </div>

            <div className="mt-6">
                {opsBoardData.map((project, projectIndex) => (
                    <div key={projectIndex} className="mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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

            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                <h2 className="text-2xl font-bold mb-4">Project Usage</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Budget Usage
                        </h3>
                        <StrokeGaugeChart
                            value={
                                ((parseFloat(totalStudioCost) +
                                    parseFloat(totalConsultantCost)) /
                                    projectBudget) *
                                100
                            }
                            label={`out of $${projectBudget}`}
                        />
                    </div>

                    {/* Consultant Hours Chart */}
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Hours used (Consultant)
                        </h3>
                        {filteredConsultantHours.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No data available for the selected date range.
                            </p>
                        ) : (
                            <div className="text-lg font-medium text-gray-900">
                                <SimplePieChart
                                    series={filteredConsultantHours.map(
                                        (proj) => parseFloat(proj.hours)
                                    )}
                                    labels={filteredConsultantHours.map(
                                        (proj) => proj.name
                                    )}
                                    unit=" hrs"
                                    title="Consultant Hours Breakdown"
                                />
                                <div className="mt-4 flex flex-col md:flex-row md:space-x-4 justify-center ">
                                    <p className="bg-green-50 border rounded-sm p-3 border-green-500 text-sm">
                                        <span className="font-semibold">
                                            Total hours:
                                        </span>{" "}
                                        <br />
                                        {formatSeconds(
                                            filteredConsultantHours.reduce(
                                                (acc, proj) =>
                                                    acc + proj.duration,
                                                0
                                            )
                                        )}
                                    </p>
                                    <p className="bg-green-50 border rounded-sm p-3 border-green-500 text-sm">
                                        <span className="font-semibold">
                                            Total cost:
                                        </span>{" "}
                                        <br />${totalConsultantCost}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Studio Hours Chart */}
                    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Hours used (Studio)
                        </h3>
                        {filteredStudioHours.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No data available for the selected date range.
                            </p>
                        ) : (
                            <div className="text-lg font-medium text-gray-900">
                                <SimplePieChart
                                    series={filteredStudioHours.map((proj) =>
                                        parseFloat(proj.hours)
                                    )}
                                    labels={filteredStudioHours.map(
                                        (proj) => proj.name
                                    )}
                                    unit=" hrs"
                                    title="Studio Hours Breakdown"
                                />
                                <div className="mt-4 flex flex-col md:flex-row md:space-x-4 justify-center ">
                                    <p className="bg-green-50 border rounded-sm p-3 border-green-500 text-sm">
                                        <span className="font-semibold">
                                            Total hours:
                                        </span>{" "}
                                        <br />
                                        {formatSeconds(
                                            filteredStudioHours.reduce(
                                                (acc, proj) =>
                                                    acc + proj.duration,
                                                0
                                            )
                                        )}
                                    </p>
                                    <p className="bg-green-50 border rounded-sm p-3 border-green-500 text-sm">
                                        <span className="font-semibold">
                                            Total cost:
                                        </span>{" "}
                                        <br />${totalStudioCost}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task counts section */}
                <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                    <div className="break-inside-avoid flex gap-4 flex-col md:flex-row justify-stretch">
                        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors flex-1">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                Number of Tasks (Studio)
                            </h3>
                            <p className="text-lg font-medium text-gray-900">
                                {filteredStudioHours.length}
                                <span className=" mt-2 gap-2 flex flex-col text-sm text-gray-600">
                                    {filteredStudioHours.map((proj, idx) => (
                                        <span className="" key={idx}>
                                            ⦾ {proj.name}
                                            <br />
                                        </span>
                                    ))}
                                </span>
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors flex-1">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                Number of tasks (Consultant)
                            </h3>
                            <p className="text-lg font-medium text-gray-900">
                                {filteredConsultantHours.length}
                                <span className=" mt-2 gap-2 flex flex-col text-sm text-gray-600">
                                    {filteredConsultantHours.map((proj, idx) => (
                                        <span className="" key={idx}>
                                            ⦾ {proj.name}
                                            <br />
                                        </span>
                                    ))}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequoiaDashboard;

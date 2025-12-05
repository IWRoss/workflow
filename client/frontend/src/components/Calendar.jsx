import { Months, Years } from "../utils/Months";
import { Info } from "lucide-react";
import { useState } from "react";

export const Calendar = ({ items = [] }) => {
    const [infoTaskClicked, setInfoTaskClicked] = useState(null);
    const [yearSelected, setYearSelected] = useState(new Date().getFullYear());

    const sessionInMonth = (session, monthIndex, yearIndex) => {
        // Get the month and year from the session start date
        const startDate = new Date(session.started_at);
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();

        // Get the month and year from the session end date
        const endDate = new Date(session.ended_at);
        const endMonth = endDate.getMonth();
        const endYear = endDate.getFullYear();

        // Check if session starts in this month
        const startsInMonth =
            startMonth === monthIndex && startYear === yearIndex;

        // Check if session ends in this month
        const endsInMonth = endMonth === monthIndex && endYear === yearIndex;

        // Session belongs to this month if it starts OR ends in this month
        return startsInMonth || endsInMonth;
    };

    // Helper to get tasks for a specific month
    const getTasksForMonth = (item, monthIndex, yearIndex) => {
        if (!item.time_tracking) return [];

        return Object.values(item.time_tracking).filter((task) => {
            if (!task.sessions || task.sessions.length === 0) return false;

            // Check if ANY session falls within this month
            return task.sessions.some((session) =>
                sessionInMonth(session, monthIndex, yearIndex)
            );
        });
    };

    // Function to calculate the Total from Items by linking each Month
    const calculateMonthlyTotal = (item, monthIndex, yearIndex) => {
    const total = item.totalProjectAmmountCol;
    if (!total || total === 0) return 0;

    const tasksInThisMonth = getTasksForMonth(item, monthIndex, yearIndex);

    if (tasksInThisMonth.length === 0) return 0;

    let totalMonthsWithTasks = 0;

    if (item.time_tracking) {
        const monthsWithTasks = new Set();

        // Loop through each task
        Object.values(item.time_tracking).forEach((task) => {
            if (!task.sessions || task.sessions.length === 0) return;

            // Loop through each session in the task
            task.sessions.forEach((session) => {
                const startDate = new Date(session.started_at);
                const endDate = new Date(session.ended_at);

                const startMonth = startDate.getMonth();
                const startYear = startDate.getFullYear();
                const endMonth = endDate.getMonth();
                const endYear = endDate.getFullYear();

                // Add the month where session starts
                monthsWithTasks.add(`${startYear}-${startMonth}`);

                // Add the month where session ends (if different)
                monthsWithTasks.add(`${endYear}-${endMonth}`);
            });
        });

        totalMonthsWithTasks = monthsWithTasks.size;
        console.log("Total months with tasks for item", item.id, ":", totalMonthsWithTasks);
    }

    if (totalMonthsWithTasks === 0) return 0;

    return total / totalMonthsWithTasks;
};

    const formatMoney = (amount, currency) => {
        if (amount == null) return "";
        //Convert to number
        const numberAmount = Number(amount);
        //Keep 2 decimal places
        const formattedAmount = numberAmount.toFixed(2);

        return currency ? `${currency} ${formattedAmount}` : formattedAmount;
    };

    return (
        <div className="relative overflow-x-auto overflow-y-auto h-full w-full">
            <table className="min-w-full border-collapse text-xs">
                <thead>
                    <tr>
                        <th className="sticky top-0 left-0 z-20 bg-gray-50 px-3 py-2 text-left min-w-[220px]">
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <p className="text-gray-500 text-xs">Item</p>
                                <div className="flex items-center space-x-1">
                                    <span className="text-gray-500 text-xs">
                                        Year:
                                    </span>
                                    <select
                                        value={yearSelected}
                                        onChange={(e) =>
                                            setYearSelected(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="border border-gray-300 rounded-md p-1 text-xs"
                                    >
                                        {Years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </th>

                        {Months.map((month, index) => (
                            <th
                                key={index}
                                className="sticky top-0 px-3 py-2 bg-gray-50 text-center whitespace-nowrap z-10"
                            >
                                {month}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className="p-3 font-semibold sticky left-0 bg-white z-10 min-w-[220px] max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">
                                <div className="truncate" title={item.name}>
                                    {item.name}
                                </div>
                                <div className="mt-1 text-[0.7rem] text-gray-500 font-normal">
                                    {formatMoney(
                                        item.totalProjectAmmountCol,
                                        item.currency
                                    )}
                                </div>
                            </td>

                            {/* Month cells */}
                            {Months.map((_, monthIndex) => {
                                const tasks = getTasksForMonth(
                                    item,
                                    monthIndex,
                                    yearSelected
                                );
                                const monthlyTotal = calculateMonthlyTotal(
                                    item,
                                    monthIndex,
                                    yearSelected
                                );
                                const hasValue =
                                    tasks.length > 0 || monthlyTotal > 0;

                                return (
                                    <td
                                        key={monthIndex}
                                        className={`border border-gray-400 p-0 ${
                                            hasValue
                                                ? "bg-white"
                                                : "bg-gray-200"
                                        }`}
                                    >
                                        <div className="min-w-[120px] p-3">
                                            {!hasValue ? (
                                                <span className="text-gray-600">
                                                    —
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {/* Task info icons */}
                                                    {tasks.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {tasks.map(
                                                                (task) => (
                                                                    <div
                                                                        key={
                                                                            task.taskId
                                                                        }
                                                                        className="relative"
                                                                        onClick={() =>
                                                                            setInfoTaskClicked(
                                                                                task.taskId
                                                                            )
                                                                        }
                                                                        onMouseLeave={() =>
                                                                            setInfoTaskClicked(
                                                                                null
                                                                            )
                                                                        }
                                                                    >
                                                                        <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                                                                        {infoTaskClicked ===
                                                                            task.taskId && (
                                                                            <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-50 whitespace-normal break-words max-w-[80vw]">
                                                                                {
                                                                                    task.taskName
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Monthly total */}
                                                    {monthlyTotal > 0 && (
                                                        <div className="font-semibold text-gray-800">
                                                            {formatMoney(
                                                                monthlyTotal,
                                                                item.currency
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

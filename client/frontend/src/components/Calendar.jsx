import { Months, Years } from "../utils/Months";
import { Info } from "lucide-react";
import { useState } from "react";

export const Calendar = ({ items = [] }) => {
    const [infoTaskClicked, setInfoTaskClicked] = useState(null);
    const [yearSelected, setYearSelected] = useState(new Date().getFullYear());

    // Helper to get tasks for a specific month
    const getTasksForMonth = (item, monthIndex, yearIndex) => {
        if (!item.time_tracking) return [];

        return Object.values(item.time_tracking).filter((task) => {
            if (!task.earliestStart) return false;

            const date =
                task.earliestStart instanceof Date
                    ? task.earliestStart
                    : new Date(task.earliestStart);

            return date.getMonth() === monthIndex && date.getFullYear() === yearSelected;
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
        Object.values(item.time_tracking).forEach((task) => {
            if (!task.earliestStart) return;
            const date =
                task.earliestStart instanceof Date
                    ? task.earliestStart
                    : new Date(task.earliestStart);
            monthsWithTasks.add(`${date.getFullYear()}-${date.getMonth()}`);
        });
        totalMonthsWithTasks = monthsWithTasks.size;
    }

    if (totalMonthsWithTasks === 0) return 0;

    return total / totalMonthsWithTasks;
};

    const formatMoney = (amount, currency) => {
        if (amount == null) return "";
        const formattedNumber = amount.toLocaleString();
        return currency ? `${currency} ${formattedNumber}` : formattedNumber;
    };

    return (
        <div className="relative overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
                <thead>
                    <tr>
                        <th className="flex flex-row gap-4 justify-between items-center border border-gray-300 px-3 py-2 bg-gray-50 text-left sticky left-0 z-20 min-w-[220px]">
                            <p className="text-gray-500 text-xs">Item</p>

                            <div className="flex items-center space-x-1">
                                <span className="text-gray-500 text-xs">
                                    Year:
                                </span>
                                <select
                                    value={yearSelected}
                                    onChange={(e) =>
                                        setYearSelected(Number(e.target.value))
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
                        </th>
                        {Months.map((month, index) => (
                            <th
                                key={index}
                                className="border border-gray-300 px-3 py-2 bg-gray-50 text-center whitespace-nowrap"
                            >
                                {month}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className="border border-gray-300 p-3 font-semibold sticky left-0 bg-white z-10 min-w-[220px] max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis ">
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
                                    monthIndex, yearSelected
                                );
                                const monthlyTotal = calculateMonthlyTotal(
                                    item,
                                    monthIndex, yearSelected
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
                                            ) : tasks.length === 0 ? (
                                                <div className="font-semibold text-gray-800">
                                                    {formatMoney(
                                                        monthlyTotal,
                                                        item.currency
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {tasks.map((task) => (
                                                        <div key={task.taskId}>
                                                            <div className="font-sm flex items-center gap-2">
                                                                <div
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
                                                                        <div
                                                                            className="
                                                                                        absolute
                                                                                        left-6
                                                                                        top-0
                                                                                        bg-gray-800 text-white text-xs
                                                                                        px-2 py-1
                                                                                        rounded
                                                                                        z-50
                                                                                        whitespace-normal
                                                                                        break-words
                                                                                        max-w-[80vw]
                                                                                        "
                                                                        >
                                                                            {
                                                                                task.taskName
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {monthlyTotal >
                                                                    0 && (
                                                                    <div className="font-semibold text-gray-800">
                                                                        {formatMoney(
                                                                            monthlyTotal,
                                                                            item.currency
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
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

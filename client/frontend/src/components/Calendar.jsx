import { Months } from "../utils/Months";

export const Calendar = ({ items = [] }) => {
    // Helper to get tasks for a specific month
    const getTasksForMonth = (item, monthIndex) => {
        if (!item.time_tracking) return [];

        return Object.values(item.time_tracking).filter((task) => {
            if (!task.earliestStart) return false;

            const date =
                task.earliestStart instanceof Date
                    ? task.earliestStart
                    : new Date(task.earliestStart);

            return date.getMonth() === monthIndex;
        });
    };

    // Function to calculate the Total from Items by linking each Month
    // E.g - If Total is 8000 and work was done in N months, each month will show 8000 / N
    const calculateMonthlyTotal = (item, monthIndex) => {
        const total = item.totalProjectAmmountCol;
        if (!total || total === 0) return 0;

        // This month must have tasks, otherwise 0
        const tasksInThisMonth = getTasksForMonth(item, monthIndex);
        if (tasksInThisMonth.length === 0) return 0;

        // Count how many months have tasks
        let totalMonthsWithTasks = 0;
        for (let i = 0; i < 12; i++) {
            if (getTasksForMonth(item, i).length > 0) {
                totalMonthsWithTasks++;
            }
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
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
                <thead>
                    <tr>
                        <th
                            className="
                border border-gray-300 px-3 py-2 bg-gray-50 text-left 
                sticky left-0 z-20
              "
                        >
                            Item
                        </th>

                        {Months.map((month, index) => (
                            <th
                                key={index}
                                className="
                  border border-gray-300 px-3 py-2 bg-gray-50 
                  text-center whitespace-nowrap
                "
                            >
                                {month}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            {/* Item name column */}
                            <td
                                className="
                  border border-gray-300 px-3 py-2 font-semibold 
                  sticky left-0 bg-white z-10 max-w-[220px]
                  whitespace-nowrap overflow-hidden text-ellipsis
                "
                            >
                                <div>{item.name}</div>

                                {/* Display Total Value of the Item */}
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
                                    monthIndex
                                );
                                const monthlyTotal = calculateMonthlyTotal(
                                    item,
                                    monthIndex
                                );
                                console.log(
                                    item.name,
                                    item.currency,
                                    item.totalProjectAmmountCol
                                );

                                return (
                                    <td
                                        key={monthIndex}
                                        className="
                      border border-gray-200 px-2 py-2 align-top 
                      min-w-[120px]
                    "
                                    >
                                        {tasks.length === 0 ? (
                                            monthlyTotal === 0 ? (
                                                <span className="text-gray-300">
                                                    —
                                                </span>
                                            ) : (
                                                <div className="font-semibold text-gray-800">
                                                    {formatMoney(
                                                        monthlyTotal,
                                                        item.currency
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <>
                                                {/* Tasks list */}
                                                {tasks.map((task) => (
                                                    <div
                                                        key={task.taskId}
                                                        className="
                              mb-1 pb-1 border-b border-dashed border-gray-200
                            "
                                                    >
                                                        <div className="font-medium">
                                                            {task.taskName}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Monthly split of total */}
                                                {monthlyTotal > 0 && (
                                                    <div className="font-semibold text-gray-800 mt-1">
                                                        {formatMoney(
                                                            monthlyTotal,
                                                            item.currency
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
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

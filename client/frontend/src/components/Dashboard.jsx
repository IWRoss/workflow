import { useState, useEffect } from "react";
import { mondayService } from "../services/mondayService";
import { Calendar } from "./Calendar";

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eachItemTimeTrackingData, setEachItemTimeTrackingData] = useState(
        {}
    );

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const data = await mondayService.getBoard(
                    import.meta.env.VITE_OPS_MONDAY_BOARD
                );
                console.log("Monday Board Data:", data);

                const boardItems =
                    data?.data?.boards[0]?.items_page?.items || [];

                const formattedItems = boardItems.map((item) => {
                    const taskTimeTracking = {};

                    const total = item.column_values.find(
                        (cv) =>
                            cv.title === "Total" || cv.column?.title === "Total"
                    );

                    // Get Type of Currency Column
                    const currencyColumn = item.column_values.find(
                        (cv) =>
                            cv.title === "Currency" ||
                            cv.column?.title === "Currency"
                    );


                    let currency = null;
                    //Parse Currency Type

                    if (currencyColumn && currencyColumn.value != null) {
                        try {
                            currency = JSON.parse(currencyColumn.value);
                        } catch (e) {
                            currency = String(currencyColumn.value).replace(
                                /"/g,
                                ""
                            );
                        }
                    }

                    let totalProjectAmmountCol = 0;

                    if (total && total.value != null) {
                        try {
                            const parsed = JSON.parse(total.value);

                            totalProjectAmmountCol = Number(parsed) || 0;
                        } catch (e) {
                            totalProjectAmmountCol =
                                Number(String(total.value).replace(/"/g, "")) ||
                                0;
                        }
                    }

                    item.column_values.forEach((col) => {
                        if (
                            col.column?.type === "mirror" &&
                            col.mirrored_items?.length > 0
                        ) {
                            col.mirrored_items.forEach((mirroredItem) => {
                                const linkedItem = mirroredItem.linked_item;
                                if (!linkedItem) return;

                                const taskId = linkedItem.id;
                                const taskName = linkedItem.name;

                                if (taskTimeTracking[taskId]) return;

                                const timeTrackingCol =
                                    linkedItem.column_values?.find(
                                        (c) =>
                                            c.column?.type === "time_tracking"
                                    );

                                if (timeTrackingCol) {
                                    const sessions =
                                        timeTrackingCol.history || [];
                                    const totalDuration =
                                        timeTrackingCol.duration || 0;

                                    let earliestStart = null;
                                    let latestEnd = null;

                                    sessions.forEach((session) => {
                                        const start = new Date(
                                            session.started_at
                                        );
                                        const end = new Date(session.ended_at);

                                        if (
                                            !earliestStart ||
                                            start < earliestStart
                                        )
                                            earliestStart = start;
                                        if (!latestEnd || end > latestEnd)
                                            latestEnd = end;
                                    });

                                    const taskData = {
                                        taskId,
                                        taskName,
                                        totalDuration,
                                        sessionCount: sessions.length,
                                        earliestStart,
                                        latestEnd,
                                        sessions,
                                    };

                                    taskTimeTracking[taskId] = taskData;
                                }
                            });
                        }
                    });

                    return {
                        id: item.id,
                        name: item.name,
                        column_values: item.column_values,
                        time_tracking: taskTimeTracking,
                        totalProjectAmmountCol,
                        currency,
                    };
                });

                setItems(formattedItems);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div>
            <Calendar items={items} />
        </div>
    );
}

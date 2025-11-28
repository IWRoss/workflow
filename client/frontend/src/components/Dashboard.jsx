import { useState, useEffect } from "react";
import { mondayService } from "../services/mondayService";

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const data = await mondayService.getBoard(import.meta.env.VITE_OPS_MONDAY_BOARD);
                console.log("Monday Board Data:", data);
                
                const boardItems = data?.data?.boards[0]?.items_page?.items || [];
                
                // Map items once, then set state once
                const formattedItems = boardItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    column_values: item.column_values
                }));
                
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
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <ul>
                {items.map((item) => (
                    <li key={item.id} className="mb-2 p-4 border rounded">
                        <h2 className="text-xl font-semibold">{item.name}</h2>
                        <div className="mt-2">
                            {item.column_values.map((col) => (
                                <div key={col.column.id} className="mb-1">
                                    <strong>{col.column.title}:</strong> {col.value || "—"}
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
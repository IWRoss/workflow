import { useState, useEffect } from "react";
import { mondayService } from "../services/mondayService";

export default function Dashboard() {
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const data = await mondayService.getBoard(import.meta.env.VITE_OPS_MONDAY_BOARD);
                console.log("Monday Board Data:", data);
                setBoard(data);
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

    const items = board?.data?.boards[0]?.items_page?.items || [];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <h2 className="text-xl mb-2">{board?.data?.boards[0]?.name}</h2>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item.id} className="p-4 border rounded">
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
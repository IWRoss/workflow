export const mondayService = {
    getBoard: async (boardId) => {
        const res = await fetch(`/monday/boards/${boardId}`);
        if (!res.ok) throw new Error("Failed to fetch board");
        return res.json();
    },

    getMembers: async () => {
        const res = await fetch("/monday/members");
        if (!res.ok) throw new Error("Failed to fetch members");
        return res.json();
    },
};
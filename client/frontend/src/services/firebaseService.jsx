export const firebaseService = {
    getSOW: async (sowID) => {
        const res = await fetch(`/sows/${sowID}`);
        if (!res.ok) throw new Error("Failed to fetch sow");
        return res.json();
    },
    getAllSOWs: async () => {
        const res = await fetch(`/sows`);
        if (!res.ok) throw new Error("Failed to fetch sows");
        return res.json();
    },
};
export const searchItems = (items,query,searchFields) => {
    if (!query) return items;

    const lowerCaseQuery = query.toLowerCase();

    return items.filter((item) =>
        searchFields.some((field) =>
            item[field]?.toString().toLowerCase().includes(lowerCaseQuery),
        ),
    );
};

//Add delay to a function to prevent it from being called too frequently (e.g. on every keystroke)
export const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
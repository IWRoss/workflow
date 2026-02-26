import { useState, useMemo, useCallback } from 'react';
import { searchItems, debounce } from '../utils/searchUtils';

export const useSearch = (items, searchFields, options = {}) => {
    const { debounceDelay = 300, caseSensitive = false } = options;
    
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounced query update
    const debouncedSetQuery = useCallback(
        debounce((value) => setDebouncedQuery(value), debounceDelay),
        [debounceDelay]
    );

    // Handle search input change
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSetQuery(value);
    }, [debouncedSetQuery]);

    // Clear search
    const clearSearch = useCallback(() => {
        setQuery('');
        setDebouncedQuery('');
    }, []);

    // Filtered results
    const filteredItems = useMemo(() => {
        return searchItems(items, debouncedQuery, searchFields);
    }, [items, debouncedQuery, searchFields]);

    return {
        query,
        setQuery,
        handleSearchChange,
        clearSearch,
        filteredItems,
        resultsCount: filteredItems.length,
        isSearching: query.length > 0
    };
};
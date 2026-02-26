
export const SearchBar = ({ 
    value, 
    onChange, 
    onClear, 
    placeholder = "Search...",
    resultsCount,
    isSearching
}) => {
    return (
        <div className="relative">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-[#003E00] focus-within:border-[#003E00]">
                {/* Search Icon */}
                <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                </svg>

                {/* Input */}
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="flex-1 outline-none bg-transparent"
                />

                {/* Clear Button */}
                {isSearching && (
                    <button
                        onClick={onClear}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M6 18L18 6M6 6l12 12" 
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Results Count */}
            {isSearching && (
                <p className="text-sm text-gray-500 mt-2">
                    {resultsCount} {resultsCount === 1 ? 'result' : 'results'} found
                </p>
            )}
        </div>
    );
};
import { useState, useMemo } from 'react';

/**
 * A custom hook to manage sorting and searching for a table.
 * @param {Array} items - The initial array of data.
 * @param {Array<string>} searchableFields - An array of object keys to use for searching.
 * @param {Object} [initialConfig=null] - The initial sort configuration (e.g., { key: 'name', direction: 'ascending' }).
 * @returns An object containing the processed items and functions to control sorting and searching.
 */
export const useTableSortSearch = (items = [], searchableFields = [], initialConfig = null) => {
    const [sortConfig, setSortConfig] = useState(initialConfig);
    const [searchTerm, setSearchTerm] = useState('');

    const sortedAndFilteredItems = useMemo(() => {
        let filterableItems = [...items];

        // 1. Apply search filter
        if (searchTerm) {
            filterableItems = filterableItems.filter(item => {
                return searchableFields.some(field => {
                    const fieldValue = item[field];
                    return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
                });
            });
        }

        // 2. Apply sorting
        if (sortConfig !== null) {
            filterableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filterableItems;
    }, [items, sortConfig, searchTerm, searchableFields]);

    const requestSort = (key) => {
        const direction = (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };

    return { items: sortedAndFilteredItems, requestSort, sortConfig, setSearchTerm, searchTerm };
};

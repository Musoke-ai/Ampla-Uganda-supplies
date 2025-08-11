function applyFilters(filters, inventory) {
    return inventory.filter(item => {
        // Apply Category Filter
        if (filters.category && item.category !== filters.category) return false;
        
        // Apply Supplier Filter
        if (filters.supplier && item.supplier !== filters.supplier) return false;
        
        // Apply Stock Level Filter
        if (filters.stockLevel) {
            if (filters.stockLevel === 'low' && item.stockLevel > item.reorderLevel) return false;
            if (filters.stockLevel === 'outOfStock' && item.stockLevel > 0) return false;
            if (filters.stockLevel === 'overstocked' && item.stockLevel <= item.reorderLevel) return false;
        }
        
        // Apply Price Range Filter
        if (filters.priceRange && (item.price < filters.priceRange.min || item.price > filters.priceRange.max)) return false;
        
        // Apply Date Added Filter
        if (filters.dateAdded) {
            const itemDate = new Date(item.dateAdded);
            const [startDate, endDate] = filters.dateAdded;
            if (itemDate < startDate || itemDate > endDate) return false;
        }
        
        // Apply Location Filter
        if (filters.location && item.location !== filters.location) return false;
        
        // Apply Stock Status Filter
        if (filters.stockStatus && item.stockStatus !== filters.stockStatus) return false;
        
        // Apply Reorder Level Filter
        if (filters.reorderLevel && item.stockLevel > item.reorderLevel) return false;
        
        // Apply SKU/Barcode Filter
        if (filters.sku && !item.sku.includes(filters.sku)) return false;
        
        // Apply Brand/Manufacturer Filter
        if (filters.brand && item.brand !== filters.brand) return false;
        
        // Apply Product Status Filter
        if (filters.status && item.status !== filters.status) return false;
        
        // Apply Discounted Items Filter
        if (filters.discounted !== undefined && item.discounted !== filters.discounted) return false;
        
        // Apply Tags/Labels Filter
        if (filters.tags && !filters.tags.every(tag => item.tags.includes(tag))) return false;
        
        // Apply Units Sold Filter
        if (filters.unitsSold) {
            if (filters.unitsSold === 'bestSellers' && item.unitsSold < 100) return false;
            if (filters.unitsSold === 'lowSellers' && item.unitsSold >= 100) return false;
        }
        
        // Apply Product Type Filter
        if (filters.type && item.type !== filters.type) return false;
        
        // Apply Weight/Volume Filter
        if (filters.weight && (item.weight < filters.weight.min || item.weight > filters.weight.max)) return false;

        return true;
    });
}
export default applyFilters;
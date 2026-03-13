import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import './ScrapItemsss.css';

const ScrapItem = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortOption, setSortOption] = useState('price-asc');

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:3000/api/scrap');
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filterItems = useCallback(() => {
    let result = [...items];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.type.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }
    
    switch(sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'type-asc':
        result.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }
    
    setFilteredItems(result);
  }, [searchTerm, sortOption, items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterItems]);

  // Card animation variants removed because they were unused

  return (
    <div className="scrap-marketplace">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="header"
        >
          <h1 className="title">
            ♻️ Scrap Items Marketplace
          </h1>
          <p className="subtitle">
            Find the best deals on recycled materials and contribute to a sustainable future
          </p>
        </motion.div>

        {/* Search and filter controls */}
        <div className="controls">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by item type or description..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="type-asc">Type: A-Z</option>
            </select>
            
            <button
              onClick={fetchItems}
              className="refresh-button"
            >
              <FiRefreshCw className={`refresh-icon ${isLoading ? 'spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <h3 className="empty-title">No items found</h3>
            <p className="empty-message">Try adjusting your search or filters</p>
          </div>
        )}

       
  {/* Items grid with larger images */}
<div className="items-grid-container">
  <motion.div className="items-grid">
    {filteredItems.map((item, index) => (
      <motion.div
        key={item.id || index}
        className="item-card"
        whileHover={{ scale: 1.03 }}
        onClick={() => setSelectedItem(item)}
      >
        <div className="item-image-container">
          <img
            src={item.image}
            alt={item.type}
            className="item-image"
          />
        </div>
        <div className="item-details">
          <h3>{item.type}</h3>
          <p>₹{item.price}/kg</p>
        </div>
      </motion.div>
    ))}
  </motion.div>
</div>
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                layoutId={`card-${selectedItem.id || filteredItems.indexOf(selectedItem)}`}
              >
                <div className="modal-image-container">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.type}
                    className="modal-image"
                  />
                </div>
                <div className="modal-details">
                  <h2 className="modal-title">{selectedItem.type}</h2>
                  <p className="modal-price">₹{selectedItem.price} per kg</p>
                  <div className="modal-description">
                    <h3>Description</h3>
                    <p>
                      {selectedItem.description || 'High quality recycled material ready for reuse.'}
                    </p>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScrapItem;
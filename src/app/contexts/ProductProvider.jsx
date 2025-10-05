//Store, create, and edit products with live data
//Needs to be a context as many users should be able to access limited information
"use client"
import { useState, useEffect, useContext } from 'react';
import { ProductContext } from './ProductContext';
import { AccesspointContext } from './AccesspointContext';

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const { accessPoints } = useContext(AccesspointContext);

    // Fetch all products from API
    useEffect(() => {
        if (!dataLoaded) {
            fetch('/api/products')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setProducts(data.data);
                    setDataLoaded(true);
                })
                .catch(() => setDataLoaded(true));
        }
    }, [dataLoaded]);

    // Create product via API
    const create = async (currApId, destApId, price) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currApId,
                    destApId,
                    price,
                })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => [...prev, data.data]);
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    };

    // Get product by id from local state
    const get = (id) => products.find(product => product.id === id);

    // Update commuter phone number for a product by id (API PATCH)
    const setCommuter = async (productId, phoneNumber) => {
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commuterPN: phoneNumber })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, commuterPN: phoneNumber } : p));
            } else {
                throw new Error(data.error || 'Failed to update product commuter');
            }
        } catch (error) {
            console.error('Error updating commuter:', error);
        }
    };

    // Update the location (currApId, destApId) for a product by id (API PATCH)
    const setLocation = async (productId, currApId, destApId) => {
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currApId, destApId })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, currApId, destApId } : p));
            } else {
                throw new Error(data.error || 'Failed to update product location');
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    const value = {
        products,
        create,
        get,
        setCommuter,
        setLocation,
        accessPoints,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}
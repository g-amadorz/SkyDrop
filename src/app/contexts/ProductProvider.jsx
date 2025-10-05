//Store, create, and edit products with live data
//Needs to be a context as many users should be able to access limited information
"use client"

import { useState, useEffect } from 'react';
import { ProductContext } from './ProductContext';

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Helper: sync state and localStorage
    const syncProducts = (newProducts) => {
        setProducts(newProducts);
        localStorage.setItem('products', JSON.stringify(newProducts));
    };

    // Create product (delivery) via API, keep name in frontend
    const create = async ({ currApId, destApId, price, name }) => {
        // POST to /api/deliveries
        const res = await fetch('/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originAccessPoint: currApId,
                destinationAccessPoint: destApId,
                price,
                name, // not stored in backend, but kept in frontend
            }),
        });
        const json = await res.json();
        if (json.success && json.data) {
            // Attach name for frontend
            const newProduct = { ...json.data, name };
            const newProducts = [...products, newProduct];
            syncProducts(newProducts);
            return newProduct;
        } else {
            throw new Error(json.error || 'Failed to create product');
        }
    };

    // Get product by id
    const get = (id) => products.find(product => product.id === id);

    // On mount: load from API, then sync to localStorage
    useEffect(() => {
        if (!dataLoaded) {
            fetch('/api/deliveries')
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data && Array.isArray(json.data.deliveries)) {
                        // Try to merge with localStorage names if present
                        const stored = localStorage.getItem('products');
                        let nameMap = {};
                        if (stored) {
                            try {
                                const arr = JSON.parse(stored);
                                arr.forEach(p => { if (p.name && p._id) nameMap[p._id] = p.name; });
                            } catch {}
                        }
                        const mapped = json.data.deliveries.map(d => ({ ...d, name: nameMap[d._id] || d.name || '' }));
                        syncProducts(mapped);
                    } else {
                        syncProducts([]);
                    }
                    setDataLoaded(true);
                })
                .catch(() => {
                    syncProducts([]);
                    setDataLoaded(true);
                });
        }
    }, [dataLoaded]);

    // Associate a commuter phone number with a product by id (frontend only)
    const setCommuter = (productId, phoneNumber) => {
        const newProducts = products.map(p =>
            p._id === productId ? { ...p, commuterPN: phoneNumber } : p
        );
        syncProducts(newProducts);
    };

    // Update the location (currApId, destApId) for a product by id (frontend only)
    const setLocation = (productId, currApId, destApId) => {
        const newProducts = products.map(p =>
            p._id === productId ? { ...p, currApId, destApId } : p
        );
        syncProducts(newProducts);
    };

    const value = {
        products,
        create,
        get,
        setCommuter,
        setLocation,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
"use client"
import { useState, useEffect } from 'react';
import { ShipperContext } from './ShipperContext';

export const ShipperProvider = ({ children }) => {
    const [shippers, setShippers] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);


    // Generate a unique id for each shipper
    const generateId = () => {
        if (shippers.length === 0) return 0;
        return Math.max(...shippers.map(s => s.id ?? 0)) + 1;
    };

    // Create shipper
    const create = (productId, name, email, pn) => {
        setShippers(prevShippers => {
            const newShipper = {
                id: prevShippers.length === 0 ? 0 : Math.max(...prevShippers.map(s => s.id ?? 0)) + 1,
                productId: productId ?? null,
                name,
                email,
                pn,
            };
            return [...prevShippers, newShipper];
        });
    };

    // Get shipper by id
    const get = (id) => {
        return shippers.find(shipper => shipper.id === id);
    };

    // TODO: Replace with API-based CRUD. For now, just initialize as empty or fetch from API if available.
    useEffect(() => {
        if (!dataLoaded) {
            // Example: fetch('/api/shippers').then(...)
            setDataLoaded(true);
        }
    }, [dataLoaded]);

    const value = {
        shippers,
        create,
        get,
    }

    return (
        <ShipperContext.Provider value={value}>
            {children}
        </ShipperContext.Provider>
    )
}
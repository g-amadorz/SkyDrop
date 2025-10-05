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
                productId,
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

    // Load shippers from localStorage on mount
    useEffect(() => {
        if (!dataLoaded) {
            const stored = localStorage.getItem('shippers');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setShippers(parsed);
                    } else {
                        setShippers([]);
                    }
                } catch (error) {
                    setShippers([]);
                }
            } else {
                setShippers([]);
            }
            setDataLoaded(true);
        }
    }, [dataLoaded]);

    // Save to localStorage when shippers changes (but only after initial load)
    useEffect(() => {
        if (dataLoaded) {
            localStorage.setItem('shippers', JSON.stringify(shippers));
        }
    }, [shippers, dataLoaded]);

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
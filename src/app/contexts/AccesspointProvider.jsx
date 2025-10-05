"use client";

import { useState, useEffect } from 'react';
import { AccesspointContext } from './AccesspointContext';

export const AccesspointProvider = ({ children }) => {
    const [accessPoints, setAccessPoints] = useState([]);   // Query from DB or localStorage
    const [dataLoaded, setDataLoaded] = useState(false);

    // Generate a unique id for each access point
    const generateId = () => {
        if (accessPoints.length === 0) return 0;
        return Math.max(...accessPoints.map(ap => ap.id ?? 0)) + 1;
    };

    // Accesspoint object
    const create = ({ name, numProducts = 0, nearestStation, lat, lng }) => {
        setAccessPoints(prev => {
            const newAp = {
                id: prev.length === 0 ? 0 : Math.max(...prev.map(ap => ap.id ?? 0)) + 1,
                name,
                nearestStation,
                lat,
                lng,
            };
            return [...prev, newAp];
        });
    };

    // Get access point by id
    const get = (id) => accessPoints.find(ap => ap.id === id);

    // Local Storage load (for testing, replace with API later)
    useEffect(() => {
        if (!dataLoaded) {
            const stored = localStorage.getItem('accessPoints');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setAccessPoints(parsed);
                    } else {
                        setAccessPoints([]);
                    }
                } catch (error) {
                    setAccessPoints([]);
                }
            } else {
                setAccessPoints([]);
            }
            setDataLoaded(true);
        }
    }, [dataLoaded]);

    // Save to localStorage when accessPoints changes (after initial load)
    useEffect(() => {
        if (dataLoaded) {
            localStorage.setItem('accessPoints', JSON.stringify(accessPoints));
        }
    }, [accessPoints, dataLoaded]);

    const value = {
        accessPoints,
        create,
        get,
    };

    return (
        <AccesspointContext.Provider value={value}>
            {children}
        </AccesspointContext.Provider>
    );
}
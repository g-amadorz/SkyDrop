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
    const create = async ({ name, numProducts = 0, nearestStation, lat, lng }) => {
        try {
            const response = await fetch('/api/access-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    nearestStation,
                    lat,
                    lng,
                }),
            });

            // Log the response for debugging
            const responseText = await response.text();
            console.log('API Response:', responseText);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    console.error('Non-JSON response:', responseText);
                    throw new Error('Server returned non-JSON response');
                }
                throw new Error(errorData.error || 'Failed to create access point');
            }

            const { data } = JSON.parse(responseText);
            
            setAccessPoints(prev => [...prev, data]);
            
            return data;
        } catch (error) {
            console.error('Error creating access point:', error);
            throw error;
        }
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
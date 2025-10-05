"use client";

import { useState, useEffect } from 'react';
import { AccesspointContext } from './AccesspointContext';

export const AccesspointProvider = ({ children }) => {
    const [accessPoints, setAccessPoints] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Generate a unique id for each access point
    const generateId = () => {
        if (accessPoints.length === 0) return 0;
        return Math.max(...accessPoints.map(ap => ap.id ?? 0)) + 1;
    };

    // Accesspoint object
    const create = async ({ name, numProducts = 0, nearestStation, lat, lng, stationId, account }) => {
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
                    stationId: stationId || nearestStation || '',
                    account: account || 'demo-account',
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

    // Load access points from backend API on mount
    useEffect(() => {
        if (!dataLoaded) {
            fetch('/api/access-points')
                .then(res => res.json())
                .then(json => {
                    if (json.success && Array.isArray(json.data)) {
                        setAccessPoints(json.data);
                    } else {
                        setAccessPoints([]);
                    }
                    setDataLoaded(true);
                })
                .catch(() => {
                    setAccessPoints([]);
                    setDataLoaded(true);
                });
        }
    }, [dataLoaded]);

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
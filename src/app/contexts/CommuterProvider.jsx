"use client"
//Gets commuters and can mutate information
import { useState, useEffect } from 'react';
import { CommuterContext } from "./CommuterContext";

export const CommuterProvider = ({ children }) => {
    const [commuters, setCommuters] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Fetch all commuters from API
    useEffect(() => {
        if (!dataLoaded) {
            fetch('/api/commuters')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setCommuters(data.data);
                    setDataLoaded(true);
                })
                .catch(() => setDataLoaded(true));
        }
    }, [dataLoaded]);

    // Create commuter via API
    const create = async (commuterData) => {
        try {
            const res = await fetch('/api/commuters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commuterData)
            });
            const data = await res.json();
            if (data.success) {
                setCommuters(prev => [...prev, data.data]);
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to create commuter');
            }
        } catch (error) {
            console.error('Error creating commuter:', error);
            throw error;
        }
    };

    // Get commuter by id from local state
    const get = (id) => commuters.find(commuter => commuter.id === id);

    const value = {
        commuters,
        create,
        get,
    };

    return (
        <CommuterContext.Provider value={value}>
            {children}
        </CommuterContext.Provider>
    );
}
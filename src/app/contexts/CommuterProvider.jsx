"use client"
//Gets commuters and can mutate information
import { useState, useEffect } from 'react';
import { CommuterContext } from "./CommuterContext";

export const CommuterProvider = ({ children }) => {
    const [commuters, setCommuters] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    class Commuter {
        id;             //Num from DB
        productId;      //Foreign key from DB
        firstName;
        lastName;
    }

        // Generate a unique id for each commuter
        const generateId = () => {
            if (commuters.length === 0) return 0;
            return Math.max(...commuters.map(c => c.id ?? 0)) + 1;
        };

        // Create commuter
        const create = (productId, firstName, lastName) => {
            setCommuters(prevCommuters => {
                const newCommuter = {
                    id: prevCommuters.length === 0 ? 0 : Math.max(...prevCommuters.map(c => c.id ?? 0)) + 1,
                    productId,
                    firstName,
                    lastName,
                };
                return [...prevCommuters, newCommuter];
            });
        };

        // Get commuter by id
        const get = (id) => {
            return commuters.find(commuter => commuter.id === id);
        };

        // TODO: Replace with API-based CRUD. For now, just initialize as empty or fetch from API if available.
        useEffect(() => {
            if (!dataLoaded) {
                // Example: fetch('/api/commuters').then(...)
                setDataLoaded(true);
            }
        }, [dataLoaded]);

    const value = {
        commuters,
            create,
            get,
    }

    return (
        <CommuterContext.Provider value={value}>
            {children}
        </CommuterContext.Provider>
    )
}
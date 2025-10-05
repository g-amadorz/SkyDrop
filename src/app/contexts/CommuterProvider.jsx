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

        // Load commuters from localStorage on mount
        useEffect(() => {
            if (!dataLoaded) {
                const stored = localStorage.getItem('commuters');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            setCommuters(parsed);
                        } else {
                            setCommuters([]);
                        }
                    } catch (error) {
                        setCommuters([]);
                    }
                } else {
                    setCommuters([]);
                }
                setDataLoaded(true);
            }
        }, [dataLoaded]);

        // Save to localStorage when commuters changes (but only after initial load)
        useEffect(() => {
            if (dataLoaded) {
                localStorage.setItem('commuters', JSON.stringify(commuters));
            }
        }, [commuters, dataLoaded]);

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
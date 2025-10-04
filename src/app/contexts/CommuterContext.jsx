"use client"
import { createContext, useContext } from 'react';

export const CommuterContext = createContext();

export const useCommuter = () => {
    const context = useContext(CommuterContext);
    if (!context) {
        throw new Error('useCommuter must be used within a CommuterProvider');
    }
    return context;
};
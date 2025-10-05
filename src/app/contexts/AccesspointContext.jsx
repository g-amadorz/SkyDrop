"use client";
import { createContext, useContext } from 'react';

export const AccesspointContext = createContext();

export const useAccesspoint = () => {
    const context = useContext(AccesspointContext);
    if (!context) {
        throw new Error('useAccesspoint must be used within a AccesspointProvider');
    }
    return context;
};
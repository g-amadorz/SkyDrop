import { createContext, useContext } from 'react';

export const ShipperContext = createContext();

export const useShipper = () => {
    const context = useContext(ShipperContext);
    if (!context) {
        throw new Error('useShipper must be used within a ShipperProvider');
    }
    return context;
};
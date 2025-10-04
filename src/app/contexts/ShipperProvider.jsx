"use client"
import { useState } from 'react';
import { ShipperContext } from './ShipperContext';

export const ShipperProvider = ({ children }) => {
    const [shippers, setShippers] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    class Shipper {
        id;             //Num from DB
        email;
        name;
        pn;
        productId;
    } 

    const value = {
        shippers,
    }

    return (
        <ShipperContext.Provider value={value}>
            {children}
        </ShipperContext.Provider>
    )
}
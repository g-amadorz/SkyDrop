import { useState } from 'react';
import { AccesspointContext } from './AccesspointContext';

export const AccesspointProvider = ({ children }) => {
    const [accessPoints, setAccessPoints] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    class Accesspoint {
        id;             //Num from DB
        numProducts;    
        nearestStation;
    } 

    const value = {
        accessPoints,
    }
    
    return (
        <AccesspointContext.Provider value={value}>
            {children}
        </AccesspointContext.Provider>
    )
}
//Gets commuters and can mutate information
import { useState } from 'react';
import CommuterContext from "./CommuterContext";

export const CommuterProvider = ({ children }) => {
    const [commuters, setCommuters] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    class Commuter {
        id;             //Num from DB
        productId;      //Foreign key from DB
        firstName;
        lastName;
    }
}
//Store, create, and edit products with live data
//Needs to be a context as many users should be able to access limited information
import { useState } from 'react';
import { ProductContext } from './ProductContext';

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    class Product {
        id;             //Num from DB
        currApId;       //Most recent access point ID
        commuterPN;     //Phone number of commuter
    } 

    const value = {
        products
    }

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    )
}
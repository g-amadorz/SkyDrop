//Store, create, and edit products with live data
//Needs to be a context as many users should be able to access limited information
"use client"
import { useState, useEffect } from 'react';
import { ProductContext } from './ProductContext';

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);   //Query from DB
    const [dataLoaded, setDataLoaded] = useState(false);

    // Generate a unique id for each product
    const generateId = () => {
        if (products.length === 0) return 0;
        return Math.max(...products.map(p => p.id ?? 0)) + 1;
    };

    // Simple product object
    const create = (currApId, destApId, commuterPN) => {
        setProducts(prevProducts => {
            const newProduct = {
                id: prevProducts.length === 0 ? 0 : Math.max(...prevProducts.map(p => p.id ?? 0)) + 1,
                currApId,
                destApId,
                commuterPN,
            };
            return [...prevProducts, newProduct];
        });
    } 

    // Product fetch object
    const get = (id) => {
        return products.find(product => product.id === id);
    }

    //Local Storage load    TODO: Remove when replacing with API call, just here for testing 
    useEffect(() => {
        if (!dataLoaded) {
            const stored = localStorage.getItem('products');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setProducts(parsed);
                    } else {
                        setProducts([]);
                    }
                } catch (error) {
                    setProducts([]);
                }
            } else {
                setProducts([]);
            }
            setDataLoaded(true);
        }
    }, [dataLoaded]);

    // Save to localStorage when products changes (but only after initial load)
    useEffect(() => {
        if (dataLoaded) {
            localStorage.setItem('products', JSON.stringify(products));
        }
    }, [products, dataLoaded]);

    const value = {
        products,
        create,
        get,
    }

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    )
}
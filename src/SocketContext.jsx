// SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('https://gossipgram-s7ik.onrender.com',{
            transports: ['websocket']
        }); // Replace with your server URL
        setSocket(newSocket);
        return () => newSocket.close(); // Clean up socket connection on unmount
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);

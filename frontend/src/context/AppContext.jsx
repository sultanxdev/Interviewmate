import React, { createContext } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const backend_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  return (
    <AppContext.Provider value={{ backend_URL }}>
      {children}
    </AppContext.Provider>
  );
};

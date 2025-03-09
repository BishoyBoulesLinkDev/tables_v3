"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

interface Hospital {
  id: string;
  text: string;
}

interface HospitalContextType {
  selectedHospitals: Hospital[];
  setSelectedHospitals: React.Dispatch<React.SetStateAction<Hospital[]>>;
  isClient: boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(
  undefined
);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [selectedHospitals, setSelectedHospitals] = useState<Hospital[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const setHospitals = useCallback(
    (newHospitals: Hospital[] | ((prev: Hospital[]) => Hospital[])) => {
      setSelectedHospitals(newHospitals);
    },
    []
  );

  const value = React.useMemo(
    () => ({
      selectedHospitals,
      setSelectedHospitals: setHospitals,
      isClient,
    }),
    [selectedHospitals, setHospitals, isClient]
  );

  if (!isClient) {
    return null;
  }

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospitals() {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error("useHospitals must be used within a HospitalProvider");
  }
  return context;
}

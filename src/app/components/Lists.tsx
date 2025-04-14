"use client";

import React, { useEffect, useState } from "react";
import { TreeSelect, Spin } from "antd";
import type { TreeSelectProps } from "antd";
import { useHospitals } from "../context/HospitalContext";
import { useMediaQuery } from "react-responsive";
import myCities from "../data/cities.json";
import myDatabase from "../data/database.json";

interface City {
  id: string;
  name: string;
}

interface HospitalNode {
  id: string;
  text: string;
  children?: HospitalNode[];
}

interface CityData {
  id: string;
  text: string;
  children?: HospitalNode[];
}

interface ListsProps {
  data?: HospitalNode[];
}

const transformCitiesToTreeData = (cities: City[]): TreeSelectProps["treeData"] => {
  return cities.map((city) => ({
    title: city.name,
    value: city.id,
    key: city.id,
    selectable: false, // Cities are not selectable
    isLeaf: false, // Indicate that cities have children
    children: [], // Start with empty children that will be loaded on demand
  }));
};

// Transform hospital nodes to TreeSelect format
const transformHospitalNodesToTreeData = (nodes: HospitalNode[]): TreeSelectProps["treeData"] => {
  return nodes.map((node) => ({
    title: node.text,
    value: node.id,
    key: node.id,
    selectable: true, // Institutes and hospitals are selectable
    isLeaf: !node.children || node.children.length === 0,
    children: node.children ? transformHospitalNodesToTreeData(node.children) : undefined,
  }));
};

// Keep the original transform function for backward compatibility
const transformToTreeData = (
  nodes: HospitalNode[],
  isTopLevel: boolean = true
): TreeSelectProps["treeData"] => {
  return nodes.map((node) => ({
    title: node.text,
    value: node.id,
    key: node.id,
    selectable: !isTopLevel, // Top-level nodes are not selectable
    children: node.children ? transformToTreeData(node.children, false) : undefined,
  }));
};

export const HospitalLists: React.FC<ListsProps> = ({ data }) => {
  const { selectedHospitals, setSelectedHospitals } = useHospitals();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // State to store the cities and loaded data
  const [cities, setCities] = useState<City[]>([]);
  const [treeData, setTreeData] = useState<TreeSelectProps["treeData"]>([]);
  const [loadedCityIds, setLoadedCityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch cities on initial load for dynamic loading
  useEffect(() => {
    setCities(myCities)
    const transformedData = transformCitiesToTreeData(cities);
    setTreeData(transformedData);
  }, []);

  // Function to load city data on demand
  const fetchCityData = async (cityId: string) => {
    if (loadedCityIds.has(cityId)) return;
    
    setLoading(true);
    try {
      const data = myDatabase
      const cityData = data.cities.find((city: CityData) => city.id === cityId);
      
      if (cityData && cityData.children) {
        // Update the tree data with the loaded city data
        setTreeData((prevTreeData) => {
          const newTreeData = [...prevTreeData];
          const cityIndex = newTreeData.findIndex((node) => node.key === cityId);
          
          if (cityIndex !== -1) {
            newTreeData[cityIndex].children = transformHospitalNodesToTreeData(cityData.children || []);
          }
          
          return newTreeData;
        });
        
        // Mark the city as loaded
        setLoadedCityIds((prev) => new Set([...prev, cityId]));
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle load data on expand
  const onLoadData = ({ id }: { id: string }): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (loadedCityIds.has(id)) {
        resolve();
        return;
      }
      
      fetchCityData(id).then(() => resolve());
    });
  };

  // Handle change in selection with dynamic loading approach
  const handleDynamicChange = (values: string[]) => {
    // Find the selected hospital objects based on their IDs
    const selectedHospitalObjects: HospitalNode[] = [];
    
    // Search through the loaded tree data to find the selected hospitals
    const findSelectedHospitals = (nodes: any[]) => {
      for (const node of nodes) {
        if (values.includes(node.value) && node.selectable) {
          selectedHospitalObjects.push({
            id: node.value,
            text: node.title as string,
          });
        }
        
        if (node.children) {
          findSelectedHospitals(node.children);
        }
      }
    };
    
    findSelectedHospitals(treeData);
    setSelectedHospitals(selectedHospitalObjects);
  };

  // Keep the original change handler for backward compatibility
  // const handleStaticChange = React.useCallback(
  //   (checked: string[] | { checked: string[]; halfChecked: string[] }) => {
  //     if (!data) return;
      
  //     const selectedValues = Array.isArray(checked) ? checked : checked.checked;
  //     const selectedHospitalObjects = selectedValues
  //       .map((id) => {
  //         for (const city of data) {
  //           for (const institute of city.children || []) {
  //             const hospital = institute.children?.find((h) => h.id === id);
  //             if (hospital) return hospital;
  //           }
  //         }
  //         return null;
  //       })
  //       .filter((hospital): hospital is HospitalNode => hospital !== null);

  //     setSelectedHospitals(selectedHospitalObjects);
  //   },
  //   [data, setSelectedHospitals]
  // );

  return (
    <div className={`p-4 sm:p-8 bg-gray-50 w-full ${isMobile ? "mb-4" : "mb-8"} relative`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <Spin size="large" />
        </div>
      )}
      <div className="w-full mx-auto">
        <TreeSelect
          treeData={cities}
          value={selectedHospitals.map((hospital) => hospital.id)}
          onChange={handleDynamicChange}
          treeCheckable={true}
          showSearch={true}
          placeholder="المستشفيات المتاحة"
          style={{
            width: "100%",
            height: isMobile ? "40px" : "50px",
          }}
          dropdownStyle={{
            maxHeight: isMobile ? 300 : 400,
            overflow: "auto",
            fontSize: isMobile ? "14px" : "16px",
          }}
          loadData={onLoadData}
          allowClear
          multiple
          treeDefaultExpandAll={false}
          direction="rtl"
          className="custom-tree-select"
          treeNodeFilterProp="title"
        />
      </div>
    </div>
  );
};

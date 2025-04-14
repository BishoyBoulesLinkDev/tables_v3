"use client";

import React, { useEffect, useState } from "react";
import { TreeSelect, Spin } from "antd";
import type { TreeSelectProps } from "antd";
import { useHospitals } from "../context/HospitalContext";
import { useMediaQuery } from "react-responsive";

interface City {
  id: string;
  name: string;
}

interface HospitalNode {
  id: string;
  text: string;
  children?: HospitalNode[];
}

const transformCitiesToTreeData = (cities: City[]): TreeSelectProps["treeData"] => {
  return cities.map((city) => ({
    title: city.name,
    value: city.id,
    key: city.id,
    selectable: false,
    isLeaf: false, // Mark as not a leaf node to indicate it has children
    children: [], // Start with empty children array that will be populated on demand
  }));
};

const transformHospitalNodesToTreeData = (nodes: HospitalNode[]): TreeSelectProps["treeData"] => {
  return nodes.map((node) => ({
    title: node.text,
    value: node.id,
    key: node.id,
    selectable: true,
    isLeaf: !node.children || node.children.length === 0,
    children: node.children ? transformHospitalNodesToTreeData(node.children) : undefined,
  }));
};

export const HospitalLists = () => {
  const { selectedHospitals, setSelectedHospitals } = useHospitals();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [cities, setCities] = useState<City[]>([]);
  const [treeData, setTreeData] = useState<TreeSelectProps["treeData"]>([]);
  const [loadedCityIds, setLoadedCityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/data/cities.json');
        const myCities = await response.json();
        setCities(myCities);
        const transformedData = transformCitiesToTreeData(myCities);
        setTreeData(transformedData);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    fetchCities();  
  }, []);

  const fetchCityData = async (cityId: string) => {
    console.log('fetchCityData called with cityId:', cityId);
    
    // If this city's data has already been loaded, no need to fetch again
    if (loadedCityIds.has(cityId)) {
      console.log('City data already loaded for:', cityId);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Cities available in state:', cities);
      console.log('Fetching data for city ID:', cityId);
      
      // Get the city from our local state
      const cityObj = cities.find(city => city.id === cityId);
      console.log('Found city object:', cityObj);
      
      if (!cityObj) {
        console.error("City not found in local state:", cityId);
        return;
      }
      
      // Determine which JSON file to load based on city ID
      let cityJsonFile;
      switch(cityId) {
        case "1":
          cityJsonFile = '/data/cairo.json';
          break;
        case "2":
          cityJsonFile = '/data/alex.json';
          break;
        case "22":
          cityJsonFile = '/data/luxor.json';
          break;
        default:
          console.error("No matching JSON file for city ID:", cityId);
          return;
      }
      
      console.log(`Loading data from ${cityJsonFile} for city: ${cityObj.name}`);
      
      // Fetch the data from the specific city JSON file
      const response = await fetch(cityJsonFile);
      const cityData = await response.json();
      
      if (cityData && cityData.children) {
        console.log('City children found:', cityData.children.length);
        // Update the tree data with the loaded city data
        setTreeData((prevTreeData) => {
          if (!prevTreeData) return []; // Safety check for undefined treeData
          
          const newTreeData = [...prevTreeData];
          const cityIndex = newTreeData.findIndex((node) => node.key === cityId);
          
          if (cityIndex !== -1) {
            console.log('Updating city at index:', cityIndex);
            const transformedChildren = transformHospitalNodesToTreeData(cityData.children || []);
            console.log('Transformed children:', transformedChildren);
            newTreeData[cityIndex].children = transformedChildren;
            
            // Ensure the city itself remains unselectable even after loading content
            newTreeData[cityIndex].selectable = false;
          } else {
            console.error('City index not found in tree data for ID:', cityId);
          }
          
          return newTreeData;
        });
        
        // Mark the city as loaded
        setLoadedCityIds((prev) => new Set([...prev, cityId]));
      } else {
        console.error('No city data or children found for:', cityId);
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    } finally {
      setLoading(false);
    }
  };

  // This is the function that gets called when a node is expanded in the TreeSelect
  const onLoadData = (node: any): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Extract the city ID from the node
      console.log('TreeSelect loadData called with node:', node);
      const nodeId = typeof node.key !== 'undefined' ? node.key : 
                    (node.value ? node.value : undefined);
      
      console.log('Extracted node ID:', nodeId);
      
      if (!nodeId) {
        console.error('Could not extract city ID from node');
        resolve();
        return;
      }
      
      // Fetch the city data
      fetchCityData(String(nodeId))
        .then(() => {
          console.log('Successfully loaded data for city ID:', nodeId);
          resolve();
        })
        .catch(error => {
          console.error('Error loading city data:', error);
          resolve(); // Still resolve to prevent hanging UI
        });
    });
  };

  // Handle change in selection with dynamic loading approach
  const handleDynamicChange = (values: string[]) => {
    // Find the selected hospital objects based on their IDs
    const selectedHospitalObjects: HospitalNode[] = [];
    
    // Search through the loaded tree data to find the selected hospitals
    const findSelectedHospitals = (nodes: any[] | undefined) => {
      if (!nodes) return;
      for (const node of nodes) {
        // Only include nodes that are explicitly selectable and not cities
        if (values.includes(node.value) && node.selectable === true) {
          console.log('Selected node:', node.title, node.value);
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
    
    if (treeData) {
      findSelectedHospitals(treeData);
    }
    setSelectedHospitals(selectedHospitalObjects);
  };

  return (
    <div className={`p-4 sm:p-8 bg-gray-50 w-full ${isMobile ? "mb-4" : "mb-8"} relative`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <Spin size="large" />
        </div>
      )}
      <div className="w-full mx-auto">
        <TreeSelect
          treeData={treeData || []}
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
          labelInValue={false}
          direction="rtl"
          className="custom-tree-select"
          treeNodeFilterProp="title"
        />
      </div>
    </div>
  );
};

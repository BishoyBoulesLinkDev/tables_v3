"use client";

import React from "react";
import { TreeSelect } from "antd";
import type { TreeSelectProps } from "antd";
import { useHospitals } from "../context/HospitalContext";

interface HospitalNode {
  id: string;
  text: string;
  children?: HospitalNode[];
}

interface ListsProps {
  data: HospitalNode[];
}

export const HospitalLists: React.FC<ListsProps> = ({ data }) => {
  const { selectedHospitals, setSelectedHospitals } = useHospitals();

  const transformToTreeData = (
    nodes: HospitalNode[]
  ): TreeSelectProps["treeData"] => {
    return nodes.map((node) => ({
      title: node.text,
      value: node.id,
      key: node.id,
      children: node.children ? transformToTreeData(node.children) : undefined,
    }));
  };

  const treeData = transformToTreeData(data);

  const handleChange = (selectedValues: string[]) => {
    // Convert selected IDs to hospital objects
    const selectedHospitalObjects = selectedValues
      .map((id) => {
        for (const city of data) {
          for (const institute of city.children) {
            const hospital = institute.children.find((h) => h.id === id);
            if (hospital) return hospital;
          }
        }
        return null;
      })
      .filter((hospital): hospital is HospitalNode => hospital !== null);

    setSelectedHospitals(selectedHospitalObjects);
  };

  return (
    <div className="p-8 bg-gray-50 w-full">
      <div className="w-full mx-auto">
        <TreeSelect
          treeData={treeData}
          value={selectedHospitals.map((hospital) => hospital.id)} // Convert Hospital objects to IDs
          onChange={handleChange}
          treeCheckable={true}
          showSearch={true}
          placeholder="المستشفيات المتاحة"
          style={{ width: "100%" }}
          dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
          allowClear
          multiple
          treeDefaultExpandAll
          direction="rtl"
          className="custom-tree-select"
        />
      </div>
    </div>
  );
};

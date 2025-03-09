"use client";

import React from "react";
import { ConfigProvider, TreeSelect } from "antd";
import type { TreeSelectProps } from "antd";
import { useHospitals } from "../context/HospitalContext";
import { useMediaQuery } from "react-responsive";

interface HospitalNode {
  id: string;
  text: string;
  children?: HospitalNode[];
}

interface ListsProps {
  data: HospitalNode[];
}

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

export const HospitalLists: React.FC<ListsProps> = ({ data }) => {
  const { selectedHospitals, setSelectedHospitals } = useHospitals();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const treeData = React.useMemo(() => transformToTreeData(data), [data]);

  const handleChange = React.useCallback(
    (checked: string[] | { checked: string[]; halfChecked: string[] }) => {
      const selectedValues = Array.isArray(checked) ? checked : checked.checked;
      const selectedHospitalObjects = selectedValues
        .map((id) => {
          for (const city of data) {
            for (const institute of city.children || []) {
              const hospital = institute.children?.find((h) => h.id === id);
              if (hospital) return hospital;
            }
          }
          return null;
        })
        .filter((hospital): hospital is HospitalNode => hospital !== null);

      setSelectedHospitals(selectedHospitalObjects);
    },
    [data, setSelectedHospitals]
  );

  return (
    <div
      className={`p-4 sm:p-8 bg-gray-50 w-full ${isMobile ? "mb-4" : "mb-8"}`}
    >
      <div className="w-full mx-auto">
        
        <TreeSelect
          treeData={treeData}
          value={selectedHospitals.map((hospital) => hospital.id)}
          onChange={handleChange}
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
          allowClear
          multiple
          treeDefaultExpandAll
          direction="rtl"
          className="custom-tree-select"
          treeNodeFilterProp="title"
        />
      </div>
    </div>
  );
};

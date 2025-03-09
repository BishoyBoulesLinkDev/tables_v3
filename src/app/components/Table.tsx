"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Table, Input } from "antd";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import debounce from "lodash/debounce";
import data from "../data/database.json";
import { DraggableBodyRow } from "./DraggableBodyRow";
import { useHospitals } from "../context/HospitalContext";
import { useMediaQuery } from "react-responsive";

interface Hospital {
  id: string;
  text: string;
}

export default function Tables() {
  const { selectedHospitals, setSelectedHospitals, isClient } = useHospitals();
  const [originalOrder, setOriginalOrder] = useState<Hospital[]>([]);
  const [manualOrder, setManualOrder] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (isClient) {
      setOriginalOrder(selectedHospitals);
    }
  }, [selectedHospitals, isClient]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const debouncedUpdate = debounce(
    (record: Hospital, newValue: number, origOrder: Hospital[]) => {
      const newIndex = newValue - 1;
      const currentIndex = origOrder.findIndex((h) => h.id === record.id);

      const newArray = [...origOrder];
      const [removed] = newArray.splice(currentIndex, 1);
      newArray.splice(newIndex, 0, removed);

      setOriginalOrder(newArray);
      setSelectedHospitals(newArray);
      setManualOrder((prev) => updateOrderNumbers(record.id, newValue, prev));
    },
    300
  );

  const debouncedUpdateOrder = useCallback(
    (record: Hospital, newValue: number) => {
      debouncedUpdate(record, newValue, originalOrder);
    },
    [debouncedUpdate, originalOrder]
  );

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (active.id !== over?.id) {
        const activeIndex = selectedHospitals.findIndex(
          (h) => h.id === active.id
        );
        const overIndex = selectedHospitals.findIndex((h) => h.id === over?.id);

        const newOrder = arrayMove(
          [...selectedHospitals],
          activeIndex,
          overIndex
        );

        Promise.resolve().then(() => {
          setOriginalOrder(newOrder);
          setSelectedHospitals(newOrder);
          setManualOrder((prev) => {
            const newManualOrder = { ...prev };
            newManualOrder[active.id as string] = overIndex + 1;
            return newManualOrder;
          });
        });
      }
    },
    [selectedHospitals]
  );

  const updateOrderNumbers = (
    hospitalId: string,
    newValue: number,
    currentManualOrder: { [key: string]: number }
  ) => {
    const newOrder = { ...currentManualOrder };

    for (const key of Object.keys(newOrder)) {
      if (newOrder[key] === newValue) {
        delete newOrder[key];
      }
    }

    newOrder[hospitalId] = newValue;
    return newOrder;
  };

  const getInstitute = (hospitalId: string) => {
    for (const city of data.cities) {
      for (const institute of city.children) {
        if (institute.children.some((h) => h.id === hospitalId)) {
          return institute.text;
        }
      }
    }
    return "";
  };

  const getCity = (hospitalId: string) => {
    for (const city of data.cities) {
      if (
        city.children.some((inst) =>
          inst.children.some((h) => h.id === hospitalId)
        )
      ) {
        return city.text;
      }
    }
    return "";
  };

  const handleRemove = useCallback(
    (hospitalId: string) => {
      const newSelectedHospitals = selectedHospitals.filter(
        (hospital) => hospital.id !== hospitalId
      );

      Promise.resolve().then(() => {
        setSelectedHospitals(newSelectedHospitals);
        setOriginalOrder(newSelectedHospitals);
        setManualOrder((prev) => {
          const newOrder = { ...prev };
          delete newOrder[hospitalId];
          return newOrder;
        });
      });
    },
    [selectedHospitals]
  );

  const isMobile = useMediaQuery({ maxWidth: 768 });

  const columns = [
    {
      title: "إجراءات",
      dataIndex: "remove",
      key: "remove",
      width: isMobile ? "20%" : "10%",
      render: (_: unknown, record: Hospital) => (
        <button
          type="button"
          className="cursor-pointer m-0 p-3 text-xl font-extrabold text-red-600 hover:text-red-300"
          onClick={() => handleRemove(record.id)}
        >
          X
        </button>
      ),
    },
    {
      title: "الترتيب",
      dataIndex: "sort",
      key: "sort",
      width: isMobile ? "25%" : "15%",
      sorter: (a: Hospital, b: Hospital) => {
        const getOrder = (record: Hospital) => {
          return (
            manualOrder[record.id] ||
            originalOrder.findIndex((h) => h.id === record.id) + 1
          );
        };
        return getOrder(a) - getOrder(b);
      },
      render: (_: unknown, record: Hospital) => {
        const displayIndex =
          manualOrder[record.id] ||
          originalOrder.findIndex((h) => h.id === record.id) + 1;

        return (
          <Input
            type="number"
            min={1}
            max={selectedHospitals.length}
            value={displayIndex}
            placeholder="الترتيب"
            style={{ width: "60px" }}
            onChange={(e) => {
              const newValue = Number.parseInt(e.target.value);
              if (
                !Number.isNaN(newValue) &&
                newValue >= 1 &&
                newValue <= selectedHospitals.length
              ) {
                debouncedUpdateOrder(record, newValue);
              }
            }}
          />
        );
      },
    },
    {
      title: "المستشفى",
      dataIndex: "text",
      key: "hospital",
      width: isMobile ? "55%" : "35%",
      ellipsis: true,
    },
    ...(!isMobile
      ? [
          {
            title: "الإدارة",
            dataIndex: "institute",
            key: "institute",
            width: "25%",
            ellipsis: true,
            sorter: (a: Hospital, b: Hospital) => {
              return getInstitute(a.id).localeCompare(getInstitute(b.id));
            },
            render: (_: unknown, record: Hospital) => getInstitute(record.id),
          },
          {
            title: "المديرية",
            dataIndex: "city",
            key: "city",
            width: "25%",
            ellipsis: true,
            sorter: (a: Hospital, b: Hospital) => {
              return getCity(a.id).localeCompare(getCity(b.id));
            },
            render: (_: unknown, record: Hospital) => getCity(record.id),
          },
        ]
      : []),
  ];

  if (!isClient) {
    return (
      <div className="w-full h-32 bg-gray-50 animate-pulse rounded-md">
        <div className="h-full flex items-center justify-center text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main className="table">
      <section>
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={selectedHospitals.map((h) => h.id)}>
            <Table
              components={{
                body: {
                  row: DraggableBodyRow,
                },
              }}
              dataSource={selectedHospitals.map((hospital) => ({
                ...hospital,
                key: hospital.id,
              }))}
              columns={columns}
              pagination={false}
              scroll={{ y: 400 }}
            />
          </SortableContext>
        </DndContext>
      </section>
    </main>
  );
}

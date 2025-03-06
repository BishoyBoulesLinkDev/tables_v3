"use client";

import { useState, useCallback, useEffect } from "react";
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

interface Hospital {
  id: string;
  text: string;
}

export default function Tables() {
  const { selectedHospitals, setSelectedHospitals, isClient } = useHospitals();

  const [originalOrder, setOriginalOrder] = useState<Hospital[]>(() => []);

  const [manualOrder, setManualOrder] = useState<{ [key: string]: number }>({});
  useEffect(() => {
    setOriginalOrder(selectedHospitals);
  }, [selectedHospitals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );
  const debouncedUpdateOrder = useCallback(
    debounce((record: Hospital, newValue: number) => {
      const newIndex = newValue - 1;
      const currentIndex = originalOrder.findIndex((h) => h.id === record.id);

      setManualOrder((prev) => {
        return updateOrderNumbers(record.id, newValue, prev);
      });

      const newArray = [...originalOrder];
      const [removed] = newArray.splice(currentIndex, 1);
      newArray.splice(newIndex, 0, removed);
      setOriginalOrder(newArray);
      setSelectedHospitals(newArray);
    }, 300),
    [originalOrder, setSelectedHospitals]
  );

  if (!isClient) {
    return null;
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSelectedHospitals((previous) => {
        const activeIndex = previous.findIndex((h) => h.id === active.id);
        const overIndex = previous.findIndex((h) => h.id === over?.id);

        setManualOrder((prev) => {
          const newOrder = { ...prev };
          newOrder[active.id as string] = overIndex + 1;
          return newOrder;
        });

        const newOrder = arrayMove(previous, activeIndex, overIndex);
        setOriginalOrder(newOrder);

        return newOrder;
      });
    }
  };

  const updateOrderNumbers = (
    hospitalId: string,
    newValue: number,
    currentManualOrder: { [key: string]: number }
  ) => {
    const newOrder = { ...currentManualOrder };

    Object.keys(newOrder).forEach((key) => {
      if (newOrder[key] === newValue) {
        delete newOrder[key];
      }
    });

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

  const columns = [
    {
      title: "الترتيب",
      dataIndex: "sort",
      key: "sort",
      width: "15%",
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
              const newValue = parseInt(e.target.value);
              if (
                !isNaN(newValue) &&
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
      width: "35%",
      ellipsis: true,
    },
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
  ];

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

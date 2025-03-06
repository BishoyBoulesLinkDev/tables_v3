import React, { useState } from 'react';
import { NumberInput, Checkbox } from '@patternfly/react-core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableHospitalProps {
  id: string;
  text: string;
  index: number;
  onOrderChange: (id: string, newPosition: number) => void;
  totalItems: number;
  isChecked: boolean;
  onCheck: (id: string, checked: boolean) => void;
}

export const DraggableHospital: React.FC<DraggableHospitalProps> = ({
  id,
  text,
  index,
  onOrderChange,
  totalItems,
  isChecked,
  onCheck,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNumberChange = (value: number) => {
    if (value >= 1 && value <= totalItems) {
      onOrderChange(id, value - 1);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-white border rounded-md mb-2 cursor-move hover:bg-gray-50"
    >
      <Checkbox
        id={`checkbox-${id}`}
        isChecked={isChecked}
        onChange={(_event, checked) => onCheck(id, checked)}
        onClick={(e) => e.stopPropagation()}
        className="mr-2"
      />
      <div
        className="w-8 h-8 relative"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <NumberInput
            className="absolute inset-0 w-full h-full text-center"
            min={1}
            max={totalItems}
            value={index + 1}
            onChange={(event) => {
              const value = parseInt((event.target as HTMLInputElement).value, 10);
              if (!isNaN(value)) {
                handleNumberChange(value);
              }
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(value)) {
                  handleNumberChange(value);
                }
              } else if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-100 rounded-full cursor-pointer hover:bg-blue-200">
            <span className="text-blue-700 font-semibold">{index + 1}</span>
          </div>
        )}
      </div>
      <span>{text}</span>
    </div>
  );
};

'use client';

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type TransformLike = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

export type SortableItemRenderProps = {
  dragHandleProps: HTMLAttributes<HTMLButtonElement> & {
    ref: (element: HTMLButtonElement | null) => void;
  };
  isDragging: boolean;
};

export function SortableList<T>({
  items,
  getId,
  onReorder,
  className = 'space-y-3',
  children,
}: {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  className?: string;
  children: (item: T, index: number, props: SortableItemRenderProps) => ReactNode;
}) {
  const ids = items.map(getId);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)}>
              {(props) => children(item, index, props)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (props: SortableItemRenderProps) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: transformToCss(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  const dragHandleProps: SortableItemRenderProps['dragHandleProps'] = {
    ref: setActivatorNodeRef,
    ...attributes,
    ...listeners,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-10 opacity-90' : undefined}
    >
      {children({ dragHandleProps, isDragging })}
    </li>
  );
}

function transformToCss(transform: TransformLike | null): string | undefined {
  if (!transform) return undefined;
  const { x, y, scaleX, scaleY } = transform;
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
}

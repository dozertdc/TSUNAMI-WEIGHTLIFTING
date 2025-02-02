'use client';

import { DragDropContext } from '@hello-pangea/dnd';

export function DragDropContextWrapper({ children, onDragEnd }: { 
  children: React.ReactNode;
  onDragEnd: (result: any) => void;
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
} 
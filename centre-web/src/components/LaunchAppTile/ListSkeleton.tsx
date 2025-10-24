import { Grid } from "@mui/material";
import { LaunchAppTileSkeleton } from "./TileSkeleton";
import { DocumentSearchSkeleton } from "../DocumentSearch/Skeleton";
import { PageContainer } from "../Shared/PageGrid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

type SortableSkeletonItemProps = {
  id: number;
};

const SortableSkeletonItem = ({ id }: SortableSkeletonItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LaunchAppTileSkeleton />
    </div>
  );
};

export const LaunchAppListSkeleton = ({ count = 10 }: { count?: number }) => {
  const [skeletonItems, setSkeletonItems] = useState(
    Array.from({ length: count }, (_, idx) => idx)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSkeletonItems((items) => {
        const oldIndex = items.indexOf(active.id as number);
        const newIndex = items.indexOf(over.id as number);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DocumentSearchSkeleton />
        </Grid>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={skeletonItems} strategy={rectSortingStrategy}>
            {skeletonItems.map((idx) => (
              <Grid item key={idx}>
                <SortableSkeletonItem id={idx} />
              </Grid>
            ))}
          </SortableContext>
        </DndContext>
      </Grid>
    </PageContainer>
  );
};

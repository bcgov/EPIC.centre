import { EpicApp } from "@/models/EpicApp";
import { Grid } from "@mui/material";
import { LaunchAppTile } from ".";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { useUpdateSortOrder } from "@/hooks/api/useUserApplications";

type ListProps = {
  items: EpicApp[];
};

type SortableItemProps = {
  item: EpicApp;
};

const SortableItem = ({ item }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      aria-grabbed={isDragging}
      aria-label={`Application card: ${item.title}`}
      tabIndex={0}
    >
      <LaunchAppTile
        item={item}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
};

export const List = ({ items }: ListProps) => {
  const sortItems = (items: EpicApp[]) => {
    return items.slice().sort((a, b) => a.user.sort_order - b.user.sort_order);
  };
  const [sortedItems, setSortedItems] = useState(sortItems(items));
  const [activeId, setActiveId] = useState<number | null>(null);
  const { mutate: updateSortOrder } = useUpdateSortOrder({
    retry: false,
  });

  useEffect(() => {
    setSortedItems(sortItems(items));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(sortedItems, oldIndex, newIndex);

      setSortedItems(newItems);
      updateSortOrder(newItems.map((item) => item.id));
    }
    setActiveId(null);
  };

  const activeItem = sortedItems.find((item) => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortedItems} strategy={rectSortingStrategy}>
        <Grid container rowSpacing={4} spacing={2} direction={"row"} sx={{ maxWidth: "1090px" }}>
          {sortedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <SortableItem item={item} />
            </Grid>
          ))}
        </Grid>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div
            style={{
              boxShadow: BCDesignTokens.surfaceShadowLarge,
              borderRadius: "4px",
            }}
          >
            <LaunchAppTile item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

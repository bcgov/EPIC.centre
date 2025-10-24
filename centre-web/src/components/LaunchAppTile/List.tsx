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
import { useState, useEffect } from "react";
import { useGetUserSettings, useUpdateCardPositions } from "@/hooks/api/useUserSettings";
import { BCDesignTokens } from "epic.theme";

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
      <LaunchAppTile item={item} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
};

export const List = ({ items }: ListProps) => {
  const [sortedItems, setSortedItems] = useState(items);
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data: userSettings } = useGetUserSettings();
  const updateCardPositions = useUpdateCardPositions();

  useEffect(() => {
    // Apply saved card positions if available
    if (userSettings?.card_positions && Object.keys(userSettings.card_positions).length > 0) {
      const sorted = [...items].sort((a, b) => {
        const posA = userSettings.card_positions[a.id] ?? items.length;
        const posB = userSettings.card_positions[b.id] ?? items.length;
        return posA - posB;
      });
      setSortedItems(sorted);
    } else {
      setSortedItems(items);
    }
  }, [items, userSettings]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save card positions to backend with retry logic
        const cardPositions: Record<string, number> = {};
        newItems.forEach((item, index) => {
          cardPositions[item.id] = index;
        });
        
        saveCardPositionsWithRetry(cardPositions, 3);

        return newItems;
      });
    }
    setActiveId(null);
  };

  const saveCardPositionsWithRetry = async (cardPositions: Record<string, number>, maxRetries: number) => {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        await updateCardPositions.mutateAsync(cardPositions);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          // TODO: Show toast notification
        }
      }
    }
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
        <Grid container rowSpacing={4} spacing={2} direction={"row"}>
          {sortedItems.map((item) => (
            <Grid item key={item.id}>
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

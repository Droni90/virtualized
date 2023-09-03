import React, { memo, useCallback, useRef, useState } from "react";
import s from "./List.module.css";
import { UseVirtualized } from "../Virtualized/useVirtualized";
import { faker } from "@faker-js/faker";

interface Item {
  id: string;
  text: string;
}

const items: Item[] = new Array(1000).fill(0).map((_, index) => {
  return {
    id: Math.random().toString(36).slice(2),
    text: faker.lorem.text(),
  };
});

export const List = memo(() => {
  const [itemsArr, setItemsArr] = useState<Item[]>(items);

  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const containerHeight = 600;

  const { virtualizedItems, totalHeight, measureElement } = UseVirtualized({
    estimateItemHeight: useCallback(() => 40, []),
    scrollElementRef,
    data: itemsArr,
    getItemKey: useCallback((index) => itemsArr[index].id, [itemsArr]),
  });

  return (
    <div
      ref={scrollElementRef}
      className={s.List}
      style={{ height: containerHeight }}
    >
      <button onClick={() => setItemsArr((prev) => prev.slice().reverse())}>
        Reverce
      </button>
      <div
        style={{
          height: totalHeight,
        }}
      >
        {virtualizedItems.map((i) => {
          const item = itemsArr[i.index];

          return (
            <div
              ref={measureElement}
              data-index={i.index}
              style={{
                position: "absolute",
                top: 0,
                transform: `translateY(${i.offsetTop}px)`,
              }}
              key={item.id}
            >
              {i.index} - {item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
});

List.displayName = "List";

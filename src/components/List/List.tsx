import React, { memo, useRef, useState } from "react";
import s from "./List.module.css";
import { SimpleVirtualized } from "../SimpleVirtualized/SimpleVirtualized";

interface Item {
  id: string;
  text: string;
}

const items: Item[] = new Array(1000).fill(0).map((_, index) => {
  return {
    id: Math.random().toString(36).slice(2),
    text: index.toString(),
  };
});

export const List = memo(() => {
  const [itemsArr, setItemsArr] = useState<Item[]>(items);

  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const itemHeight = 40;
  const containerHeight = 600;

  const { getItemStyles, virtualizedItems, isScrolling } = SimpleVirtualized({
    containerHeight,
    itemHeight,
    scrollElementRef,
    data: itemsArr,
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
          height: itemHeight * itemsArr.length,
        }}
      >
        {virtualizedItems.map((i) => {
          const item = itemsArr[i.index];
          return (
            <div
              className={s.List__item}
              style={getItemStyles(i)}
              key={item.id}
            >
              {isScrolling ? "Loading..." : item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
});

List.displayName = "List";

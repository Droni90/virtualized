import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Key = string | number;

export interface VirtualizedItem {
  index: number;
  offsetTop: number;
  height: number;
  key: Key;
}

export interface UseVirtualizedProps {
  scrollElementRef: RefObject<HTMLDivElement>;
  scrollingDelay?: number;
  itemHeight?: (index: number) => number;
  overscan?: number;
  estimateItemHeight?: (index: number) => number;
  getItemKey: (index: number) => Key;
  data: any[];
}
export const UseVirtualized = (props: UseVirtualizedProps) => {
  const {
    scrollElementRef,
    scrollingDelay = 100,
    data,
    overscan = 3,
    itemHeight,
    getItemKey,
    estimateItemHeight,
  } = props;

  const [measurementCache, setMeasurementCache] = useState<Record<Key, number>>(
    {},
  );
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      setScrollTop(scrollElement?.scrollTop);
    };

    handleScroll();

    scrollElement.addEventListener("scroll", handleScroll);

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [scrollElementRef]);

  useLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const height =
        entry.borderBoxSize[0].blockSize ??
        entry.target.getBoundingClientRect().height;
      setContainerHeight(height);
    });

    observer.observe(scrollElement);

    return () => observer.disconnect();
  }, [scrollElementRef]);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }
    const handleScroll = () => {
      setIsScrolling(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };

    scrollElement.addEventListener("scroll", handleScroll);

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scrollElementRef, scrollingDelay]);

  const [virtualizedItems, startIndex, endIndex, allItems, totalHeight] =
    useMemo(() => {
      const getItemHeight = (index: number) => {
        if (itemHeight) {
          return itemHeight(index);
        }

        const key = getItemKey(index);
        if (typeof measurementCache[key] === "number") {
          return measurementCache[key]!;
        }

        return estimateItemHeight!(index);
      };

      const startRange = scrollTop;
      const endRange = scrollTop + containerHeight;

      let totalHeight = 0;
      let startIndex = -1;
      let endIndex = -1;

      const allItems = Array(data.length);

      for (let index = 0; index < data.length; index++) {
        const key = getItemKey(index);
        const row = {
          key,
          index: index,
          height: getItemHeight(index),
          offsetTop: totalHeight,
        };

        totalHeight += row.height;
        allItems[index] = row;

        if (startIndex === -1 && row.offsetTop + row.height > startRange) {
          startIndex = Math.max(0, index - overscan);
        }

        if (endIndex === -1 && row.offsetTop + row.height + 20 >= endRange) {
          endIndex = Math.min(data.length - 1, index + overscan);
        }
      }

      const virtualizedItems: VirtualizedItem[] = allItems.slice(
        startIndex,
        endIndex + 1,
      );

      return [virtualizedItems, startIndex, endIndex, allItems, totalHeight];
    }, [
      containerHeight,
      data.length,
      estimateItemHeight,
      itemHeight,
      getItemKey,
      measurementCache,
      overscan,
      scrollTop,
    ]);

  const measureElement = useCallback(
    (element: Element | null) => {
      if (!element) {
        return;
      }
      const indexAttribute = element.getAttribute("data-index") || "";
      const index = parseInt(indexAttribute, 10);

      if (Number.isNaN(index)) {
        console.error(
          "dynamic elements must have a valid 'data-index' attribute",
        );
        return;
      }

      const size = element.getBoundingClientRect();
      const key = getItemKey(index);
      setMeasurementCache((prev) => ({ ...prev, [key]: size.height }));
    },
    [getItemKey],
  );

  return {
    virtualizedItems,
    startIndex,
    endIndex,
    isScrolling,
    totalHeight,
    measureElement,
  };
};

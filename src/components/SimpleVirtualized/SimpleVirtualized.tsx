import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
export interface VirtualizedItem {
  index: number;
  offset: number;
}
export interface SimpleVirtualizedProps {
  scrollElementRef: RefObject<HTMLDivElement>;
  scrollingDelay?: number;
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
  data: any[];
}
export const SimpleVirtualized = (props: SimpleVirtualizedProps) => {
  const {
    scrollElementRef,
    scrollingDelay = 100,
    data,
    overscan = 3,
    itemHeight,
    containerHeight,
  } = props;

  const [scrollTop, setScrollTop] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getItemStyles = useCallback(
    (item: VirtualizedItem): CSSProperties => ({
      minHeight: itemHeight,
      position: "absolute",
      top: 0,
      transform: `translateY(${item.offset}px)`,
    }),
    [itemHeight],
  );

  useLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      const handleScroll = () => {
        setScrollTop(scrollElement?.scrollTop);
      };

      scrollElement.addEventListener("scroll", handleScroll);

      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
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

  const [virtualizedItems, startIndex, endIndex] = useMemo(() => {
    const startRange = scrollTop;
    const endRange = scrollTop + containerHeight;

    let startIndex = Math.floor(startRange / itemHeight);
    let endIndex = Math.ceil(endRange / itemHeight);

    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(data.length - 1, endIndex + overscan);

    const virtualizedItems: VirtualizedItem[] = [];
    data.forEach((_, index) => {
      virtualizedItems.push({
        index,
        offset: index * itemHeight,
      });
    });

    return [
      virtualizedItems.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
    ];
  }, [containerHeight, data, itemHeight, overscan, scrollTop]);

  return { virtualizedItems, startIndex, endIndex, isScrolling, getItemStyles };
};

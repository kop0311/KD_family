'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Calculate item heights
  const itemHeights = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return new Array(items.length).fill(itemHeight);
    }
    return items.map((item, index) => itemHeight(index, item));
  }, [items, itemHeight]);

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    let totalHeight = 0;
    const positions: number[] = [];

    for (let i = 0; i < itemHeights.length; i++) {
      positions.push(totalHeight);
      totalHeight += itemHeights[i];
    }

    return { totalHeight, itemPositions: positions };
  }, [itemHeights]);

  // Find visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = items.length;

    // Binary search for start
    let left = 0;
    let right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const itemTop = itemPositions[mid];
      const itemBottom = itemTop + itemHeights[mid];

      if (itemBottom < scrollTop) {
        left = mid + 1;
      } else {
        start = mid;
        right = mid - 1;
      }
    }

    // Binary search for end
    left = start;
    right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const itemTop = itemPositions[mid];

      if (itemTop > scrollTop + containerHeight) {
        end = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // Apply overscan
    start = Math.max(0, start - overscan);
    end = Math.min(items.length, end + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemPositions, itemHeights, items.length, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!hasMore || !onLoadMore || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, onLoadMore, loading]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (scrollElementRef.current) {
        setContainerHeight(scrollElementRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', updateHeight);
    updateHeight();

    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Empty state
  if (items.length === 0 && !loading) {
    return (
      <div className={clsx('flex items-center justify-center', className)} style={{ height }}>
        {emptyComponent || (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">暂无数据</div>
            <div className="text-gray-500 text-sm">还没有任何内容</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Render visible items */}
          {items.slice(visibleRange.start, visibleRange.end).map((item, index) => {
            const actualIndex = visibleRange.start + index;
            const top = itemPositions[actualIndex];
            const itemHeight = itemHeights[actualIndex];

            return (
              <div
                key={actualIndex}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  height: itemHeight
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}

          {/* Load more trigger */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              style={{
                position: 'absolute',
                top: totalHeight - 100,
                left: 0,
                right: 0,
                height: 100
              }}
            >
              {loading && (
                <div className="flex items-center justify-center h-full">
                  {loadingComponent || (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span className="text-gray-500">加载中...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple virtualized grid component
interface VirtualGridProps<T> {
  items: T[];
  height: number;
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  minColumns?: number;
  maxColumns?: number;
}

export function VirtualGrid<T>({
  items,
  height,
  itemWidth,
  itemHeight,
  gap = 16,
  renderItem,
  className,
  minColumns = 1,
  maxColumns = 10
}: VirtualGridProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate columns
  const columns = useMemo(() => {
    if (containerWidth === 0) return minColumns;

    const availableWidth = containerWidth - gap;
    const columnsFromWidth = Math.floor(availableWidth / (itemWidth + gap));

    return Math.min(Math.max(columnsFromWidth, minColumns), maxColumns);
  }, [containerWidth, itemWidth, gap, minColumns, maxColumns]);

  // Group items by rows
  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  // Update container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateWidth();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <VirtualList
        items={rows}
        height={height}
        itemHeight={itemHeight + gap}
        renderItem={(row, rowIndex) => (
          <div
            className="flex"
            style={{ gap, paddingLeft: gap / 2, paddingRight: gap / 2 }}
          >
            {row.map((item, colIndex) => {
              const itemIndex = rowIndex * columns + colIndex;
              return (
                <div
                  key={itemIndex}
                  style={{
                    width: itemWidth,
                    height: itemHeight
                  }}
                >
                  {renderItem(item, itemIndex)}
                </div>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}

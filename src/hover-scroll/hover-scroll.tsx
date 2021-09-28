import styled from "@emotion/styled";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  fromEvent,
  Subscription,
  takeUntil,
  switchMap,
  map,
  tap,
  debounceTime,
  Subject,
} from "rxjs";

const HoverScrollBarWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .viewport {
    height: 100%;
    width: 100%;
    left: 0px;
    overflow-x: scroll;
    overflow-y: scroll;
    position: absolute;
    right: 0px;
    top: 0px;
    -ms-overflow-style: none;
    scrollbar-width: none;

    ::-webkit-scrollbar {
      display: none;
    }
  }

  .y-scrollBar {
    bottom: 0px;
    opacity: 0;
    position: absolute;
    right: 0px;
    top: 0px;
    user-select: none;
    transition: opacity 300ms ease;
    width: 20px;
    height: 100%;
    z-index: 2;

    .thumb {
      left: 0px;
      position: absolute;
      top: 0px;
      width: 20px;

      &:before {
        background-color: rgba(221, 221, 225, 0.55);
        border-radius: 20px 20px 20px 20px;
        bottom: 4px;
        content: "";
        left: 6px;
        position: absolute;
        top: 4px;
        width: 8px;
      }
    }
  }

  .x-scrollBar {
    bottom: 0px;
    opacity: 0;
    position: absolute;
    right: 0px;
    top: calc(100% - 20px);
    user-select: none;
    transition: opacity 300ms ease;
    width: 100%;
    height: 20px;
    z-index: 2;

    .thumb {
      left: 0px;
      position: absolute;
      top: 0px;
      height: 20px;

      &:before {
        background-color: rgba(221, 221, 225, 0.55);
        border-radius: 20px 20px 20px 20px;
        bottom: 4px;
        content: "";
        left: 4px;
        right: 4px;
        position: absolute;
        top: 6px;
        height: 8px;
      }
    }
  }
`;

interface HoverScrollBarProps {
  children: ReactNode;
}

export const HoverScrollBar = ({ children }: HoverScrollBarProps) => {
  const yScrollRef = useRef<HTMLDivElement>(null);
  const xScrollRef = useRef<HTMLDivElement>(null);
  const yScrollBarRef = useRef<HTMLDivElement>(null);
  const xScrollBarRef = useRef<HTMLDivElement>(null);
  const viewPortRef = useRef<HTMLDivElement>(null);

  const [scrollPosition, setPosition] = useState<{
    yPosition: number;
    xPosition: number;
  }>({
    yPosition: 0,
    xPosition: 0,
  });
  const [lastPosition, setLastPosition] = useState<{
    yLastPosition: number;
    xLastPosition: number;
  }>({
    yLastPosition: 0,
    xLastPosition: 0,
  });
  const [scrollSize, setScrollSize] = useState<{
    ySize: number;
    xSize: number;
  }>({
    ySize: 0,
    xSize: 0,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const childCheck$ = useMemo(
    () => new Subject<{ height: number; width: number }>(),
    []
  );
  let yScrollHideTimeout = useRef<ReturnType<typeof setTimeout>>();
  let xScrollHideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const calculateScrollHeight = () => {
    if (viewPortRef.current) {
      const more =
        viewPortRef.current.scrollHeight - viewPortRef.current.clientHeight;
      const percent = Math.round(
        (more / viewPortRef.current.scrollHeight) * 100
      );
      const clientHh = Math.round(
        (viewPortRef.current.clientHeight * percent) / 100
      );
      const scrollHeight = viewPortRef.current.clientHeight - clientHh;
      return scrollHeight >= viewPortRef.current.scrollHeight
        ? 0
        : scrollHeight;
    } else {
      return 0;
    }
  };

  const calculateScrollWidth = () => {
    if (viewPortRef.current) {
      const more =
        viewPortRef.current.scrollWidth - viewPortRef.current.clientWidth;
      const percent = Math.round(
        (more / viewPortRef.current.scrollWidth) * 100
      );
      const clientWw = Math.round(
        (viewPortRef.current.clientWidth * percent) / 100
      );
      const scrollWidth = viewPortRef.current.clientWidth - clientWw;
      return scrollWidth >= viewPortRef.current.scrollWidth ? 0 : scrollWidth;
    } else {
      return 0;
    }
  };

  const calculateMax = (value: number, minValue: number, maxValue: number) => {
    return Math.min(Math.max(value, minValue), maxValue);
  };

  const calculateDraggingPosition = (e: MouseEvent, ypos?: any, xpos?: any) => {
    if (viewPortRef.current) {
      if (xpos) {
        const clientX = calculateMax(e.clientX, xpos.left, xpos.right);
        const localOffset = clientX - xpos.left;
        const localOffsetPercentage = localOffset / xpos.width;
        viewPortRef.current.scrollLeft =
          localOffsetPercentage *
          (viewPortRef.current.scrollWidth - viewPortRef.current.clientWidth);
      }

      if (ypos) {
        const clientY = calculateMax(e.clientY, ypos.top, ypos.bottom);
        const localOffset = clientY - ypos.top;
        const localOffsetPercentage = localOffset / ypos.height;
        viewPortRef.current.scrollTop =
          localOffsetPercentage *
          (viewPortRef.current.scrollHeight - viewPortRef.current.clientHeight);
      }
    }
  };

  const clearYScrollTimeOut = () => {
    if (yScrollHideTimeout.current) {
      clearTimeout(yScrollHideTimeout.current);
    }
  };

  const clearXScrollTimeOut = () => {
    if (xScrollHideTimeout.current) {
      clearTimeout(xScrollHideTimeout.current);
    }
  };

  const calculateYScrollPosition = () => {
    if (viewPortRef.current) {
      const scrollPercent = Math.round(
        (viewPortRef.current.scrollTop /
          (viewPortRef.current?.scrollHeight -
            viewPortRef.current?.clientHeight)) *
          100
      );

      const currentScrollHeight =
        viewPortRef.current?.clientHeight - scrollSize.ySize;
      return Math.round((currentScrollHeight * scrollPercent) / 100);
    } else {
      return 0;
    }
  };

  const calculateXScrollPosition = () => {
    if (viewPortRef.current) {
      const scrollPercent = Math.round(
        (viewPortRef.current.scrollLeft /
          (viewPortRef.current?.scrollWidth -
            viewPortRef.current?.clientWidth)) *
          100
      );

      const currentScrollWidth =
        viewPortRef.current?.clientWidth - scrollSize.xSize;
      return Math.round((currentScrollWidth * scrollPercent) / 100);
    } else {
      return 0;
    }
  };

  const calculateInitialPos = ({
    type,
    e,
  }: {
    type: "y" | "x";
    e: MouseEvent;
  }) => {
    if (viewPortRef.current) {
      if (type === "y") {
        if (yScrollRef.current) {
          const viewRect = viewPortRef.current?.getBoundingClientRect();
          const scrollRect = yScrollRef.current?.getBoundingClientRect();
          const initialY = e?.clientY;
          const thumbLocalY = initialY - scrollRect?.top;

          return {
            top: viewRect?.top + thumbLocalY,
            bottom: viewRect?.bottom - scrollRect?.height + thumbLocalY,
            height:
              viewRect?.bottom -
              scrollRect?.height +
              thumbLocalY -
              (viewRect?.top + thumbLocalY),
          };
        }
      }

      if (type === "x") {
        if (xScrollRef.current) {
          const viewRect = viewPortRef.current?.getBoundingClientRect();
          const scrollRect = xScrollRef.current?.getBoundingClientRect();
          const initialX = e?.clientX;
          const thumbLocalX = initialX - scrollRect?.left;

          return {
            left: viewRect?.left + thumbLocalX,
            right: viewRect?.right - scrollRect?.width + thumbLocalX,
            width:
              viewRect?.right -
              scrollRect?.width +
              thumbLocalX -
              (viewRect?.left + thumbLocalX),
          };
        }
      }
    } else {
      return {
        left: 0,
        right: 0,
        width: 0,
      };
    }
  };

  const toggleScrollBar = {
    yVisible: () => {
      if (yScrollBarRef.current) {
        yScrollBarRef.current.style.opacity = "1";
        clearYScrollTimeOut();

        yScrollHideTimeout.current = setTimeout(() => {
          toggleScrollBar.yHidden();
        }, 1500);
      }
    },
    yHidden: () => {
      if (yScrollBarRef.current && !isDragging) {
        yScrollBarRef.current.style.opacity = "0";
      }
    },
    xVisible: () => {
      if (xScrollBarRef.current) {
        xScrollBarRef.current.style.opacity = "1";
        clearXScrollTimeOut();

        xScrollHideTimeout.current = setTimeout(() => {
          toggleScrollBar.xHidden();
        }, 1500);
      }
    },
    xHidden: () => {
      if (xScrollBarRef.current && !isDragging) {
        xScrollBarRef.current.style.opacity = "0";
      }
    },

    allVisible: () => {
      toggleScrollBar.xVisible();
      toggleScrollBar.yVisible();
    },
    allHide: () => {
      toggleScrollBar.yHidden();
      toggleScrollBar.xHidden();
    },
  };

  /**
   * Effects
   */

  useEffect(() => {
    const detectResizeElement = new ResizeObserver(() => {
      setScrollSize({
        ySize: calculateScrollHeight(),
        xSize: calculateScrollWidth(),
      });
    });

    if (viewPortRef.current) {
      detectResizeElement.observe(viewPortRef.current);
    }

    return () => {
      detectResizeElement.disconnect();
    };
  }, []);

  useEffect(() => {
    if (viewPortRef.current && childCheck$) {
      childCheck$.next({
        height: viewPortRef.current.scrollHeight,
        width: viewPortRef.current.scrollWidth,
      });
    }
  }, [children, childCheck$]);

  useEffect(() => {
    if (childCheck$) {
      childCheck$.subscribe(() => {
        setScrollSize({
          ySize: calculateScrollHeight(),
          xSize: calculateScrollWidth(),
        });
        setPosition({
          yPosition: calculateYScrollPosition(),
          xPosition: calculateXScrollPosition(),
        });
      });
    }

    return () => {
      if (childCheck$) childCheck$.unsubscribe();
    };
  }, [childCheck$]);

  useEffect(() => {
    let yScrollRef$: Subscription;
    let xScrollRef$: Subscription;

    if (yScrollRef.current && xScrollRef.current) {
      const draggingYStart$ = fromEvent<MouseEvent>(
        yScrollRef.current,
        "mousedown"
      );
      const draggingXStart$ = fromEvent<MouseEvent>(
        xScrollRef.current,
        "mousedown"
      );

      const draggingMove$ = fromEvent<MouseEvent>(document, "mousemove");
      const draggingEnd$ = fromEvent(document, "mouseup").pipe(
        tap((e) => {
          setIsDragging(false);
          if (viewPortRef.current) {
            setLastPosition({
              yLastPosition: viewPortRef.current.scrollTop,
              xLastPosition: viewPortRef.current.scrollLeft,
            });

            if (xScrollBarRef.current?.style.opacity === "1") {
              toggleScrollBar.xVisible();
            }
            if (yScrollBarRef.current?.style.opacity === "1") {
              toggleScrollBar.yVisible();
            }

            if (
              viewPortRef.current.parentElement &&
              !viewPortRef.current.parentElement.contains(
                e.target as HTMLElement
              )
            ) {
              toggleScrollBar.yHidden();
              toggleScrollBar.xHidden();
              return;
            } else {
              if (xScrollBarRef.current?.style.opacity === "1") {
                toggleScrollBar.xVisible();
              }
              if (yScrollBarRef.current?.style.opacity === "1") {
                toggleScrollBar.yVisible();
              }
            }
          }
        })
      );

      yScrollRef$ = draggingYStart$
        .pipe(
          tap(() => {
            setIsDragging(true);
            clearYScrollTimeOut();
          }),
          map((e) => calculateInitialPos({ type: "y", e })),
          switchMap((pos) => {
            return draggingMove$.pipe(
              map((e) => calculateDraggingPosition(e, pos)),
              takeUntil(draggingEnd$)
            );
          })
        )
        .subscribe();

      xScrollRef$ = draggingXStart$
        .pipe(
          tap(() => {
            setIsDragging(true);
            clearXScrollTimeOut();
          }),
          map((e) => calculateInitialPos({ type: "x", e })),
          switchMap((pos) => {
            return draggingMove$.pipe(
              map((e) => calculateDraggingPosition(e, undefined, pos)),
              takeUntil(draggingEnd$)
            );
          })
        )
        .subscribe();
    }

    return () => {
      if (yScrollRef$) yScrollRef$.unsubscribe();
      if (xScrollRef$) xScrollRef$.unsubscribe();
    };
  }, [lastPosition]);

  useEffect(() => {
    let viewPortRef$: Subscription;

    if (viewPortRef.current) {
      viewPortRef$ = fromEvent(viewPortRef.current, "scroll")
        .pipe(
          tap(() => {
            if (!isDragging) {
              toggleScrollBar.yVisible();
              toggleScrollBar.xVisible();
            }

            if (viewPortRef.current) {
              setPosition({
                yPosition: calculateYScrollPosition(),
                xPosition: calculateXScrollPosition(),
              });
            }
          }),
          debounceTime(100)
        )
        .subscribe(() => {
          if (viewPortRef.current && !isDragging) {
            setLastPosition({
              yLastPosition: viewPortRef.current.scrollTop,
              xLastPosition: viewPortRef.current.scrollLeft,
            });
          }
        });
    }

    return () => {
      if (viewPortRef$) viewPortRef$.unsubscribe();
    };
  }, [scrollSize, isDragging]);

  return (
    <>
      <HoverScrollBarWrap
        onMouseEnter={toggleScrollBar.allVisible}
        onMouseLeave={toggleScrollBar.allHide}
      >
        <div className="viewport" ref={viewPortRef}>
          {children}
        </div>
        <div className="y-scrollBar" ref={yScrollBarRef}>
          <div
            className="thumb"
            ref={yScrollRef}
            onMouseEnter={toggleScrollBar.yVisible}
            style={{
              transform: `translateY(${scrollPosition.yPosition}px)`,
              height: `${scrollSize.ySize}px`,
            }}
          />
        </div>
        <div className="x-scrollBar" ref={xScrollBarRef}>
          <div
            className="thumb"
            ref={xScrollRef}
            onMouseEnter={toggleScrollBar.xVisible}
            style={{
              transform: `translateX(${scrollPosition.xPosition}px)`,
              width: `${scrollSize.xSize}px`,
            }}
          />
        </div>
      </HoverScrollBarWrap>
    </>
  );
};

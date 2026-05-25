import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ItineraryCard } from './ItineraryCard';
import { ItineraryData } from '@/types/itinerary';

interface MobileItineraryStackProps {
  itineraries: ItineraryData[];
  onAddToCollection?: (itineraryId: number) => void;
  onRemoveFromCollection?: (itineraryId: number) => void;
  collectionId?: string;
  showCollectionActions?: boolean;
}

const AXIS_LOCK = 8;
const H_THRESHOLD = 60;
const V_THRESHOLD = 80;

export const MobileItineraryStack: React.FC<MobileItineraryStackProps> = ({
  itineraries,
  onAddToCollection,
  onRemoveFromCollection,
  collectionId,
  showCollectionActions = false,
}) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'x' | 'y' | null>(null);
  const isDragging = useRef(false);

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-xl">✈️</span>
        </div>
        <p className="text-sm text-muted-foreground">No itineraries in this stack</p>
      </div>
    );
  }

  const len = itineraries.length;
  const safeIndex = ((index % len) + len) % len;
  const prev = () => setIndex((i) => (i - 1 + len) % len);
  const next = () => setIndex((i) => (i + 1) % len);
  const openTop = () => navigate(`/itinerary?id=${itineraries[safeIndex].id}`);

  const beginDrag = (x: number, y: number) => {
    start.current = { x, y };
    axis.current = null;
    isDragging.current = true;
  };
  const moveDrag = (x: number, y: number) => {
    if (!isDragging.current || !start.current) return;
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    if (!axis.current) {
      if (Math.abs(dx) > AXIS_LOCK || Math.abs(dy) > AXIS_LOCK) {
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else {
        return;
      }
    }
    if (axis.current === 'x') setDrag({ x: dx, y: 0 });
    else setDrag({ x: 0, y: Math.min(0, dy) });
  };
  const endDrag = () => {
    if (!isDragging.current) return;
    const currentAxis = axis.current;
    const { x, y } = drag;
    isDragging.current = false;
    start.current = null;
    axis.current = null;
    setDrag({ x: 0, y: 0 });
    if (currentAxis === 'x') {
      if (x < -H_THRESHOLD) next();
      else if (x > H_THRESHOLD) prev();
    } else if (currentAxis === 'y') {
      if (y < -V_THRESHOLD) openTop();
    }
  };

  const onTouchStart = (e: React.TouchEvent) =>
    beginDrag(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) =>
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => endDrag();
  const onMouseDown = (e: React.MouseEvent) => beginDrag(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY);
  const onMouseUp = () => endDrag();
  const onMouseLeave = () => endDrag();

  const visible = Array.from({ length: Math.min(3, len) }, (_, i) => ({
    it: itineraries[(safeIndex + i) % len],
    i,
  }));

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="relative w-[255px] h-[375px] touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {visible
          .slice()
          .reverse()
          .map(({ it, i }) => (
            <div
              key={`${it.id}-${i}`}
              className={`absolute inset-0 ${isDragging.current && i === 0 ? '' : 'transition-all duration-300'}`}
              style={{
                transform:
                  i === 0
                    ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.04}deg)`
                    : `translateY(${i * 10}px) translateX(${i * 5}px) scale(${1 - i * 0.04})`,
                zIndex: 10 - i,
                opacity: i === 0 ? 1 : 0.6,
                pointerEvents: i === 0 ? 'auto' : 'none',
              }}
            >
              <ItineraryCard
                itinerary={it}
                onAddToCollection={onAddToCollection}
                onRemoveFromCollection={onRemoveFromCollection}
                showCollectionActions={showCollectionActions}
                collectionId={collectionId}
                size="stack"
              />
            </div>
          ))}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prev} className="h-9 w-9 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-[52px] text-center">
            {safeIndex + 1} / {len}
          </span>
          <Button variant="outline" size="icon" onClick={next} className="h-9 w-9 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60">Swipe ↔ browse · ↑ open</p>
      </div>
    </div>
  );
};
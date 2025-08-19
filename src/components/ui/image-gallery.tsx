import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: 'card' | 'wide' | 'square';
  showIndicators?: boolean;
  overlayContent?: React.ReactNode;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt,
  className,
  aspectRatio = 'card',
  showIndicators = true,
  overlayContent
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-lg bg-muted/20 flex items-center justify-center",
        aspectRatio === 'card' && "h-48",
        aspectRatio === 'wide' && "h-32",
        aspectRatio === 'square' && "aspect-square",
        className
      )}>
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg group",
      aspectRatio === 'card' && "h-48",
      aspectRatio === 'wide' && "h-32", 
      aspectRatio === 'square' && "aspect-square",
      className
    )}>
      {/* Main Image */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Image Indicators */}
      {images.length > 1 && showIndicators && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/70"
              )}
              onClick={() => goToImage(index)}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1}/{images.length}
        </div>
      )}

      {/* Overlay Content */}
      {overlayContent && (
        <div className="absolute inset-0 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-4">
            {overlayContent}
          </div>
        </div>
      )}
    </div>
  );
};
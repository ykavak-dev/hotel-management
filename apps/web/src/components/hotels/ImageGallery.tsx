import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  hotelName: string;
}

export function ImageGallery({ images, hotelName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const goPrev = () => setActiveIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const goNext = () => setActiveIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  if (images.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Main image */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt={`${hotelName} - Main`}
            className="h-80 w-full object-cover transition hover:scale-105"
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer overflow-hidden rounded-lg"
                onClick={() => openLightbox(i + 1)}
              >
                <img
                  src={img}
                  alt={`${hotelName} - ${i + 2}`}
                  className="h-20 w-32 object-cover transition hover:opacity-80"
                />
              </div>
            ))}
            {images.length > 5 && (
              <div className="flex h-20 w-32 cursor-pointer items-center justify-center rounded-lg bg-muted text-sm font-medium">
                +{images.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="flex max-w-4xl flex-col items-center p-0">
          <div className="relative flex w-full items-center justify-center">
            <img
              src={images[activeIndex]}
              alt={`${hotelName} - ${activeIndex + 1}`}
              className="max-h-[80vh] w-full object-contain"
            />
            {/* Prev/Next */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={goNext}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </>
            )}
          </div>
          <p className="py-2 text-sm text-muted-foreground">
            {activeIndex + 1} / {images.length}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
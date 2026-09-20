import { TouchEvent, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export type GalleryImage = { id: number | string; url: string; alt?: string | null };

export default function ListingGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const safeImages = images.filter(image => image.url);
  if (!safeImages.length) return <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-[#eef5ed] text-sm text-[#718780]">No photos yet</div>;
  const current = safeImages[Math.min(active, safeImages.length - 1)];
  const move = (delta: number) => setActive(index => (index + delta + safeImages.length) % safeImages.length);
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => setTouchStart(event.changedTouches[0]?.clientX ?? null);
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
    setTouchStart(null);
  };
  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(false); if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, safeImages.length]);
  return <>
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-3xl bg-[#eef5ed]" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button type="button" className="block w-full cursor-zoom-in" onClick={() => setLightbox(true)} aria-label="Open photo gallery"><img src={current.url} alt={current.alt || title} className="aspect-[4/3] w-full object-cover" /></button>
        <button type="button" onClick={() => setLightbox(true)} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#183b39] shadow-sm"><Expand size={15} /> View</button>
        {safeImages.length > 1 && <><button type="button" aria-label="Previous photo" onClick={() => move(-1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#183b39] shadow-sm"><ChevronLeft size={18} /></button><button type="button" aria-label="Next photo" onClick={() => move(1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#183b39] shadow-sm"><ChevronRight size={18} /></button></>}
      </div>
      {safeImages.length > 1 && <div className="grid grid-cols-5 gap-2">{safeImages.slice(0, 10).map((image, index) => <button type="button" key={image.id} onClick={() => setActive(index)} className={`overflow-hidden rounded-xl border-2 ${index === active ? "border-[#183b39]" : "border-transparent"}`}><img src={image.url} alt={image.alt || `${title} photo ${index + 1}`} className="aspect-square w-full object-cover" /></button>)}</div>}
    </div>
    {lightbox && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#102d2b]/95 p-4" onClick={() => setLightbox(false)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}><button type="button" aria-label="Close gallery" className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white"><X size={20} /></button>{safeImages.length > 1 && <><button type="button" aria-label="Previous photo" onClick={event => { event.stopPropagation(); move(-1); }} className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"><ChevronLeft size={24} /></button><button type="button" aria-label="Next photo" onClick={event => { event.stopPropagation(); move(1); }} className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"><ChevronRight size={24} /></button></>}<img src={current.url} alt={current.alt || title} className="max-h-[90vh] max-w-full object-contain" onClick={event => event.stopPropagation()} /></div>}
  </>;
}

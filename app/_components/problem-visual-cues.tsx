import Image from "next/image";

export function ProblemVisualCues({ images }: { images: string[] | undefined }) {
  if (!images?.length) return null;

  return (
    <div
      aria-hidden="true"
      className="mt-6 grid grid-cols-2 gap-3 overflow-hidden rounded-2xl opacity-45 grayscale"
    >
      {images.map((src) => (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl" key={src}>
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="(max-width: 768px) 50vw, 24rem"
            src={src}
          />
        </div>
      ))}
    </div>
  );
}

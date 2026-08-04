import Image from "next/image";

/** Image with a caption. Width/height are required so layout never shifts. */
export function Figure({
  src,
  alt,
  caption,
  width = 1600,
  height = 900,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="border-border rounded-lg border"
        sizes="(max-width: 768px) 100vw, 768px"
      />
      {caption ? (
        <figcaption className="text-fg-subtle mt-2 text-center text-xs">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Self-hosted or remote video. Muted + loop by default so it can autoplay. */
export function Video({
  src,
  caption,
  poster,
}: {
  src: string;
  caption?: string;
  poster?: string;
}) {
  return (
    <figure className="my-8">
      <video
        src={src}
        poster={poster}
        className="border-border w-full rounded-lg border"
        autoPlay
        muted
        loop
        playsInline
        controls
      />
      {caption ? (
        <figcaption className="text-fg-subtle mt-2 text-center text-xs">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

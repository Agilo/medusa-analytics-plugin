import { Photo } from '@medusajs/icons';

/** `@medusajs/ui` has no Thumbnail component, so this mirrors the admin's. */
export const ProductThumbnail = ({
  src,
  alt,
}: {
  src?: string | null;
  alt?: string;
}) => (
  <div className="bg-ui-bg-component border-ui-border-base flex h-8 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border">
    {src ? (
      <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
    ) : (
      <Photo className="text-ui-fg-subtle" />
    )}
  </div>
);

import { Photo } from '@medusajs/icons';

/**
 * Small product image for table rows, styled like the thumbnails in Medusa's
 * admin. `@medusajs/ui` doesn't export a Thumbnail component, so the plugin
 * has its own. Shows a photo icon when there's no image.
 */
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

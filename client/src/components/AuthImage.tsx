import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { apiBlobUrl } from '../lib/api';

/**
 * Zeigt ein Auth-geschütztes Upload-Bild an. <img src> kann keine Bearer-Header
 * senden, daher wird das Bild per fetch geladen und als Objekt-URL eingebunden.
 */
export function AuthImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    setFailed(false);
    apiBlobUrl(src)
      .then((u) => {
        if (active) {
          objectUrl = u;
          setUrl(u);
        } else {
          URL.revokeObjectURL(u);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-kore-bg text-kore-faint ${className ?? ''}`}>
        <ImageOff size={20} />
      </div>
    );
  }
  if (!url) return <div className={`bg-kore-bg animate-pulse ${className ?? ''}`} />;
  return <img src={url} alt={alt} className={className} />;
}

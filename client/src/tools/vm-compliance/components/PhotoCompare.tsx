import { API_URL } from '../../../lib/api';
export function PhotoCompare({ referencePhoto, submittedPhoto }: { referencePhoto: string | null; submittedPhoto: string }) {
  return (
    <div className="grid grid-cols-2 gap-lg">
      <div>
        <p className="text-small text-kore-mid uppercase tracking-widest mb-sm">Referenz</p>
        {referencePhoto ? <img src={`${API_URL}${referencePhoto}`} alt="Referenz" className="w-full aspect-video object-cover border border-kore-border" /> : <div className="w-full aspect-video bg-kore-bg border border-kore-border flex items-center justify-center text-small text-kore-faint">Kein Referenzbild</div>}
      </div>
      <div>
        <p className="text-small text-kore-mid uppercase tracking-widest mb-sm">Eingereicht</p>
        <img src={`${API_URL}${submittedPhoto}`} alt="Eingereicht" className="w-full aspect-video object-cover border border-kore-border" />
      </div>
    </div>
  );
}

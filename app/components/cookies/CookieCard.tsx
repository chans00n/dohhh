import {Link} from 'react-router';

export interface CookieType {
  slug: string;
  title: string;
  image: string;
  blurb: string;
  activeCampaignSlug?: string;
}

export function CookieCard({cookie}: {cookie: CookieType}) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <img src={cookie.image} alt={cookie.title} className="w-full h-40 object-cover rounded" />
      <h3 className="text-lg font-semibold">{cookie.title}</h3>
      <p className="text-sm text-gray-700">{cookie.blurb}</p>
      <div className="flex gap-2">
        <Link to={`/cookies/${cookie.slug}`} className="text-blue-700 underline">View cookie</Link>
        {cookie.activeCampaignSlug && (
          <Link to={`/campaigns/${cookie.activeCampaignSlug}`} className="text-green-700 underline">Back campaign</Link>
        )}
      </div>
    </div>
  );
}

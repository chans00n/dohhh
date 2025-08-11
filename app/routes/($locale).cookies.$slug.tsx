import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from 'react-router';
// Removed mock data import - getActiveCampaigns

export const meta: MetaFunction = ({params}) => [{title: `Dohhh | ${params.slug} Cookie`}];

export async function loader({params}: LoaderFunctionArgs) {
  const slug = params.slug as string;
  // Using real campaign data only - no mock data
  // Campaign will be loaded from real Shopify data through storefront API
  const campaign = null; // Will be populated from real Shopify data
  return {cookie: {slug, title: slug.replaceAll('-', ' '), image: '', blurb: ''}, campaign};
}

export default function CookieDetail() {
  const {cookie, campaign} = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold">{cookie.title}</h1>
      {campaign && 'slug' in campaign ? (
        <Link to={`/campaigns/${campaign.slug}`} className="inline-block bg-green-600 text-white rounded px-4 py-2">Back the campaign</Link>
      ) : (
        <p>No active campaign yet for this cookie.</p>
      )}
    </div>
  );
}

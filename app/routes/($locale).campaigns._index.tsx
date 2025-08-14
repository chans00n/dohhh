import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from 'react-router';
import {CAMPAIGN_LIST_QUERY} from '~/graphql/campaigns/ProductCampaignFragments';
import {productToCampaign} from '~/lib/campaigns.server';
import type {Campaign} from '~/lib/campaigns';
import {RichText} from '~/components/campaigns/RichText';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction = () => [{title: 'DOHHH | CAMPAIGNS'}];

export async function loader({context}: LoaderFunctionArgs) {
  let data: any = null;
  try {
    data = await context.storefront.query(CAMPAIGN_LIST_QUERY, {cache: context.storefront.CacheNone()});
  } catch (e: any) {
    console.error('Storefront query error CAMPAIGN_LIST_QUERY', e?.message || e);
    throw e;
  }
  const campaigns: Campaign[] = (data?.products?.nodes || [])
    .map(productToCampaign)
    .filter(Boolean) as Campaign[];
  return {campaigns};
}

export default function CampaignsIndex() {
  const {campaigns} = useLoaderData<typeof loader>();
  
  return (
    <div className="bg-white min-h-screen">
      {/* Page Title */}
      <section className="w-full px-8 py-16 border-b-2 border-black">
        <h1 className="text-6xl lg:text-8xl font-bold uppercase">ALL CAMPAIGNS</h1>
        <p className="text-xl mt-4">{campaigns.length} ACTIVE CAMPAIGNS</p>
      </section>
      
      {/* Campaigns Grid */}
      <section className="w-full">
        {campaigns.map((campaign, idx) => {
          const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <Link 
              key={campaign.id} 
              to={`/campaigns/${campaign.slug}`}
              className="block border-b-2 border-black transition-colors group no-underline hover:no-underline"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 group-hover:bg-gray-50">
                {/* Image */}
                <div className="lg:col-span-4 h-96 lg:h-auto">
                  <img
                    src={campaign.images?.[0]?.url || '/Dohhh-Cash-Celebrate.png'}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="lg:col-span-5 px-4 py-8 md:p-8 lg:p-12 lg:border-r-2 lg:border-black">
                  <h2 className="text-3xl lg:text-4xl font-bold uppercase mb-4">
                    {campaign.name}
                  </h2>
                  <div className="text-lg mb-6">
                    {campaign.story && campaign.story.trim().startsWith('{') ? (
                      <RichText json={campaign.story} />
                    ) : campaign.story ? (
                      <div dangerouslySetInnerHTML={{ __html: campaign.story }} />
                    ) : campaign.description && campaign.description.trim().startsWith('{') ? (
                      <RichText json={campaign.description} />
                    ) : (
                      <p>{campaign.description}</p>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1">
                  <div className="p-6 border-r lg:border-r-0 lg:border-b-2 border-black">
                    <p className="text-3xl font-bold">{campaign.progress.percentage}%</p>
                    <p className="text-sm uppercase">FUNDED</p>
                  </div>
                  <div className="p-6 lg:border-b-2 border-black">
                    <p className="text-3xl font-bold">{campaign.progress.backerCount}</p>
                    <p className="text-sm uppercase">BACKERS</p>
                  </div>
                  <div className="p-6 border-r lg:border-r-0 lg:border-b-2 border-black border-t-2 lg:border-t-0">
                    <p className="text-3xl font-bold">{daysLeft}</p>
                    <p className="text-sm uppercase">DAYS LEFT</p>
                  </div>
                  <div className="p-6 border-t-2 lg:border-t-0">
                    <p className="text-3xl font-bold">${campaign.progress.totalRaised.toFixed(2)}</p>
                    <p className="text-sm uppercase">RAISED</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

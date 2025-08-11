import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [{title: 'Dohhh | My Campaigns'}];

export async function loader({context}: LoaderFunctionArgs) {
  // In a real implementation, you would fetch the customer's supported campaigns
  // from your backend or Shopify metafields here
  return {
    isLoggedIn: await context.customerAccount.isLoggedIn(),
    campaigns: [] // Placeholder for actual campaign data
  };
}

export default function AccountCampaigns() {
  // In production, this would come from loader data
  const campaigns: any[] = [];
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl lg:text-6xl font-bold uppercase mb-12">
          MY CAMPAIGNS
        </h1>
        
        {campaigns.length === 0 ? (
          <EmptyCampaigns />
        ) : (
          <CampaignsList campaigns={campaigns} />
        )}
      </div>
    </div>
  );
}

function EmptyCampaigns() {
  return (
    <div className="border-2 border-black p-12 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold uppercase mb-6">
          NO CAMPAIGNS YET
        </h2>
        <p className="text-xl mb-8 uppercase">
          You haven't supported any crowdfunding campaigns yet. 
          Start making a difference today!
        </p>
        <Link 
          to="/campaigns" 
          className="inline-block px-8 py-4 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors text-xl font-bold uppercase"
        >
          BROWSE CAMPAIGNS →
        </Link>
      </div>
    </div>
  );
}

function CampaignsList({campaigns}: {campaigns: any[]}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {campaigns.map((campaign: any) => (
        <div 
          key={campaign.id} 
          className="border-2 border-black p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold uppercase">
              {campaign.name}
            </h3>
            <span className="px-3 py-1 border-2 border-black bg-green-100 text-sm font-bold uppercase">
              ACTIVE
            </span>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="font-bold uppercase">Contribution:</span>
              <span className="font-mono">${campaign.contribution}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase">Date:</span>
              <span className="font-mono">{campaign.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold uppercase">Status:</span>
              <span className="font-mono uppercase">{campaign.status}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Link 
              to={`/campaigns/${campaign.slug}`}
              className="flex-1 px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase text-center"
            >
              VIEW CAMPAIGN
            </Link>
            <Link 
              to={`/account/orders/${campaign.orderId}`}
              className="px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase"
            >
              ORDER →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [{title: 'Dohhh | My Campaigns'}];

export async function loader({context}: LoaderFunctionArgs) {
  return {isLoggedIn: await context.customerAccount.isLoggedIn()};
}

export default function AccountCampaigns() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">My Backed Campaigns</h1>
      <p className="text-gray-700">Link your email at checkout to see backed campaigns here.</p>
    </div>
  );
}

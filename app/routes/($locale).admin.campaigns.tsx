import {type LoaderFunctionArgs, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Form, type MetaFunction} from 'react-router';
import {CAMPAIGN_LIST_QUERY} from '~/graphql/campaigns/ProductCampaignFragments';
import {productToCampaign} from '~/lib/campaigns.server';
import type {Campaign} from '~/lib/campaigns';
import {adminFetch, ADMIN_METAFIELDS_SET} from '~/lib/admin';

export const meta: MetaFunction = () => [{title: 'Dohhh | Admin Campaigns'}];

export async function loader({context}: LoaderFunctionArgs) {
  const data = await context.storefront.query(CAMPAIGN_LIST_QUERY);
  const campaigns: (Campaign & {productId: string})[] = (data?.products?.nodes || [])
    .map((p: any) => {
      const mapped = productToCampaign(p);
      if (!mapped) return null;
      return {
        ...mapped,
        productId: p.id,
      } as Campaign & {productId: string};
    })
    .filter(Boolean) as any;
  // Include raw metafields for debugging
  return {campaigns, debug: (data?.products?.nodes || []).map((n: any) => ({id: n.id, handle: n.handle, title: n.title, campaignName: n.campaignName?.value, campaignSlug: n.campaignSlug?.value}))};
}

export async function action({request, context}: ActionFunctionArgs) {
  const form = await request.formData();
  const productId = String(form.get('productId'));
  const name = String(form.get('name') || '');
  const slug = String(form.get('slug') || '');
  const goal = String(form.get('goal_quantity'));
  const deadline = String(form.get('deadline'));
  const status = String(form.get('status'));
  const delivery = String(form.get('delivery_methods'));
  const story = String(form.get('story_html'));
  const description = String(form.get('description'));

  const metafields = [
    name ? {ownerId: productId, namespace: 'campaign', key: 'name', type: 'single_line_text_field', value: name} : null,
    slug ? {ownerId: productId, namespace: 'campaign', key: 'slug', type: 'single_line_text_field', value: slug} : null,
    {ownerId: productId, namespace: 'campaign', key: 'goal_quantity', type: 'number_integer', value: goal},
    {ownerId: productId, namespace: 'campaign', key: 'deadline', type: 'single_line_text_field', value: deadline},
    {ownerId: productId, namespace: 'campaign', key: 'status', type: 'single_line_text_field', value: status},
    {ownerId: productId, namespace: 'campaign', key: 'delivery_methods', type: 'json', value: delivery || '[]'},
    {ownerId: productId, namespace: 'campaign', key: 'story_html', type: 'multi_line_text_field', value: story || ''},
    {ownerId: productId, namespace: 'campaign', key: 'description', type: 'multi_line_text_field', value: description || ''},
  ].filter(Boolean) as any[];

  const res = await adminFetch(context.env, ADMIN_METAFIELDS_SET, {metafields});
  const errors = res?.data?.metafieldsSet?.userErrors;
  if (errors?.length) {
    return new Response(JSON.stringify({ok: false, errors}), {status: 400});
  }
  return new Response(null, {status: 204});
}

export default function AdminCampaigns() {
  const {campaigns, debug} = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Campaign Manager</h1>
      <details className="text-xs text-gray-600"><summary>Debug metafields</summary><pre className="overflow-auto p-3 bg-gray-100 rounded">{JSON.stringify(debug, null, 2)}</pre></details>
      {campaigns.map((c) => (
        <div key={c.id} className="border rounded-lg p-4 space-y-3">
          <div className="font-semibold">{c.name}</div>
          <div className="text-sm text-gray-600">Status: {c.status} · {c.progress.currentQuantity}/{c.goal.quantity} cookies</div>
          <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="hidden" name="productId" value={c.productId} />
            <label className="text-sm md:col-span-2">Name<input className="w-full border rounded p-2" name="name" type="text" defaultValue={c.name} /></label>
            <label className="text-sm md:col-span-2">Slug<input className="w-full border rounded p-2" name="slug" type="text" defaultValue={c.slug} /></label>
            <label className="text-sm">Goal Quantity<input className="w-full border rounded p-2" name="goal_quantity" type="number" defaultValue={c.goal.quantity} /></label>
            <label className="text-sm">Deadline<input className="w-full border rounded p-2" name="deadline" type="text" defaultValue={c.goal.deadline} /></label>
            <label className="text-sm">Status<input className="w-full border rounded p-2" name="status" type="text" defaultValue={c.status} /></label>
            <label className="text-sm md:col-span-2">Delivery Methods (JSON)<textarea className="w-full border rounded p-2" name="delivery_methods" defaultValue={JSON.stringify(c.deliveryMethods)} /></label>
            <label className="text-sm md:col-span-2">Description<textarea className="w-full border rounded p-2" name="description" defaultValue={c.description} /></label>
            <label className="text-sm md:col-span-2">Story HTML<textarea className="w-full border rounded p-2" name="story_html" defaultValue={c.story} /></label>
            <div className="md:col-span-2"><button className="bg-black text-white rounded px-3 py-2">Save</button></div>
          </Form>
        </div>
      ))}
    </div>
  );
}

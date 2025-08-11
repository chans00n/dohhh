import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Form} from 'react-router';

const PRODUCT_WITH_ALL_METAFIELDS = `#graphql
  query ProductWithMetafields($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      # Storefront only supports identifiers or specific fields
      campaignName: metafield(namespace: "campaign", key: "name") { value }
      campaignSlug: metafield(namespace: "campaign", key: "slug") { value }
      campaignNameCustom: metafield(namespace: "custom.campaign", key: "name") { value }
      campaignSlugCustom: metafield(namespace: "custom.campaign", key: "slug") { value }
      # custom namespace with prefixed keys
      campaignNameCustomNs: metafield(namespace: "custom", key: "campaign_name") { value }
      campaignSlugCustomNs: metafield(namespace: "custom", key: "campaign_slug") { value }
    }
  }
` as const;

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle') || 'chocolate-chip-walnut';
  let sfData: any = null;
  let sfError: any = null;
  try {
    sfData = await context.storefront.query(PRODUCT_WITH_ALL_METAFIELDS, {variables: {handle}});
  } catch (e: any) {
    sfError = e?.message || String(e);
  }
  let adminData: any = null;
  try {
    const id = sfData?.product?.id as string | undefined;
    if (id) {
      const {adminFetch, ADMIN_GET_PRODUCT_METAFIELDS} = await import('~/lib/admin');
      const res = await adminFetch<{node: {metafields: {edges: Array<{node: {namespace: string; key: string; type: string; value: string}}>}}}>(context.env, ADMIN_GET_PRODUCT_METAFIELDS, {id});
      adminData = res?.data?.node?.metafields?.edges?.map((e) => e.node);
    }
  } catch {}
  return {handle, sfData, sfError, adminData};
}

export default function TestMetafields() {
  const {handle, sfData, sfError, adminData} = useLoaderData<typeof loader>();
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Test Metafields</h1>
      <Form method="get" className="flex gap-2">
        <input name="handle" defaultValue={handle} className="border rounded p-2" />
        <button className="bg-black text-white rounded px-3">Load</button>
      </Form>
      {sfError ? <div className="text-red-600">Storefront error: {sfError}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Storefront product</h2>
          <pre className="p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(sfData, null, 2)}</pre>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Admin metafields</h2>
          <pre className="p-3 bg-gray-100 rounded overflow-auto">{JSON.stringify(adminData, null, 2)}</pre>
        </div>
      </div>
      <p className="text-sm text-gray-600">Use this page to confirm the actual namespace/key returned by Storefront and Admin for your product.</p>
    </div>
  );
}

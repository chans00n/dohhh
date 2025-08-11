import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  console.log('GET TEST WEBHOOK RECEIVED:', request.url);
  return new Response('Test webhook GET endpoint is working', {status: 200});
}

export default function Component() { 
  return <div>Test webhook GET endpoint</div>; 
}
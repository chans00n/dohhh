import {type ActionFunctionArgs} from '@shopify/remix-oxygen';

export async function action({request}: ActionFunctionArgs) {
  console.log('TEST WEBHOOK RECEIVED:', request.method, request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.text();
    console.log('Body length:', body.length);
    console.log('Body preview:', body.substring(0, 200));
    
    const payload = JSON.parse(body);
    console.log('Order ID:', payload?.id);
    console.log('Order Name:', payload?.name);
    
    return new Response('Test webhook received', {status: 200});
  } catch (e) {
    console.error('Test webhook error:', e);
    return new Response('Test webhook error', {status: 500});
  }
}

export default function Component() { 
  return null; 
}
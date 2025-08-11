import type {Campaign} from '~/lib/campaigns';
import {RichText} from './RichText';

export function CampaignStory({campaign}: {campaign: Campaign}) {
  // If story appears to be a JSON rich_text_field, use the renderer; otherwise treat as HTML
  const looksJson = typeof campaign.story === 'string' && campaign.story.trim().startsWith('{');
  if (looksJson) return <RichText json={campaign.story} />;
  return <article className="prose max-w-none" dangerouslySetInnerHTML={{__html: campaign.story}} />;
}

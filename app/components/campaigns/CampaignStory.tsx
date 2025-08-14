import type {Campaign} from '~/lib/campaigns';
import {RichText} from './RichText';

export function CampaignStory({campaign}: {campaign: Campaign}) {
  // Handle undefined or empty story
  if (!campaign.story) {
    return <div></div>;
  }
  
  // If story appears to be a JSON rich_text_field, use the renderer
  const looksJson = typeof campaign.story === 'string' && campaign.story.trim().startsWith('{');
  if (looksJson) return <RichText json={campaign.story} />;
  
  // Check if it looks like HTML (contains HTML tags)
  const looksHtml = typeof campaign.story === 'string' && /<[^>]+>/.test(campaign.story);
  if (looksHtml) {
    return <article className="prose max-w-none" dangerouslySetInnerHTML={{__html: campaign.story}} />;
  }
  
  // Otherwise treat as plain text with line breaks
  // Each line break creates a new paragraph for better readability
  return (
    <div>
      {campaign.story.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
        <p key={idx} className="mb-4 last:mb-0">{paragraph.trim()}</p>
      ))}
    </div>
  );
}

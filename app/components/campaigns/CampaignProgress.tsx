import {Progress} from '~/components/ui/progress';
import {Badge} from '~/components/ui/badge';
import type {Campaign} from '~/lib/campaigns';

export function CampaignProgress({campaign, showDetailed = true, size = 'lg'}: {campaign: Campaign; showDetailed?: boolean; size?: 'sm' | 'md' | 'lg'}) {
  const remaining = Math.max(campaign.goal.quantity - campaign.progress.currentQuantity, 0);
  const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isFunded = campaign.progress.percentage >= 100;
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-neutral-900 ${
              size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-xl'
            } animate-count-up`}>
              {campaign.progress.percentage}%
            </span>
            <span className="text-neutral-600 text-sm font-medium">funded</span>
            {isFunded && <Badge variant="success" className="ml-2">✨ Goal reached!</Badge>}
          </div>
          {showDetailed && (
            <div className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-700">{campaign.progress.currentQuantity.toLocaleString()}</span>
              {' of '}
              <span className="font-semibold text-neutral-700">{campaign.goal.quantity.toLocaleString()}</span>
              {' cookies backed'}
            </div>
          )}
        </div>
        
        {showDetailed && (
          <div className="text-right space-y-1">
            <div className="flex flex-col items-end gap-1">
              <Badge variant={daysLeft <= 3 ? 'warning' : 'secondary'} className="animate-pulse-subtle">
                {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon!'}
              </Badge>
              <div className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-700">{campaign.progress.backerCount}</span>
                {' backers'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Progress 
        value={campaign.progress.percentage} 
        size={size} 
        showAnimation={true}
        className="shadow-sm" 
      />
      
      {showDetailed && remaining > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-neutral-600">
            <span className="font-semibold text-amber-600">{remaining.toLocaleString()}</span>
            {' cookies to reach goal'}
          </div>
          <div className="text-neutral-600">
            ${campaign.progress.totalRaised.toLocaleString()} raised
          </div>
        </div>
      )}
      
      {showDetailed && campaign.milestones?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Milestones</h4>
          <div className="space-y-1">
            {campaign.milestones.map((milestone, idx) => (
              <div key={idx} className={`flex items-center gap-2 text-sm ${
                milestone.unlocked ? 'text-green-700' : 'text-neutral-500'
              }`}>
                <span className={`text-lg ${milestone.unlocked ? '✅' : '🔒'}`} />
                <span className={milestone.unlocked ? 'font-medium' : ''}>
                  {milestone.percentage}% - {milestone.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

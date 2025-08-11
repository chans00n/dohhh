import {Link} from 'react-router';
import type {Campaign} from '~/lib/campaigns';
import {Progress} from '~/components/ui/progress';
import {Badge} from '~/components/ui/badge';
import {Avatar, AvatarImage, AvatarFallback} from '~/components/ui/avatar';
import {Card, CardContent, CardHeader} from '~/components/ui/card';

export function CampaignCard({campaign}: {campaign: Campaign}) {
  const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isFunded = campaign.progress.percentage >= 100;
  
  return (
    <Link to={`/campaigns/${campaign.slug}`} prefetch="intent" className="block group">
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-amber-400 to-orange-600 p-6">
          <div className="absolute top-4 right-4">
            <Badge variant={isFunded ? 'success' : 'default'} className="shadow-sm">
              {isFunded ? '✨ Funded!' : `${daysLeft} days left`}
            </Badge>
          </div>
          <div className="flex items-end h-full">
            <Avatar size="xl" className="border-4 border-white shadow-lg">
              <AvatarImage src={campaign.organizerInfo.avatar} alt={campaign.organizerInfo.name} />
              <AvatarFallback className="bg-amber-200 text-amber-800 text-xl font-bold">
                {campaign.organizerInfo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
              {campaign.name}
            </h3>
            <p className="text-sm text-neutral-600 mt-1">by {campaign.organizerInfo.name}</p>
          </div>
          
          <p className="text-sm text-neutral-700 line-clamp-2">
            {campaign.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-neutral-900">
                {campaign.progress.percentage}% funded
              </span>
              <span className="text-neutral-600">
                {campaign.progress.backerCount} backers
              </span>
            </div>
            <Progress value={campaign.progress.percentage} size="md" showAnimation={true} />
            <div className="flex justify-between items-center text-xs text-neutral-600">
              <span>{campaign.progress.currentQuantity} cookies</span>
              <span className="font-medium">Goal: {campaign.goal.quantity}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

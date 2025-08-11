import React from 'react';
import {Avatar, AvatarFallback} from '~/components/ui/avatar';
import {Badge} from '~/components/ui/badge';

export interface BackerEntry {
  name?: string;
  email?: string;
  quantity: number;
  amount: number;
  orderId: string;
  createdAt: string;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export function CampaignBackerFeed({json}: {json?: string}) {
  if (!json) return null;
  let entries: BackerEntry[] = [];
  try {
    entries = JSON.parse(json) as BackerEntry[];
  } catch {
    return null;
  }
  if (!entries.length) return null;
  
  // Get recent entries
  const recentEntries = entries.slice(-10).reverse();
  const totalBacked = entries.reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
          <p className="text-sm text-neutral-600">{entries.length} total backers</p>
        </div>
        <Badge variant="success" className="text-sm">
          ${totalBacked.toLocaleString()} raised
        </Badge>
      </div>
      
      <div className="space-y-3">
        {recentEntries.map((b, i) => {
          const displayName = b.name || b.email?.split('@')[0] || 'Anonymous';
          const initials = getInitials(b.name, b.email);
          const timeAgo = getTimeAgo(b.createdAt);
          
          return (
            <div key={`${b.orderId}-${i}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-amber-50 transition-colors animate-fade-in">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900">{displayName}</span>
                    <span className="text-neutral-600 text-sm ml-2">backed {b.quantity} dozen</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">${b.amount.toFixed(2)}</div>
                    <div className="text-xs text-neutral-500">{timeAgo}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {entries.length > 10 && (
        <p className="text-center text-sm text-neutral-600">
          And {entries.length - 10} more backers...
        </p>
      )}
    </div>
  );
}



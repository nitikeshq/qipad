import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconColor?: string;
}

export function StatsCard({ title, value, icon: Icon, change, changeType = 'neutral', iconColor = 'text-primary' }: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm" data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center">
        <div className={`p-2 ${iconColor.includes('green') ? 'bg-green-500/10' : iconColor.includes('blue') ? 'bg-blue-500/10' : iconColor.includes('purple') ? 'bg-purple-500/10' : 'bg-primary/10'} rounded-lg`}>
          <Icon className={`${iconColor} text-xl`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
            {value}
          </p>
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <span className={`text-sm px-2 py-1 rounded-full ${changeColors[changeType]}`} data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-change`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}

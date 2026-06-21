import { Crown, Shield, MapPin, Building, Users, BookOpen } from 'lucide-react';
import type { UserRole } from '@shared/types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'minimal' | 'prominent';
}

const roleConfig: Record<UserRole, {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  kore_admin: {
    label: 'Super Admin',
    icon: Crown,
    color: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.1)',
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  tenant_admin: {
    label: 'Admin',
    icon: Shield,
    color: '#c15c42',
    bgColor: 'rgba(193, 92, 66, 0.1)',
    borderColor: 'rgba(193, 92, 66, 0.3)',
  },
  regional_manager: {
    label: 'Regional Manager',
    icon: MapPin,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  multisite_manager: {
    label: 'Multisite Manager',
    icon: Building,
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  store_manager: {
    label: 'Store Manager',
    icon: Users,
    color: '#c15c42',
    bgColor: 'rgba(193, 92, 66, 0.1)',
    borderColor: 'rgba(193, 92, 66, 0.3)',
  },
  learner: {
    label: 'Mitarbeiter',
    icon: BookOpen,
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    borderColor: 'rgba(8, 145, 178, 0.3)',
  },
};

const sizeConfig = {
  small: {
    padding: 'px-xs py-[1px]',
    textSize: 'text-[0.6rem]',
    iconSize: 10,
    gap: 'gap-[2px]',
  },
  medium: {
    padding: 'px-sm py-[2px]',
    textSize: 'text-[0.65rem]',
    iconSize: 12,
    gap: 'gap-xs',
  },
  large: {
    padding: 'px-md py-xs',
    textSize: 'text-small',
    iconSize: 14,
    gap: 'gap-sm',
  },
};

export function RoleBadge({ 
  role, 
  size = 'medium', 
  showIcon = true, 
  showLabel = true,
  variant = 'default'
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  if (variant === 'minimal') {
    return (
      <span 
        className={`inline-flex items-center ${sizeConf.gap} font-body ${sizeConf.textSize} font-medium`}
        style={{ color: config.color }}
      >
        {showIcon && <Icon size={sizeConf.iconSize} />}
        {showLabel && config.label}
      </span>
    );
  }

  if (variant === 'prominent') {
    return (
      <div
        className={`inline-flex items-center ${sizeConf.gap} ${sizeConf.padding} rounded-md border font-body ${sizeConf.textSize} font-medium shadow-sm`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          color: config.color,
          boxShadow: `0 1px 2px ${config.color}15`,
        }}
      >
        {showIcon && <Icon size={sizeConf.iconSize} />}
        {showLabel && <span>{config.label}</span>}
      </div>
    );
  }

  // Default variant
  return (
    <span
      className={`inline-flex items-center ${sizeConf.gap} ${sizeConf.padding} rounded font-body ${sizeConf.textSize} font-medium uppercase tracking-[0.08em]`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {showIcon && <Icon size={sizeConf.iconSize} />}
      {showLabel && config.label}
    </span>
  );
}
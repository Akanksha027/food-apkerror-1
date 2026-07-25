export type OwnerOrderItem = {
  name: string;
  quantity: number;
};

export type OwnerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  items: OwnerOrderItem[];
  total?: number;
  fulfillmentLabel: string;
  fulfillmentTone: 'table' | 'delivery' | 'pickup';
  createdAt?: string;
};

export type DashboardInsight = {
  title: string;
  subtitle: string;
  trendPercent: number;
};

export type DashboardMetrics = {
  grossRevenue: number;
  revenueTrendPercent: number;
  yesterdayRevenue: number;
  revenueBars: number[];
  rating: number;
  ratingMax: number;
  totalRatings: number;
  avgDeliveryMinutes: number;
  isOnline: boolean;
};

export type DashboardQuickActions = {
  activeOrders: number;
  menuItems: number;
  activePromos: number;
};

export type DashboardData = {
  restaurantId: string;
  restaurantName: string;
  city?: string;
  logoUrl?: string;
  insight: DashboardInsight;
  metrics: DashboardMetrics;
  quickActions: DashboardQuickActions;
  pendingOrders: OwnerOrder[];
};

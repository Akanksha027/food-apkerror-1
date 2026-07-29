/**
 * Delivery Service API types.
 * Gateway prefix: /api/v1/delivery-service
 * Routes: /deliveries, /delivery-partners, /tracking
 */

export type DeliveryStatus = 
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type DeliveryPartner = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: 'bike' | 'scooter' | 'bicycle' | 'car';
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  imageUrl?: string;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    lastUpdate: string;
  };
};

export type DeliveryLocation = {
  address: string;
  lat: number;
  lng: number;
  instructions?: string;
  contactName?: string;
  contactPhone?: string;
};

export type DeliveryTracking = {
  id: string;
  orderId: string;
  partnerId?: string;
  partner?: DeliveryPartner;
  status: DeliveryStatus;
  pickupLocation: DeliveryLocation;
  dropoffLocation: DeliveryLocation;
  estimatedTime?: number; // minutes
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  route?: {
    coordinates: [number, number][]; // [lng, lat] pairs
    distance: number; // in meters
    duration: number; // in seconds
  };
  timeline: DeliveryTimelineEvent[];
  otp?: string;
  proofOfDelivery?: {
    type: 'photo' | 'signature' | 'otp';
    url?: string;
    signature?: string;
    verifiedAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type DeliveryTimelineEvent = {
  id: string;
  status: DeliveryStatus;
  message: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  imageUrl?: string;
};

export type DeliveryEstimate = {
  estimatedTime: number; // minutes
  distance: number; // km
  fee: number;
  currency: string;
  breakdown?: {
    baseFee: number;
    distanceFee: number;
    timeFee: number;
    surcharge?: number;
    discount?: number;
  };
};

export type CreateDeliveryPayload = {
  orderId: string;
  pickupLocation: Omit<DeliveryLocation, 'contactName' | 'contactPhone'> & {
    restaurantId: string;
  };
  dropoffLocation: DeliveryLocation;
  preferredPartnerType?: 'bike' | 'scooter' | 'bicycle' | 'car';
  priority?: 'normal' | 'high' | 'urgent';
  scheduledFor?: string;
  specialInstructions?: string;
};

export type UpdateDeliveryStatusPayload = {
  status: DeliveryStatus;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  imageUrl?: string;
  otp?: string;
};

export type DeliveryListResult = {
  deliveries: DeliveryTracking[];
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
};
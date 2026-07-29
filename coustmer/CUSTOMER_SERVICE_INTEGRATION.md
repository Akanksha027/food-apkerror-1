# Customer Service Integration Guide

This document provides a comprehensive overview of how customer service is integrated into the TOKAJO FOODS Expo app.

## Overview

The customer service system provides:
- **Personalized home feed** with banners and restaurant recommendations
- **Deals and promotional offers** management
- **Customer profile and loyalty system** with tier management
- **Favorites management** with seamless synchronization
- **Support ticket system** with real-time messaging
- **Onboarding flow** for new customers
- **Customer analytics and insights**

## API Integration

### Base Configuration
- **Gateway Prefix**: `/api/v1/customer-service`
- **Internal Base**: `/`
- **Routes Mounted At**: `/customers`

### Authentication
All customer service endpoints use the app's existing authentication system:
- JWT tokens for authenticated requests
- Session cookies for web requests
- CSRF protection for mutating operations

## Key Components

### 1. Customer Profile Integration (`ProfileHubScreen.tsx`)
- Displays customer loyalty stats (orders, spend, points, tier)
- Shows active support tickets status
- Integrates with existing profile management

### 2. Home Feed Enhancement (`home.tsx`)
- Onboarding prompts for new customers
- Personalized restaurant recommendations
- Dynamic banner and offer system

### 3. Support System (`/support/*`)
- Ticket creation and management
- Real-time messaging system
- Support analytics dashboard
- Service status monitoring

### 4. Customer Dashboard (`CustomerDashboard.tsx`)
- Centralized customer metrics
- Quick access to key features
- Visual status indicators

## API Endpoints

### Core Customer Data
- `GET /customers/home` - Personalized home feed
- `GET /customers/me` - Customer profile data
- `GET /customers/deals` - Active deals and offers
- `GET /customers/recommended` - AI-powered recommendations

### Favorites Management
- `GET /customers/me/favorites` - Get favorite restaurants
- `POST /customers/me/favorites/:id` - Add to favorites
- `DELETE /customers/me/favorites/:id` - Remove from favorites

### Support System
- `POST /customers/support/tickets` - Create support ticket
- `GET /customers/support/tickets` - List all tickets
- `GET /customers/support/tickets/:id` - Get ticket details
- `POST /customers/support/tickets/:id/messages` - Add message
- `POST /customers/support/tickets/:id/rate` - Rate support

### Onboarding
- `GET /customers/onboarding/status` - Get onboarding progress
- `POST /customers/onboarding/complete` - Complete onboarding step

## Error Handling

### Enhanced Error Management (`error-handler.ts`)
- Network error detection and recovery
- Authentication error handling
- CORS and CSRF error management
- User-friendly error messages
- Automatic retry logic with exponential backoff

### Service Status Monitoring (`CustomerServiceStatus.tsx`)
- Real-time service connectivity checks
- Graceful degradation when service is unavailable
- User notifications for service interruptions

## State Management

### React Query Integration
All customer service data uses React Query for:
- Caching and synchronization
- Background updates
- Optimistic updates
- Error boundaries

### Key Query Keys
```typescript
export const customerKeys = {
  all: ['customer'] as const,
  home: () => [...customerKeys.all, 'home'] as const,
  deals: () => [...customerKeys.all, 'deals'] as const,
  profile: () => [...customerKeys.all, 'profile'] as const,
  favorites: () => [...customerKeys.all, 'favorites'] as const,
  tickets: () => [...customerKeys.all, 'tickets'] as const,
  // ... more keys
};
```

## User Experience Features

### 1. Onboarding System (`OnboardingPrompt.tsx`)
- Progressive profile completion
- Step-by-step guidance
- Progress tracking
- Dismissible prompts

### 2. Service Notifications (`ServiceNotifications.tsx`)
- Real-time ticket updates
- Service status changes
- Error notifications
- Action buttons for quick resolution

### 3. Customer Analytics
- Order history tracking
- Spending analytics
- Loyalty point management
- Tier progression

## Implementation Examples

### Adding Customer Service to a New Screen
```typescript
import { useCustomerProfile, useTickets } from '@/lib/customer/hooks';

function MyNewScreen() {
  const customerProfile = useCustomerProfile();
  const tickets = useTickets();
  
  // Use customer data
  const loyaltyPoints = customerProfile.data?.loyaltyPoints ?? 0;
  const hasActiveTickets = tickets.data?.tickets?.some(
    t => t.status === 'open' || t.status === 'in_progress'
  ) ?? false;
  
  return (
    <View>
      <Text>Loyalty Points: {loyaltyPoints}</Text>
      {hasActiveTickets && (
        <Text>You have active support tickets</Text>
      )}
    </View>
  );
}
```

### Creating a Support Ticket
```typescript
import { useCreateTicket } from '@/lib/customer/hooks';

function CreateTicketExample() {
  const createTicket = useCreateTicket();
  
  const handleSubmit = () => {
    createTicket.mutate({
      category: 'order_issue',
      subject: 'Order not delivered',
      description: 'My order was marked as delivered but I never received it.',
    });
  };
  
  return (
    <Button onPress={handleSubmit} disabled={createTicket.isPending}>
      {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
    </Button>
  );
}
```

### Managing Favorites
```typescript
import { useFavoriteToggle } from '@/lib/customer/useFavoriteToggle';

function RestaurantCard({ restaurant }) {
  const { favoriteIds, toggleFavorite } = useFavoriteToggle();
  const isFavorite = favoriteIds.includes(restaurant.id);
  
  return (
    <View>
      <Text>{restaurant.name}</Text>
      <Button
        onPress={() => toggleFavorite(restaurant.id, { restaurant })}
      >
        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      </Button>
    </View>
  );
}
```

## Performance Considerations

### 1. Data Fetching
- Background refresh for stale data
- Conditional loading based on user authentication
- Pagination for large datasets (tickets, orders)

### 2. Caching Strategy
- 5-minute cache for profile data
- 1-minute cache for dynamic content (deals, recommendations)
- Infinite cache for user preferences

### 3. Error Recovery
- Automatic retry with exponential backoff
- Fallback to cached data when service unavailable
- Progressive enhancement approach

## Testing

### Unit Tests
- API function testing with mocked responses
- Error handling validation
- State management verification

### Integration Tests
- End-to-end ticket creation flow
- Favorites synchronization
- Onboarding completion

### Performance Tests
- API response time monitoring
- Cache hit/miss ratios
- Error rate tracking

## Monitoring and Analytics

### Service Health
- API endpoint availability
- Response time metrics
- Error rate tracking

### User Engagement
- Onboarding completion rates
- Support ticket resolution times
- Customer satisfaction scores (CSAT)

### Business Metrics
- Customer loyalty progression
- Support ticket categories
- Feature adoption rates

## Security Considerations

### Data Protection
- PII data encryption
- Secure token handling
- Session management

### API Security
- Rate limiting implementation
- Input validation and sanitization
- CSRF protection

### Privacy Compliance
- Data retention policies
- User consent management
- Data export/deletion capabilities

## Future Enhancements

### Planned Features
1. **Push Notifications** for ticket updates
2. **Chat Integration** for real-time support
3. **AI-Powered Recommendations** enhancement
4. **Loyalty Program** gamification
5. **Social Features** (reviews, ratings)

### Technical Improvements
1. **Offline Support** with sync capabilities
2. **Advanced Caching** with service workers
3. **Real-time Updates** with WebSocket integration
4. **Performance Monitoring** with detailed analytics
5. **A/B Testing** framework for feature optimization

This integration provides a robust, scalable foundation for customer service functionality while maintaining excellent user experience and system performance.
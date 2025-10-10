# Metrics & Guardrails Documentation

## Overview

This document outlines the investor-grade metrics and guardrails system implemented for comprehensive analytics, performance monitoring, and cost control. The system provides real-time insights into unit economics, user behavior, and system performance.

## Key Metrics Tracked

### 1. Retention Metrics (D1/W1)

**Purpose**: Measure user engagement and product-market fit

**Metrics**:
- **D1 Retention**: Percentage of users who return the day after signup
- **W1 Retention**: Percentage of users who return within the first week
- **Target Thresholds**:
  - D1 Retention: ≥40% (Good), ≥20% (Warning), <20% (Critical)
  - W1 Retention: ≥20% (Good), ≥10% (Warning), <10% (Critical)

**Data Sources**:
- `user_retention_metrics` table
- Automatic tracking via session triggers
- Cohort analysis by signup date

### 2. Session Completion & Verification

**Purpose**: Measure product quality and user satisfaction

**Metrics**:
- **Session Completion Rate**: Percentage of started sessions that are completed
- **Verification Rate**: Percentage of sessions that pass quality verification
- **Target Thresholds**:
  - Session Completion: ≥80% (Good), ≥60% (Warning), <60% (Critical)
  - Verification Rate: ≥70% (Good), ≥50% (Warning), <50% (Critical)

**Data Sources**:
- `sessions` table with `ended_at` and `verified` columns
- Real-time calculation via SQL functions

### 3. Pro Conversion & Pack Attach Rate

**Purpose**: Measure monetization effectiveness

**Metrics**:
- **Pro Trial Rate**: Percentage of users who start a Pro trial
- **Pro Conversion Rate**: Percentage of trial users who convert to paid
- **Pack Attach Rate**: Percentage of users who purchase Creator Packs
- **Target Thresholds**:
  - Pro Trial Rate: ≥10% (Good), ≥5% (Warning), <5% (Critical)
  - Pro Conversion Rate: ≥20% (Good), ≥10% (Warning), <10% (Critical)
  - Pack Attach Rate: ≥5% (Good), ≥2% (Warning), <2% (Critical)

**Data Sources**:
- `conversion_funnel` table
- `user_subscriptions` table
- `coach_pack_purchases` table

### 4. Quality Metrics

**Purpose**: Measure technical performance and user experience

**Metrics**:
- **Median FPS**: Median frames per second during pose detection
- **Visibility Rate**: Percentage of time with good pose visibility
- **Undo Rate**: Percentage of reps that were undone (false positives)
- **Average Confidence**: Average pose detection confidence score
- **Target Thresholds**:
  - Median FPS: ≥30 (Good), ≥20 (Warning), <20 (Critical)
  - Visibility Rate: ≥80% (Good), ≥60% (Warning), <60% (Critical)
  - Undo Rate: ≤10% (Good), ≤20% (Warning), >20% (Critical)
  - Average Confidence: ≥80% (Good), ≥60% (Warning), <60% (Critical)

**Data Sources**:
- `session_quality_metrics` table
- Real-time tracking during sessions

## Performance Guardrails

### 1. Device Processing Rate

**Metric**: Percentage of sessions processed entirely on device
**Target**: ≥95% of sessions
**Purpose**: Minimize server costs and ensure offline capability
**Monitoring**: Real-time via session tracking

### 2. API Latency

**Metric**: Median API response time
**Target**: ≤150ms
**Purpose**: Ensure responsive user experience
**Monitoring**: Tracked per API call and aggregated

### 3. Storage per Active User

**Metric**: Database storage usage per active user per month
**Target**: ≤50MB per active user
**Purpose**: Control infrastructure costs
**Monitoring**: Calculated monthly from database size and active users

## Cost Guardrails

### 1. Infrastructure Costs

**Targets**:
- Database storage: <$0.10 per active user per month
- API calls: <$0.01 per session
- CDN/bandwidth: <$0.05 per user per month

### 2. Processing Costs

**Targets**:
- Device processing: ≥95% of sessions (minimize server costs)
- Server processing: <5% of sessions (emergency fallback only)
- AI/ML processing: <$0.02 per session

### 3. Support Costs

**Targets**:
- Support tickets: <2% of active users per month
- Response time: <24 hours for critical issues
- Resolution time: <72 hours for 90% of issues

## Database Schema

### Core Tables

1. **analytics_events_enhanced**: Comprehensive event tracking
2. **user_retention_metrics**: Cohort-based retention tracking
3. **session_quality_metrics**: Technical performance metrics
4. **conversion_funnel**: User journey and conversion tracking
5. **performance_guardrails**: System performance monitoring
6. **cost_guardrails**: Cost and resource usage tracking

### Key Functions

1. **calculate_retention_metrics()**: D1/W1 retention calculation
2. **calculate_session_metrics()**: Session completion and verification rates
3. **calculate_pro_conversion_metrics()**: Monetization metrics
4. **calculate_quality_metrics()**: Technical quality metrics
5. **check_performance_guardrails()**: Performance threshold monitoring

## API Endpoints

### Internal Analytics APIs

- `GET /api/analytics/dashboard`: Comprehensive dashboard data
- `GET /api/analytics/retention`: Retention metrics
- `GET /api/analytics/sessions`: Session metrics
- `GET /api/analytics/conversion`: Conversion metrics
- `GET /api/analytics/quality`: Quality metrics
- `GET /api/analytics/guardrails`: Performance guardrails
- `POST /api/analytics/track`: Event tracking

### Access Control

- All endpoints require authentication
- Internal dashboard at `/internal/analytics` (restricted access)
- Real-time monitoring and alerting capabilities

## Monitoring & Alerting

### Real-time Monitoring

1. **Performance Metrics**: Tracked continuously during sessions
2. **Error Rates**: Monitored via error events
3. **API Latency**: Measured per request
4. **Storage Usage**: Calculated daily

### Alerting Thresholds

1. **Critical Alerts**:
   - D1 Retention < 15%
   - Session Completion < 50%
   - API Latency > 500ms
   - Error Rate > 5%

2. **Warning Alerts**:
   - D1 Retention < 25%
   - Session Completion < 70%
   - API Latency > 200ms
   - Error Rate > 2%

### Alert Channels

- Email notifications for critical issues
- Slack integration for real-time monitoring
- Dashboard status indicators
- Automated escalation procedures

## Data Privacy & Security

### Data Collection

- All user data collection follows GDPR/CCPA guidelines
- Personal information is minimized and anonymized where possible
- User consent is obtained for analytics tracking
- Data retention policies are enforced

### Access Control

- Analytics data is restricted to authorized personnel
- Role-based access control for different metric types
- Audit logging for all data access
- Regular security reviews and updates

## Implementation Guide

### Setting Up Tracking

1. **Initialize Analytics Service**:
   ```typescript
   import { analyticsTracker } from '@/lib/analytics/tracking';
   await analyticsTracker.initialize();
   ```

2. **Track User Events**:
   ```typescript
   await analyticsTracker.trackConversion('signup_complete', { source: 'organic' }, userId);
   await analyticsTracker.trackRetention('user_first_session', { totalSessions: 1 }, userId, sessionId);
   ```

3. **Record Session Quality**:
   ```typescript
   await analyticsTracker.recordSessionQualityMetrics(sessionId, userId, {
     medianFps: 30,
     lowVisibilityRate: 0.1,
     averagePoseConfidence: 0.85,
     deviceType: 'mobile'
   });
   ```

### Dashboard Access

1. Navigate to `/internal/analytics`
2. Authenticate with admin credentials
3. Select time range and filters
4. Monitor real-time metrics and guardrails

### Custom Metrics

To add new metrics:

1. Update database schema with new tables/columns
2. Add tracking functions to `AnalyticsService`
3. Create API endpoints for new metrics
4. Update dashboard UI components
5. Set appropriate thresholds and alerting

## Troubleshooting

### Common Issues

1. **Missing Data**: Check if events are being tracked properly
2. **Slow Queries**: Optimize database indexes and query performance
3. **High Latency**: Review API performance and caching strategies
4. **Storage Growth**: Implement data retention and archiving policies

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Query Optimization**: Use efficient SQL queries and avoid N+1 problems
3. **Caching**: Implement Redis caching for frequently accessed metrics
4. **Data Archiving**: Archive old data to maintain performance

## Future Enhancements

### Planned Features

1. **Predictive Analytics**: ML-based retention and conversion prediction
2. **A/B Testing Integration**: Built-in experimentation framework
3. **Advanced Segmentation**: User cohort analysis and behavioral segmentation
4. **Real-time Dashboards**: Live updating metrics and alerts
5. **Mobile Analytics**: Dedicated mobile app analytics tracking

### Scalability Considerations

1. **Data Partitioning**: Partition large tables by date or user segments
2. **Read Replicas**: Use read replicas for analytics queries
3. **Data Warehousing**: Consider data warehouse for complex analytics
4. **Stream Processing**: Implement real-time stream processing for high-volume events

## Conclusion

The Metrics & Guardrails system provides comprehensive visibility into product performance, user behavior, and system health. By monitoring key metrics and maintaining performance thresholds, we can ensure sustainable growth and optimal user experience while controlling costs and maintaining system reliability.

Regular review and optimization of these metrics will help drive data-driven decision making and continuous product improvement.

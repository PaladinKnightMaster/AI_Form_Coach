# AI Form Coach - Metrics & KPIs Documentation

## Overview

This document outlines the key metrics and KPIs tracked for AI Form Coach. These metrics are used for investor reporting, product decisions, and business optimization.

---

## Executive Summary

AI Form Coach tracks **investor-grade metrics** across four key areas:
1. **User Engagement & Retention** - Product-market fit indicators
2. **Product Quality** - Technical performance and user satisfaction
3. **Monetization** - Revenue and conversion metrics
4. **Operational Excellence** - System performance and cost efficiency

---

## 1. User Engagement & Retention Metrics

### Primary Metrics

#### D1 Retention (Day 1 Retention)
**Definition**: Percentage of users who return the day after signup

**Calculation**: 
```
D1 Retention = (Users active on Day 1 after signup) / (Total signups) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥40%
- ⚠️ **Warning**: ≥20%
- 🔴 **Critical**: <20%

**Why It Matters**: 
- Indicates immediate product value
- Strong predictor of long-term retention
- Measures first-impression quality

**Sales/Marketing Use**:
- "40% of users return the next day - showing strong product-market fit"
- "High D1 retention indicates users find immediate value"

---

#### W1 Retention (Week 1 Retention)
**Definition**: Percentage of users who return within the first week

**Calculation**:
```
W1 Retention = (Users active within 7 days of signup) / (Total signups) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥20%
- ⚠️ **Warning**: ≥10%
- 🔴 **Critical**: <10%

**Why It Matters**:
- Indicates habit formation
- Predicts long-term engagement
- Measures onboarding effectiveness

**Sales/Marketing Use**:
- "20% of users are still active after one week - strong engagement"
- "Week 1 retention shows users are forming fitness habits"

---

#### Monthly Active Users (MAU)
**Definition**: Number of unique users active in the past 30 days

**Calculation**: Count of unique users with activity in last 30 days

**Target**: Growth rate of 10-20% month-over-month (early stage)

**Why It Matters**:
- Core growth metric
- Indicates product adoption
- Foundation for revenue growth

---

#### Daily Active Users (DAU)
**Definition**: Number of unique users active in the past 24 hours

**Calculation**: Count of unique users with activity in last 24 hours

**Target**: DAU/MAU ratio of ≥20% (indicates strong engagement)

**Why It Matters**:
- Measures daily engagement
- Indicates habit strength
- Predicts retention

---

### Cohort Analysis

#### Retention by Cohort
Track retention rates by signup date to identify trends:
- Improving retention = product improvements working
- Declining retention = need to investigate

#### Feature Adoption by Cohort
Track which features drive retention:
- Users who use AI plans vs. those who don't
- Users who track nutrition vs. those who don't
- Correlation between feature usage and retention

---

## 2. Product Quality Metrics

### Session Quality Metrics

#### Session Completion Rate
**Definition**: Percentage of started sessions that are completed

**Calculation**:
```
Session Completion Rate = (Completed sessions) / (Started sessions) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥80%
- ⚠️ **Warning**: ≥60%
- 🔴 **Critical**: <60%

**Why It Matters**:
- Indicates user satisfaction
- Measures product usability
- Predicts retention

**Sales/Marketing Use**:
- "80% of users complete their sessions - showing high satisfaction"
- "High completion rate indicates users find value in workouts"

---

#### Session Verification Rate
**Definition**: Percentage of sessions that pass quality verification

**Calculation**:
```
Verification Rate = (Verified sessions) / (Total sessions) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥70%
- ⚠️ **Warning**: ≥50%
- 🔴 **Critical**: <50%

**Why It Matters**:
- Ensures data quality
- Maintains leaderboard integrity
- Indicates proper form usage

**Sales/Marketing Use**:
- "70% of sessions pass verification - ensuring fair competition"
- "High verification rate shows users are using proper form"

---

### Technical Performance Metrics

#### Median FPS (Frames Per Second)
**Definition**: Median frames per second during pose detection

**Target Thresholds**:
- ✅ **Good**: ≥30 FPS
- ⚠️ **Warning**: ≥20 FPS
- 🔴 **Critical**: <20 FPS

**Why It Matters**:
- Measures real-time performance
- Affects user experience
- Indicates system optimization

---

#### Visibility Rate
**Definition**: Percentage of time with good pose visibility

**Target Thresholds**:
- ✅ **Good**: ≥80%
- ⚠️ **Warning**: ≥60%
- 🔴 **Critical**: <60%

**Why It Matters**:
- Measures pose detection quality
- Affects form analysis accuracy
- Indicates user positioning

---

#### Average Pose Confidence
**Definition**: Average pose detection confidence score

**Target Thresholds**:
- ✅ **Good**: ≥80%
- ⚠️ **Warning**: ≥60%
- 🔴 **Critical**: <60%

**Why It Matters**:
- Measures detection accuracy
- Affects feedback quality
- Indicates system reliability

---

#### False Rep Undo Rate
**Definition**: Percentage of reps that were undone (false positives)

**Target Thresholds**:
- ✅ **Good**: ≤10%
- ⚠️ **Warning**: ≤20%
- 🔴 **Critical**: >20%

**Why It Matters**:
- Measures rep counting accuracy
- Affects user trust
- Indicates algorithm quality

---

## 3. Monetization Metrics

### Conversion Metrics

#### Pro Trial Rate
**Definition**: Percentage of users who start a Pro trial

**Calculation**:
```
Pro Trial Rate = (Users who start Pro trial) / (Total users) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥10%
- ⚠️ **Warning**: ≥5%
- 🔴 **Critical**: <5%

**Why It Matters**:
- Measures upgrade interest
- Indicates value proposition strength
- Predicts revenue potential

**Sales/Marketing Use**:
- "10% of users try Pro - showing strong upgrade interest"
- "High trial rate indicates compelling value proposition"

---

#### Pro Conversion Rate
**Definition**: Percentage of trial users who convert to paid

**Calculation**:
```
Pro Conversion Rate = (Paid Pro users) / (Pro trial users) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥20%
- ⚠️ **Warning**: ≥10%
- 🔴 **Critical**: <10%

**Why It Matters**:
- Measures trial-to-paid effectiveness
- Indicates product value
- Predicts revenue growth

**Sales/Marketing Use**:
- "20% of trial users convert to paid - strong conversion"
- "High conversion rate shows Pro delivers value"

---

#### Pack Attach Rate
**Definition**: Percentage of users who purchase Creator Packs

**Calculation**:
```
Pack Attach Rate = (Users who purchase packs) / (Total users) × 100
```

**Target Thresholds**:
- ✅ **Good**: ≥5%
- ⚠️ **Warning**: ≥2%
- 🔴 **Critical**: <2%

**Why It Matters**:
- Measures additional revenue potential
- Indicates content value
- Diversifies revenue streams

---

### Revenue Metrics

#### Monthly Recurring Revenue (MRR)
**Definition**: Total monthly subscription revenue

**Calculation**: Sum of all active Pro subscriptions (monthly + annual/12)

**Target**: Growth rate of 15-25% month-over-month (early stage)

**Why It Matters**:
- Core revenue metric
- Predicts annual revenue
- Measures business health

---

#### Annual Recurring Revenue (ARR)
**Definition**: MRR × 12

**Calculation**: MRR × 12

**Target**: Growth rate aligned with MRR growth

**Why It Matters**:
- Standard SaaS metric
- Used for valuations
- Predicts long-term revenue

---

#### Average Revenue Per User (ARPU)
**Definition**: Total revenue divided by active users

**Calculation**:
```
ARPU = Total Revenue / Active Users
```

**Target**: Increase over time as more users upgrade to Pro

**Why It Matters**:
- Measures monetization efficiency
- Indicates pricing effectiveness
- Predicts revenue potential

---

#### Customer Lifetime Value (LTV)
**Definition**: Average revenue per customer over their lifetime

**Calculation**:
```
LTV = ARPU × Average Customer Lifespan
```

**Target**: LTV/CAC ratio of ≥3:1 (healthy business)

**Why It Matters**:
- Measures customer value
- Predicts long-term revenue
- Used for acquisition decisions

---

#### Customer Acquisition Cost (CAC)
**Definition**: Cost to acquire one customer

**Calculation**:
```
CAC = Total Marketing & Sales Costs / New Customers Acquired
```

**Target**: LTV/CAC ratio of ≥3:1

**Why It Matters**:
- Measures acquisition efficiency
- Predicts profitability
- Guides marketing spend

---

#### Churn Rate
**Definition**: Percentage of customers who cancel per month

**Calculation**:
```
Monthly Churn = (Cancellations in month) / (Customers at start of month) × 100
```

**Target Thresholds**:
- ✅ **Good**: <5%
- ⚠️ **Warning**: <10%
- 🔴 **Critical**: ≥10%

**Why It Matters**:
- Measures retention
- Predicts revenue stability
- Indicates product satisfaction

---

## 4. Operational Excellence Metrics

### Performance Guardrails

#### Device Processing Rate
**Definition**: Percentage of sessions processed entirely on device

**Target**: ≥95% of sessions

**Why It Matters**:
- Minimizes server costs
- Ensures offline capability
- Maintains privacy

---

#### API Latency
**Definition**: Median API response time

**Target**: ≤150ms

**Why It Matters**:
- Affects user experience
- Measures system performance
- Predicts scalability

---

#### Storage per Active User
**Definition**: Database storage usage per active user per month

**Target**: ≤50MB per active user

**Why It Matters**:
- Controls infrastructure costs
- Predicts scaling needs
- Measures data efficiency

---

### Cost Metrics

#### Infrastructure Costs
**Targets**:
- Database storage: <$0.10 per active user per month
- API calls: <$0.01 per session
- CDN/bandwidth: <$0.05 per user per month

**Why It Matters**:
- Controls unit economics
- Predicts profitability
- Guides scaling decisions

---

#### Processing Costs
**Targets**:
- Device processing: ≥95% of sessions
- Server processing: <5% of sessions
- AI/ML processing: <$0.02 per session

**Why It Matters**:
- Minimizes operational costs
- Maintains privacy
- Ensures scalability

---

#### Support Costs
**Targets**:
- Support tickets: <2% of active users per month
- Response time: <24 hours for critical issues
- Resolution time: <72 hours for 90% of issues

**Why It Matters**:
- Measures customer satisfaction
- Controls support costs
- Indicates product quality

---

## Metrics Dashboard

### Real-Time Monitoring

The platform includes a comprehensive analytics dashboard at `/internal/analytics` that tracks:

1. **Retention Metrics**: D1/W1 retention, cohort analysis
2. **Session Quality**: Completion rate, verification rate, FPS, visibility
3. **Conversion Metrics**: Trial rate, conversion rate, pack attach rate
4. **Performance**: API latency, device processing rate, storage usage
5. **Costs**: Infrastructure costs, processing costs, support costs

### Alerting System

Automated alerts trigger when metrics fall below thresholds:
- **Critical Alerts**: Immediate action required
- **Warning Alerts**: Monitor and investigate
- **Info Alerts**: Track trends

---

## Using Metrics for Sales & Marketing

### Investor Presentations
- Highlight strong retention metrics (D1 ≥40%, W1 ≥20%)
- Show conversion metrics (Pro trial ≥10%, conversion ≥20%)
- Demonstrate unit economics (LTV/CAC ≥3:1)
- Present growth trajectory (MRR growth, user growth)

### Marketing Materials
- "40% of users return the next day - showing strong product-market fit"
- "80% session completion rate - users find real value"
- "20% Pro conversion rate - compelling value proposition"
- "95% on-device processing - privacy-first architecture"

### Sales Conversations
- Use retention metrics to show product-market fit
- Use conversion metrics to show monetization potential
- Use quality metrics to show technical excellence
- Use cost metrics to show operational efficiency

---

## Metric Targets Summary

### Engagement & Retention
- D1 Retention: ≥40% (Good)
- W1 Retention: ≥20% (Good)
- Session Completion: ≥80% (Good)
- Monthly Churn: <5% (Good)

### Quality
- Verification Rate: ≥70% (Good)
- Median FPS: ≥30 (Good)
- Visibility Rate: ≥80% (Good)
- Average Confidence: ≥80% (Good)

### Monetization
- Pro Trial Rate: ≥10% (Good)
- Pro Conversion Rate: ≥20% (Good)
- Pack Attach Rate: ≥5% (Good)
- LTV/CAC Ratio: ≥3:1 (Good)

### Operations
- Device Processing: ≥95% (Good)
- API Latency: ≤150ms (Good)
- Storage per User: ≤50MB (Good)
- Support Tickets: <2% of users (Good)

---

## Data Sources

### Database Tables
- `user_retention_metrics` - Retention tracking
- `sessions` - Session data and completion
- `analytics_events_enhanced` - Event tracking
- `conversion_funnel` - Conversion tracking
- `session_quality_metrics` - Quality metrics
- `performance_guardrails` - Performance monitoring
- `cost_guardrails` - Cost tracking

### API Endpoints
- `/api/analytics/dashboard` - Overall dashboard
- `/api/analytics/retention` - Retention metrics
- `/api/analytics/sessions` - Session metrics
- `/api/analytics/conversion` - Conversion metrics
- `/api/analytics/quality` - Quality metrics
- `/api/analytics/guardrails` - Performance guardrails

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Monthly or upon metric changes


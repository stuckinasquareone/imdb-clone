# Performance Telemetry Integration Guide

## Overview
This telemetry system captures Web Vitals metrics and sends them to a backend for production observability. It's designed to teach interns about monitoring, performance analysis, and real-time data visualization.

## 📊 Web Vitals Explained

### LCP - Largest Contentful Paint
- **What**: Time when the largest visible element loads
- **Good**: ≤ 2.5 seconds
- **Why**: Indicates perceived load speed
- **Impact**: Users abandon sites that feel slow to load

### FID - First Input Delay  
- **What**: Time from user input to browser response
- **Good**: ≤ 100 milliseconds
- **Why**: Measures responsiveness to user interaction
- **Impact**: Frustration when clicks/taps don't feel responsive

### CLS - Cumulative Layout Shift
- **What**: Unexpected visual movement of page elements
- **Good**: ≤ 0.1
- **Why**: Prevents accidental clicks and jarring experience
- **Impact**: Misclicks, poor user experience with dynamic content

### FCP - First Contentful Paint
- **What**: Time when first content appears
- **Good**: ≤ 1.8 seconds
- **Why**: First visual feedback to user

### TTFB - Time to First Byte
- **What**: Time for server to respond with first data
- **Good**: ≤ 800 milliseconds
- **Why**: Indicates server/network performance

## 🚀 Quick Start

### 1. View the Dashboard (Development Mode)

Press **Ctrl+Shift+P** in your browser to toggle the performance metrics dashboard.

Features:
- Real-time Web Vitals display
- Metrics collection counter
- Session tracking
- Color-coded performance ratings
  - 🟢 Green (Good)
  - 🟡 Yellow (Needs Improvement)
  - 🔴 Red (Poor)

### 2. Using Telemetry in Components

```javascript
import { usePerformanceTracking } from './hooks/usePerformanceTracking';

function MyComponent() {
  const { recordEvent, recordRender } = usePerformanceTracking('MyComponent');

  const handleSearch = (query) => {
    recordEvent('search_submitted', { queryLength: query.length });
    // ... perform search
  };

  return (
    <button onClick={() => handleSearch('test')}>
      Search
    </button>
  );
}
```

### 3. Record Custom Events

```javascript
import telemetryService from './services/telemetryService';

// Record custom events
telemetryService.recordEvent('movie_viewed', {
  movieId: '12345',
  genre: 'Action',
  duration: 145
});

// Record resource timings (API calls, etc.)
const start = Date.now();
const response = await fetch('/api/movies');
const duration = Date.now() - start;
telemetryService.recordResourceTiming('movies_api_call', duration, 'success');
```

## 🔧 Backend Setup

### Option 1: Using the Example Backend

1. Create a backend directory:
```bash
mkdir backend
cd backend
npm init -y
npm install express body-parser cors
```

2. Copy `metricsEndpoint.js` from `backend-example/` directory

3. Start the server:
```bash
node metricsEndpoint.js
```

4. Update the telemetry service URL:
```javascript
// In telemetryService.js
const telemetryService = new TelemetryService('http://localhost:3001/api/metrics');
```

### Option 2: Using Your Existing Backend

Add this endpoint to your existing backend:

```javascript
app.post('/api/metrics', (req, res) => {
  const { metrics, sessionId, timestamp } = req.body;
  
  // Process metrics...
  console.log(`Received ${metrics.length} metrics from session ${sessionId}`);
  
  // Store in database...
  // TODO: Save to database
  
  res.json({ success: true });
});
```

### Option 3: Using a Cloud Service

Popular telemetry services:
- **Sentry**: Error and performance tracking
- **LogRocket**: Session replay and metrics
- **Datadog**: Full observability platform
- **New Relic**: APM and monitoring
- **Segment**: Analytics hub

Update the endpoint in `telemetryService.js`:
```javascript
const telemetryService = new TelemetryService('https://your-service.com/track');
```

## 📈 Understanding the Data

### Metrics Structure
```javascript
{
  "metrics": [
    {
      "name": "LCP",           // Metric name
      "value": 2345,          // Value in milliseconds
      "rating": "good",       // good|needs-improvement|poor
      "timestamp": 1234567890,
      "url": "https://...",
      "sessionId": "session_...",
      "userAgent": "...",
      "deviceMemory": "8GB",
      "connection": "4g"
    },
    {
      "type": "event",
      "name": "movie_viewed",
      "data": { "movieId": "123" },
      "timestamp": 1234567890,
      "sessionId": "session_..."
    }
  ],
  "sessionId": "session_...",
  "timestamp": 1234567890
}
```

### Analysis Examples

1. **Identify Performance Bottlenecks**
   - Track which pages have highest LCP
   - Find slow API endpoints
   - Monitor JavaScript execution time

2. **Device & Browser Impact**
   - Compare metrics across device types
   - Identify browser-specific issues
   - Optimize for slower connections

3. **User Experience**
   - Track user interactions
   - Correlate with performance metrics
   - Find abandonment points

## 🎓 Learning Objectives

This system teaches:

1. **Production Observability**
   - Why monitoring matters
   - Real user monitoring (RUM)
   - Metric aggregation and analysis

2. **Performance Optimization**
   - Core Web Vitals and why they matter
   - Identifying performance issues
   - Impact on user experience

3. **System Design**
   - Client-server communication
   - Data collection patterns
   - Batch processing
   - Error handling and retry logic

4. **React Best Practices**
   - Custom hooks for tracking
   - Component lifecycle
   - useEffect patterns

5. **Data Visualization**
   - Real-time dashboards
   - Color-coded ratings
   - Status indicators

## 🔍 Debugging Tips

### Enable Console Logging
The telemetry service logs in development mode:
```
[Telemetry] LCP 2345.67 ms (good)
[Event] movie_searched { query: "Avatar" }
[Resource] api_call 234.56ms [success]
```

### Check Metrics in Console
```javascript
// Get current metrics
console.log(telemetryService.getMetricsSummary());

// Get all raw metrics
console.log(telemetryService.getMetrics());
```

### Monitor Network Requests
In DevTools Network tab, look for POST requests to `/api/metrics`. Each request contains batched telemetry data.

## 📋 Checklist for Interns

- [ ] Understand what each Web Vital measures
- [ ] Toggle the dashboard with Ctrl+Shift+P
- [ ] Use `recordEvent()` in a React component
- [ ] Set up the backend example server
- [ ] View raw metrics in browser console
- [ ] Add custom events to track user actions
- [ ] Monitor API call performance
- [ ] Create a simple analytics query
- [ ] Understand session tracking
- [ ] Learn about performance budgets

## 🚨 Production Best Practices

1. **Sample Data Wisely**
   - Don't send 100% of metrics (use sampling)
   - Send 10-25% for high-traffic apps
   - Send 100% for critical applications

2. **Protect User Privacy**
   - Don't capture PII
   - Anonymize URLs
   - Follow GDPR/privacy regulations

3. **Monitor the Monitor**
   - Ensure telemetry doesn't harm performance
   - Keep payloads small
   - Use appropriate batching

4. **Act on Insights**
   - Set performance budgets
   - Create alerts for regressions
   - Track improvements over time

## 📚 Further Reading

- [Web Vitals Guide](https://web.dev/vitals/)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [User-Centric Performance Metrics](https://web.dev/user-centric-performance-metrics/)

---

**Happy Learning! 📊** Track metrics, improve performance, ship great products!

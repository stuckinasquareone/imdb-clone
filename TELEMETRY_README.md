# 📊 Performance Telemetry System - Setup & Usage

A production-ready performance monitoring system integrated into your IMDB Clone project. Captures Web Vitals, custom events, and resource timings for observability and debugging.

## ✨ Features

- **Web Vitals Collection**: LCP, FID, CLS, FCP, TTFB
- **Real-time Dashboard**: Press `Ctrl+Shift+P` in dev mode to view metrics
- **Custom Event Tracking**: Track user interactions and important actions
- **Resource Monitoring**: Measure API calls and resource load times
- **Session Tracking**: Unique session IDs for user journey analysis
- **Batch Processing**: Efficient data transmission to backend
- **Error Resilience**: Automatic retry logic for failed requests
- **Privacy-Focused**: Optional sampling and URL filtering

## 🗂️ Project Structure

```
src/
├── services/
│   └── telemetryService.js         # Core telemetry engine
├── components/
│   ├── PerformanceDashboard.js     # Dev mode dashboard
│   ├── PerformanceDashboard.css    # Dashboard styles
│   └── MovieSearchExample.js       # Example with tracking
├── hooks/
│   └── usePerformanceTracking.js   # React hook for components
├── config/
│   └── telemetryConfig.js          # Configuration settings
├── reportWebVitals.js              # Enhanced Web Vitals reporting
└── App.js                          # Updated with dashboard

backend-example/
└── metricsEndpoint.js              # Example Express.js backend

TELEMETRY_GUIDE.md                  # Comprehensive guide
```

## 🚀 Quick Start

### 1. View the Dashboard

The dashboard is automatically integrated into your app. In development mode:

```
Press Ctrl+Shift+P to toggle the performance dashboard
```

The dashboard shows:
- **Web Vitals**: LCP, FID, CLS, FCP, TTFB with ratings
- **Metrics Summary**: Count of collected metrics by type
- **Session Info**: Current session ID, URL, device info
- **Connection Type**: Network type (4g, 3g, etc.)

### 2. Using in Components

```javascript
import { usePerformanceTracking } from './hooks/usePerformanceTracking';

function MyComponent() {
  const { recordEvent, recordRender } = usePerformanceTracking('MyComponent');

  const handleClick = () => {
    recordEvent('button_clicked', { buttonId: 'search' });
  };

  return <button onClick={handleClick}>Search</button>;
}
```

### 3. Recording Custom Events

```javascript
import telemetryService from './services/telemetryService';

// Record user action
telemetryService.recordEvent('movie_viewed', {
  movieId: '550',
  genre: 'Drama',
  rating: 8.8
});

// Record resource performance
const start = Date.now();
const response = await fetch('/api/movies');
const duration = Date.now() - start;
telemetryService.recordResourceTiming('movies_api', duration, 'success');
```

## 🔧 Backend Setup

### Option A: Use the Example Backend

```bash
# Create backend directory
cd backend-example

# Install dependencies
npm install express body-parser cors

# Start server
node metricsEndpoint.js
```

Server runs on `http://localhost:3001` and receives metrics at `/api/metrics`

Update telemetry endpoint:
```javascript
// In telemetryService.js
const telemetryService = new TelemetryService('http://localhost:3001/api/metrics');
```

### Option B: Integrate with Existing Backend

Add this endpoint to your backend:

```javascript
app.post('/api/metrics', express.json(), (req, res) => {
  const { metrics, sessionId } = req.body;
  
  // Log metrics
  console.log(`Session ${sessionId}: received ${metrics.length} metrics`);
  
  // Save to database
  // TODO: saveMetricsToDatabase(metrics, sessionId)
  
  res.json({ success: true });
});
```

### Option C: Use SaaS Provider

Popular options:
- **Sentry**: `https://[project_id]@sentry.io/[project_number]`
- **LogRocket**: `https://app.logrocket.com/[org]/[project]`
- **Datadog**: Datadog agent endpoint
- **New Relic**: Insights API endpoint

Update config:
```javascript
// src/config/telemetryConfig.js
BACKEND_URL: process.env.REACT_APP_METRICS_ENDPOINT
```

Set environment variable:
```bash
REACT_APP_METRICS_ENDPOINT=https://your-service.com/track npm start
```

## 📊 Understanding the Data

### Metrics Format

```json
{
  "metrics": [
    {
      "name": "LCP",
      "value": 2345,
      "rating": "good",
      "timestamp": 1674567890000,
      "url": "http://localhost:3000/",
      "sessionId": "session_1674567890000_abc123",
      "userAgent": "Mozilla/5.0...",
      "deviceMemory": "8GB",
      "connection": "4g"
    }
  ],
  "sessionId": "session_1674567890000_abc123",
  "timestamp": 1674567890000
}
```

### Web Vitals Legend

| Metric | What It Measures | Good | Needs Work | Poor |
|--------|------------------|------|-----------|------|
| **LCP** | Largest content loaded | ≤2.5s | >2.5s-4s | >4s |
| **FID** | Time to respond to input | ≤100ms | >100ms-300ms | >300ms |
| **CLS** | Visual stability | ≤0.1 | >0.1-0.25 | >0.25 |
| **FCP** | First content painted | ≤1.8s | >1.8s-3s | >3s |
| **TTFB** | Server response time | ≤800ms | >800ms-1.8s | >1.8s |

## ⚙️ Configuration

Edit `src/config/telemetryConfig.js`:

```javascript
TELEMETRY_CONFIG = {
  BACKEND_URL: '/api/metrics',        // Your backend endpoint
  SAMPLING_RATE: 0.25,                // 25% of metrics in production
  BATCH_SIZE: 10,                     // Batch size before sending
  FLUSH_INTERVAL: 30000,              // 30 seconds between flushes
  DEBUG: true,                        // Console logging
  THRESHOLDS: {
    LCP: 2500,                        // Alert if > 2.5s
    FID: 100,
    CLS: 0.1,
  }
}
```

## 🎓 Learning Exercises for Interns

### Exercise 1: View Live Metrics
1. Run the app: `npm start`
2. Open browser DevTools (F12)
3. Press `Ctrl+Shift+P` to open dashboard
4. Observe Web Vitals in real-time
5. Note which ones are "good" vs "poor"

### Exercise 2: Record Custom Events
1. Open `src/App.js`
2. Add a button click handler
3. Use `telemetryService.recordEvent('button_clicked')`
4. Check dashboard to see new events

### Exercise 3: Set Up Backend
1. Create `backend-example/` endpoint
2. Start backend server on port 3001
3. Update telemetry service URL
4. Perform actions in app
5. Check backend console for received metrics

### Exercise 4: Analyze Performance
1. Open Performance tab in DevTools
2. Compare with telemetry metrics
3. Identify bottlenecks
4. Record custom timings for slow operations

### Exercise 5: Implement Sampling
1. Edit `telemetryConfig.js`
2. Set `SAMPLING_RATE: 0.1` (10%)
3. Generate metrics and observe reduction
4. Understand sampling for scale

## 🔍 Debugging

### View Metrics in Console

```javascript
// Get summary
console.log(telemetryService.getMetricsSummary());

// Get all metrics
console.log(telemetryService.getMetrics());

// Get session ID
console.log(telemetryService.sessionId);
```

### Enable Debug Logging

```javascript
// In telemetryService.js
this.isDev = true; // Forces console output
```

### Monitor Network Requests

1. Open DevTools → Network tab
2. Filter for "metrics" requests
3. Click POST request to `/api/metrics`
4. View payload in Request tab
5. Check response in Response tab

### Check Browser DevTools Performance Tab

1. F12 → Performance tab
2. Record a session
3. Stop recording
4. Compare telemetry data with DevTools findings

## 📈 Production Best Practices

### 1. Implement Sampling
- Don't send 100% of metrics
- Use 10-25% sampling for high traffic
- Adjust based on traffic volume

### 2. Filter Sensitive Data
```javascript
// In telemetryService.js
IGNORE_URLS: [
  '/admin',
  '/user/settings',
  '/auth'
]
```

### 3. Set Performance Budgets
- Define acceptable thresholds
- Alert on regressions
- Track improvements over time

### 4. Secure Your Endpoint
- Require authentication if needed
- Validate data format
- Rate limit if needed
- HTTPS only in production

### 5. Store Data Appropriately
- Archive old metrics
- Keep recent data hot
- Implement retention policies
- Ensure GDPR compliance

## 🐛 Troubleshooting

### Metrics Not Appearing in Dashboard
- Check if running in development mode (`NODE_ENV=development`)
- Press `Ctrl+Shift+P` to toggle dashboard
- Check browser console for errors
- Verify telemetry service initialized

### Backend Not Receiving Metrics
- Check endpoint URL in telemetry service
- Verify backend is running and listening
- Check CORS configuration if cross-origin
- Look for network errors in DevTools

### High Memory Usage
- Reduce `BATCH_SIZE`
- Increase `FLUSH_INTERVAL`
- Lower `SAMPLING_RATE`
- Implement data rotation

### Poor Performance Scores
- Check `reportWebVitals.js` integration
- Verify Web Vitals library version
- Test on slower network (DevTools)
- Profile with Performance tab

## 📚 Resources

- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals Guide](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [React Profiler](https://react.dev/reference/react/Profiler)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

## 📝 Example: Complete Integration

See [MovieSearchExample.js](src/components/MovieSearchExample.js) for a complete example showing:
- Component-level tracking
- API call monitoring
- Error handling
- Event recording
- Real-time dashboard updates

## 🎯 Key Takeaways

This system teaches:
1. **Production Observability** - Why monitoring matters at scale
2. **Web Performance** - Core Web Vitals and user experience
3. **System Design** - Client-server communication patterns
4. **React Best Practices** - Custom hooks and component lifecycle
5. **Data Visualization** - Real-time dashboards and metrics
6. **Debugging** - Using data to identify and fix issues

---

**Questions?** Check `TELEMETRY_GUIDE.md` for more details!

**Happy optimizing! 🚀**

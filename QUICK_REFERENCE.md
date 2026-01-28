## 🚀 Performance Telemetry - Quick Reference

### Dashboard Keyboard Shortcut
```
Ctrl+Shift+P  →  Toggle performance dashboard (dev mode only)
```

### Common Code Snippets

#### Record an Event
```javascript
import telemetryService from './services/telemetryService';

telemetryService.recordEvent('movie_clicked', {
  movieId: '550',
  position: 1
});
```

#### Use Hook in Component
```javascript
import { usePerformanceTracking } from './hooks/usePerformanceTracking';

const { recordEvent, recordRender } = usePerformanceTracking('MyComponent');

recordEvent('search_submitted', { query: 'Avatar' });
```

#### Track API Call
```javascript
const start = Date.now();
const response = await fetch('/api/movies');
const duration = Date.now() - start;

telemetryService.recordResourceTiming('movies_api', duration, 
  response.ok ? 'success' : 'error'
);
```

#### Get Metrics in Console
```javascript
telemetryService.getMetricsSummary()  // Get summary
telemetryService.getMetrics()          // Get all metrics
telemetryService.sessionId             // Current session ID
```

### Web Vitals at a Glance

| Metric | Measure | Good | Warning | Slow |
|--------|---------|------|---------|------|
| **LCP** | Content load speed | <2.5s | 2.5-4s | >4s |
| **FID** | Input response | <100ms | 100-300ms | >300ms |
| **CLS** | Visual stability | <0.1 | 0.1-0.25 | >0.25 |

### Dashboard Colors
- 🟢 **Green** = Good performance
- 🟡 **Yellow** = Needs improvement  
- 🔴 **Red** = Poor performance

### Files to Know

| File | Purpose |
|------|---------|
| `telemetryService.js` | Core metrics collection |
| `PerformanceDashboard.js` | Dev mode UI |
| `usePerformanceTracking.js` | React hook for tracking |
| `telemetryConfig.js` | Configuration settings |
| `reportWebVitals.js` | Web Vitals integration |

### Setup Checklist
- [ ] Dashboard appears on Ctrl+Shift+P
- [ ] Backend endpoint configured
- [ ] Can see metrics in dashboard
- [ ] Can view console logs in dev mode
- [ ] Can record custom events

### Common Issues

**Dashboard not showing?**
- Make sure you're in development mode
- Press Ctrl+Shift+P to toggle
- Check browser console for errors

**Metrics not sending?**
- Verify backend endpoint URL
- Check backend is running
- Look for network errors in DevTools

**Memory growing?**
- Reduce BATCH_SIZE
- Increase FLUSH_INTERVAL
- Lower SAMPLING_RATE

### Environment Variables
```bash
REACT_APP_METRICS_ENDPOINT=/api/metrics
NODE_ENV=development  # Shows dashboard
```

---

**More info:** See `TELEMETRY_README.md` and `TELEMETRY_GUIDE.md`

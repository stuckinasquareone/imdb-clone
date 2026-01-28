# 🎓 Intern Training Checklist - Performance Telemetry

## Level 1: Basics (Day 1-2)

### Understanding Concepts
- [ ] Read [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
- [ ] Understand what each Web Vital measures
  - [ ] LCP - Load time
  - [ ] FID - Input response
  - [ ] CLS - Visual stability
  - [ ] FCP - First paint
  - [ ] TTFB - Server response
- [ ] Know the "good" thresholds for each metric

### Hands-On: Using the Dashboard
- [ ] Start the app: `npm start`
- [ ] Open DevTools (F12)
- [ ] Press `Ctrl+Shift+P` to open dashboard
- [ ] See real-time Web Vitals
- [ ] Check session ID and connection type
- [ ] Toggle dashboard off and on

### Hands-On: Console Exploration
- [ ] Open Browser Console
- [ ] Run: `telemetryService.getMetricsSummary()`
- [ ] Run: `telemetryService.getMetrics()`
- [ ] Run: `telemetryService.sessionId`
- [ ] See development logs: `[Telemetry] ...`
- [ ] Understand what each metric means

### Quiz Yourself
- [ ] What does LCP stand for?
- [ ] What's the "good" threshold for FID?
- [ ] Why is CLS important for user experience?
- [ ] How is your app's performance?

---

## Level 2: Component Integration (Day 3-4)

### Understanding the Code
- [ ] Review [src/hooks/usePerformanceTracking.js](src/hooks/usePerformanceTracking.js)
- [ ] Understand the `recordEvent()` method
- [ ] Understand the `recordRender()` method
- [ ] Read [src/components/MovieSearchExample.js](src/components/MovieSearchExample.js)
- [ ] See how events are recorded in components

### Hands-On: Add Tracking to App.js
- [ ] Import `usePerformanceTracking` hook
- [ ] Add: `const { recordEvent } = usePerformanceTracking('App')`
- [ ] Add a button click handler
- [ ] Call `recordEvent('button_clicked', { buttonId: 'test' })`
- [ ] Open dashboard and verify event appears
- [ ] Check console for `[Event]` logs

### Hands-On: Create a Custom Component
Create `src/components/MovieCard.js`:
```javascript
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';

function MovieCard({ movie }) {
  const { recordEvent } = usePerformanceTracking('MovieCard');

  return (
    <div onClick={() => recordEvent('movie_viewed', {
      movieId: movie.id,
      title: movie.title
    })}>
      {movie.title}
    </div>
  );
}
```
- [ ] Create the component above
- [ ] Use it in App.js
- [ ] Click on movie cards
- [ ] Check dashboard for new events
- [ ] See event logs in console

### Hands-On: Track API Calls
- [ ] Create a simple fetch in a component
- [ ] Measure duration with `Date.now()`
- [ ] Call `recordResourceTiming('api_name', duration, 'success')`
- [ ] See resource timing in dashboard

### Quiz Yourself
- [ ] How do you record an event?
- [ ] What does `recordRender()` do?
- [ ] How do you measure API performance?
- [ ] What data should you NOT track?

---

## Level 3: Backend Setup (Day 5)

### Understanding the Backend
- [ ] Read [backend-example/metricsEndpoint.js](backend-example/metricsEndpoint.js)
- [ ] Understand the metric POST request format
- [ ] Understand data analysis in backend
- [ ] Know what endpoints are available

### Hands-On: Run the Backend
```bash
# Navigate to backend
cd backend-example

# Install dependencies
npm install express body-parser cors

# Start the server
node metricsEndpoint.js
```
- [ ] Backend runs on http://localhost:3001
- [ ] See "Telemetry server running" message
- [ ] Keep terminal open

### Hands-On: Update Telemetry Endpoint
- [ ] Open `src/services/telemetryService.js`
- [ ] Change: `new TelemetryService('http://localhost:3001/api/metrics')`
- [ ] Save and reload browser
- [ ] Generate metrics by interacting with app
- [ ] Check backend terminal for received metrics
- [ ] See console output like: `Received 5 metrics from session ...`

### Hands-On: Monitor Data Flow
- [ ] Open DevTools Network tab
- [ ] Filter for "metrics"
- [ ] Generate some metrics
- [ ] See POST to `/api/metrics`
- [ ] Click on request
- [ ] View "Request" payload (what you sent)
- [ ] View "Response" (backend response)
- [ ] Understand the data format

### Quiz Yourself
- [ ] What does the backend `/api/metrics` endpoint do?
- [ ] What data comes in the POST request?
- [ ] Where would you store the metrics?
- [ ] How would you query them later?

---

## Level 4: Configuration & Optimization (Day 6)

### Understanding Configuration
- [ ] Read [src/config/telemetryConfig.js](src/config/telemetryConfig.js)
- [ ] Understand each setting:
  - [ ] BATCH_SIZE - how many before sending
  - [ ] FLUSH_INTERVAL - how often to send
  - [ ] SAMPLING_RATE - what % to send
  - [ ] DEBUG - console logging

### Hands-On: Adjust Settings
- [ ] Open `telemetryConfig.js`
- [ ] Change: `BATCH_SIZE: 2` (send more frequently)
- [ ] Reload app
- [ ] Generate metrics faster in backend
- [ ] See more frequent POST requests in Network tab
- [ ] Change back to original value

### Hands-On: Enable Sampling
- [ ] Set: `SAMPLING_RATE: 0.5` (50%)
- [ ] Generate many interactions
- [ ] Notice about 50% are sent
- [ ] Set: `SAMPLING_RATE: 0.1` (10%)
- [ ] See dramatic reduction in requests
- [ ] Understand value for production

### Hands-On: Debugging
- [ ] Set: `DEBUG: true` in config
- [ ] Check console for detailed logs
- [ ] See `[Telemetry]`, `[Event]`, `[Resource]` logs
- [ ] Understand what each log means
- [ ] Set back to original

### Quiz Yourself
- [ ] When would you use sampling?
- [ ] What does FLUSH_INTERVAL control?
- [ ] Why adjust BATCH_SIZE?
- [ ] How does DEBUG help?

---

## Level 5: Advanced Analysis (Day 7)

### Hands-On: Analyze Metrics
```javascript
// In console
const summary = telemetryService.getMetricsSummary();
console.log(summary);

// See structure:
// { totalMetrics: 45, vitals: {...}, byType: {...} }
```
- [ ] Get summary in console
- [ ] Understand the data structure
- [ ] Count metrics by type
- [ ] Find slowest Web Vitals

### Hands-On: Create a Report
```javascript
// In console
const metrics = telemetryService.getMetrics();
const vitals = metrics.filter(m => m.name);
const avgLCP = vitals
  .filter(m => m.name === 'LCP')
  .reduce((sum, m) => sum + m.value, 0) / vitals.filter(m => m.name === 'LCP').length;
console.log('Average LCP:', avgLCP);
```
- [ ] Get all metrics
- [ ] Filter by metric type
- [ ] Calculate average values
- [ ] Identify performance issues

### Hands-On: Build a Simple Report
Create `src/components/MetricsReport.js`:
```javascript
import telemetryService from '../services/telemetryService';

function MetricsReport() {
  const summary = telemetryService.getMetricsSummary();
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0' }}>
      <h2>Metrics Report</h2>
      <p>Total Metrics: {summary.totalMetrics}</p>
      {Object.entries(summary.vitals || {}).map(([name, vital]) => (
        <p key={name}>
          {name}: {vital.value.toFixed(2)} ({vital.rating})
        </p>
      ))}
    </div>
  );
}
```
- [ ] Create the component
- [ ] Add to App.js
- [ ] See real-time metrics display
- [ ] Style it nicely

### Hands-On: Database Query (Conceptual)
If using example backend:
```sql
-- View all metrics
SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 10;

-- Get average LCP
SELECT AVG(metric_value) FROM metrics WHERE metric_name = 'LCP';

-- Count by rating
SELECT metric_rating, COUNT(*) FROM metrics GROUP BY metric_rating;

-- Find worst sessions
SELECT session_id, AVG(metric_value) as avg_value 
FROM metrics 
WHERE metric_name = 'LCP'
GROUP BY session_id
ORDER BY avg_value DESC LIMIT 5;
```
- [ ] Understand SQL queries
- [ ] Know what queries to run
- [ ] Think about insights you could get

### Quiz Yourself
- [ ] How would you find the slowest metric?
- [ ] How would you compare performance across days?
- [ ] What would indicate a performance regression?
- [ ] How would you find which pages are slowest?

---

## Level 6: Production Readiness (Day 8)

### Learning: Best Practices
- [ ] Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [ ] Understand sampling in production
- [ ] Know about retention policies
- [ ] Understand privacy considerations
- [ ] Know about alerting

### Understanding: Infrastructure
- [ ] Learn about self-hosted backends
- [ ] Know cloud provider options (Lambda, Cloud Functions)
- [ ] Understand SaaS integrations (Sentry, LogRocket)
- [ ] Know about database choices

### Hands-On: Production Config
- [ ] Create `telemetryConfig.production.js`
- [ ] Set SAMPLING_RATE to 0.25 (25%)
- [ ] Set larger BATCH_SIZE
- [ ] Longer FLUSH_INTERVAL
- [ ] Longer retention (90 days)

### Hands-On: Security Review
- [ ] Check what data is being sent
- [ ] Verify no PII (passwords, emails, etc.)
- [ ] Check privacy filter rules
- [ ] Understand session hashing

### Hands-On: Error Handling
- [ ] Break the backend
- [ ] Watch app handle failed sends
- [ ] See metrics queue up
- [ ] Start backend again
- [ ] See metrics retry and send
- [ ] Understand resilience

### Quiz Yourself
- [ ] What sampling rate for your app?
- [ ] Where would you host the backend?
- [ ] How long to keep metrics?
- [ ] What's your performance budget?

---

## Final Project: Integration Task

### Task: Add Tracking to Real Feature

Choose one feature of IMDB clone and:
1. [ ] Add performance tracking hooks
2. [ ] Record important events
3. [ ] Measure API calls
4. [ ] Document findings
5. [ ] Present metrics to team

**Example: Search Feature**
- [ ] Track search submitted
- [ ] Measure search API latency
- [ ] Track result rendering
- [ ] Count results returned
- [ ] Measure response time
- [ ] Find slow queries

---

## Completion Checklist

### Knowledge
- [ ] Understand all 5 Web Vitals
- [ ] Know how telemetry system works
- [ ] Understand batch processing
- [ ] Know privacy best practices
- [ ] Understand production concerns

### Skills
- [ ] Can add tracking to components
- [ ] Can record custom events
- [ ] Can monitor API performance
- [ ] Can analyze metrics
- [ ] Can configure telemetry

### Advanced
- [ ] Can set up backend
- [ ] Can query metrics
- [ ] Can build reports
- [ ] Can deploy to production
- [ ] Can troubleshoot issues

---

## Resources

- **Setup Guide:** [TELEMETRY_README.md](TELEMETRY_README.md)
- **Learning Guide:** [TELEMETRY_GUIDE.md](TELEMETRY_GUIDE.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Quick Ref:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Example Code:** [MovieSearchExample.js](src/components/MovieSearchExample.js)
- **Integration Summary:** [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)

---

## Notes for Mentors

- **Pace:** Allow 1-2 days per level for full understanding
- **Hands-On:** Emphasize building and experimenting
- **Real Data:** Use actual app metrics, not fake data
- **Production:** Discuss real-world considerations
- **Questions:** Encourage curiosity about metrics

---

**Estimated Time:** 1-2 weeks for complete mastery

**Difficulty:** Beginner to Intermediate

**Value:** Production observability is critical skill!

Good luck! 🚀

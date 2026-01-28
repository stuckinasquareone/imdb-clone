## 🎯 Deployment & Production Guide

### Pre-Deployment Checklist

- [ ] Test dashboard in development mode
- [ ] Verify backend endpoint is set correctly
- [ ] Configure sampling rate (10-25% recommended)
- [ ] Set up database/storage for metrics
- [ ] Configure CORS if cross-origin
- [ ] Enable HTTPS for production
- [ ] Set up logging/alerting
- [ ] Test error handling and retries
- [ ] Verify no PII is being captured
- [ ] Load test the metrics endpoint

### Environment Variables

```bash
# Development
NODE_ENV=development
REACT_APP_METRICS_ENDPOINT=http://localhost:3001/api/metrics

# Production  
NODE_ENV=production
REACT_APP_METRICS_ENDPOINT=https://your-domain.com/api/metrics
```

### Production Configuration

Update `src/config/telemetryConfig.js` for production:

```javascript
// Production settings
ENABLED: {
  production: true,
},
SAMPLING_RATE: 0.25,  // 25% of metrics
BATCH_SIZE: 20,       // Larger batches
FLUSH_INTERVAL: 60000, // 60 seconds
DEBUG: false,         // No console logs
RETENTION: {
  MAX_METRICS_IN_MEMORY: 500,
  MAX_RETRIES: 5,
}
```

### Backend Deployment Options

#### Option 1: Express.js Backend (Self-Hosted)
```bash
# Deploy to your server
node backend-example/metricsEndpoint.js

# Or with PM2 for production
pm2 start backend-example/metricsEndpoint.js --name metrics
```

#### Option 2: Serverless (AWS Lambda)
```javascript
// Wrap metricsEndpoint.js handler
const serverless = require('serverless-http');
const app = require('./metricsEndpoint.js');
module.exports.handler = serverless(app);
```

#### Option 3: Cloud Functions (Firebase)
```javascript
exports.metricsEndpoint = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') return res.status(405).send();
  
  const { metrics, sessionId } = req.body;
  // Store to Firestore
  // Return success
});
```

#### Option 4: SaaS Provider Integration

**Sentry Integration:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.25,
});

// Telemetry automatically sent to Sentry
```

**LogRocket Integration:**
```javascript
import LogRocket from 'logrocket';

LogRocket.init(process.env.REACT_APP_LOGROCKET_ID);

// Send custom metrics
LogRocket.getSessionURL(sessionURL => {
  console.log('Session URL:', sessionURL);
});
```

### Monitoring & Alerting

#### Set Up Alerts for:
- LCP > 4 seconds
- FID > 300ms
- CLS > 0.25
- Error rate > 5%
- Backend API latency > 2s

#### Example Alert Configuration:
```javascript
// In backend
app.post('/api/metrics', (req, res) => {
  const { metrics } = req.body;
  
  metrics.forEach(metric => {
    if (metric.name === 'LCP' && metric.value > 4000) {
      // Send Slack/PagerDuty alert
      alerting.sendAlert(`High LCP detected: ${metric.value}ms`);
    }
  });
});
```

### Database Schema (Example)

```sql
-- PostgreSQL example
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  metric_name VARCHAR(50),
  metric_value FLOAT,
  metric_rating VARCHAR(20),
  url TEXT,
  user_agent TEXT,
  device_memory VARCHAR(50),
  connection_type VARCHAR(20),
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_id ON metrics(session_id);
CREATE INDEX idx_metric_name ON metrics(metric_name);
CREATE INDEX idx_created_at ON metrics(created_at);
```

### Performance Optimization

#### Reduce Memory Usage:
```javascript
// Decrease batch size
BATCH_SIZE: 5,

// Increase flush interval
FLUSH_INTERVAL: 120000,

// Enable aggressive sampling
SAMPLING_RATE: 0.1,
```

#### Improve Reliability:
```javascript
// Increase retry attempts
MAX_RETRIES: 5,

// Use keepalive for stability
keepalive: true,

// Implement exponential backoff
```

### Security Best Practices

#### 1. Validate Incoming Data
```javascript
app.post('/api/metrics', (req, res) => {
  const schema = {
    metrics: Array,
    sessionId: String,
    timestamp: Number
  };
  
  if (!isValidData(req.body, schema)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  
  // Process...
});
```

#### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // requests per window
});

app.post('/api/metrics', limiter, handleMetrics);
```

#### 3. CORS Configuration
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));
```

#### 4. Remove Sensitive Data
```javascript
function sanitizeMetrics(metrics) {
  return metrics.map(metric => {
    const { sessionId, ...safe } = metric;
    return {
      ...safe,
      sessionId: hashSessionId(sessionId), // Hash, don't store raw
    };
  });
}
```

### Monitoring Dashboard Ideas

#### Key Metrics to Track:
```javascript
{
  // Performance
  avgLCP: 2.1,
  avgFID: 45,
  avgCLS: 0.08,
  
  // Errors
  errorRate: 0.02,
  failedRequests: 5,
  
  // Usage
  activeSessions: 1250,
  newUsers: 342,
  metricsCollected: 45000,
  
  // Quality
  goodMetrics: 0.85, // 85% in good range
  poorMetrics: 0.05, // 5% in poor range
}
```

### Troubleshooting in Production

#### High CPU Usage
- Check database queries
- Reduce batch size
- Implement sampling
- Add database indexes

#### High Memory Usage
- Reduce MAX_METRICS_IN_MEMORY
- Increase FLUSH_INTERVAL
- Implement data archiving
- Check for memory leaks

#### Slow API Response
- Add database indexes
- Implement caching
- Optimize queries
- Add load balancer

#### Data Inconsistencies
- Check data validation
- Verify timestamps
- Audit migrations
- Review error logs

### Compliance & Privacy

#### GDPR Considerations:
- ✅ Collect with consent
- ❌ Don't store PII
- ✅ Allow data export
- ✅ Implement retention policy
- ✅ Hash session IDs

#### Data Retention:
```javascript
// Archive old data
SELECT * FROM metrics 
WHERE created_at < NOW() - INTERVAL '90 days'
INTO archive_metrics;

DELETE FROM metrics 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Rollback Plan

If metrics service fails:
1. Disable telemetry: Set `ENABLED.production = false`
2. Revert backend changes
3. Clear metrics queue
4. Restart application
5. Investigate root cause
6. Deploy fix

### Continuous Monitoring

```javascript
// Health check endpoint
app.get('/api/metrics/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    metricsProcessed: totalMetrics,
    averageLatency: avgLatency,
  });
});

// Cron job to check health
setInterval(async () => {
  const health = await fetch('/api/metrics/health');
  if (!health.ok) {
    alerting.sendAlert('Metrics service unhealthy!');
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

---

**Ready to launch?** Review this checklist and get metrics flowing!

import telemetryService from './services/telemetryService';

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }

  // Send metrics to telemetry service for production observability
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getLCP(metric => telemetryService.recordMetric(metric));
    getFID(metric => telemetryService.recordMetric(metric));
    getCLS(metric => telemetryService.recordMetric(metric));
    getFCP(metric => telemetryService.recordMetric(metric));
    getTTFB(metric => telemetryService.recordMetric(metric));
  });
};

export default reportWebVitals;

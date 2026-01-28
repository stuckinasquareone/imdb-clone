import './App.css';
import ActivityFeed from './components/ActivityFeed';
import PerformanceDashboard from './components/PerformanceDashboard';

function App() {
  return (
    <div className="App">
      {/* Activity Feed Component */}
      <ActivityFeed userId="user_123" />
      
      {/* Performance Dashboard - Press Ctrl+Shift+P in development mode to toggle */}
      <PerformanceDashboard />
    </div>
  );
}

export default App;

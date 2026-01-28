import logo from './logo.svg';
import './App.css';
import PerformanceDashboard from './components/PerformanceDashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      
      {/* Performance Dashboard - Press Ctrl+Shift+P in development mode to toggle */}
      <PerformanceDashboard />
    </div>
  );
}

export default App;

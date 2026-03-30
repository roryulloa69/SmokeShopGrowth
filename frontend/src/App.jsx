import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [city, setCity] = useState('Houston TX');
  const [bizType, setBizType] = useState('smoke shop');
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city, bizType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { jobId } = data;

      const eventSource = new EventSource(`/api/status/${jobId}`);
      eventSource.onmessage = (event) => {
        const newLog = JSON.parse(event.data);
        if (newLog.type === 'done') {
          setIsRunning(false);
          eventSource.close();
          // You could fetch the final results here
        } else {
          setLogs((prevLogs) => [...prevLogs, newLog]);
        }
      };

      eventSource.onerror = () => {
        setIsRunning(false);
        eventSource.close();
      };
    } catch (error) {
      console.error("Error starting pipeline:", error);
      setIsRunning(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Google Maps Lead Scraper</h1>
      </header>
      <main>
        <div className="card">
          <div className="card-title">Search Settings</div>
          <div className="form-grid">
            <label>
              <span>City</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Houston TX"
              />
            </label>
            <label>
              <span>Business Type</span>
              <input
                type="text"
                value={bizType}
                onChange={(e) => setBizType(e.target.value)}
                placeholder="e.g. vape shop, dispensary"
              />
            </label>
          </div>
          <button onClick={handleRunPipeline} disabled={isRunning} className="btn-run mt-24">
            {isRunning ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>

        {isRunning && (
          <div className="card">
            <div className="card-title">Live Log</div>
            <div className="log-terminal">
              {logs.map((log, index) => (
                <div key={index} className={`log-line log-${log.type}`}>
                  <span className="log-ts">{new Date(log.ts).toLocaleTimeString()}</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="card">
            <div className="card-title">Results</div>
            {/* You can map over the 'results' state to display them here */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

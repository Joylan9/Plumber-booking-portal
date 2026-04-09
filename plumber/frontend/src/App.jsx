import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>MERN Plumber Booking Portal</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div className="home-placeholder">Welcome to the Plumber Booking Portal!</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

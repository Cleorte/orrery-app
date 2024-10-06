import React from 'react';
import Orrery from './Orrery'; // Ensure this path matches where Orrery.js is located

function App() {
  return (
    <div className="App">
      <h1>Interactive Orrery</h1>
      {/* Render the Orrery Component */}
      <Orrery />
    </div>
  );
}

export default App;

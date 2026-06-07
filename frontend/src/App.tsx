import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import ASLAuthPage from './pages/ASLAuthPage';
import GraphicalAuthPage from './pages/GraphicalAuthPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/asl" element={<ASLAuthPage />} />
        <Route path="/graphical" element={<GraphicalAuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

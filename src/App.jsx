import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import PandalDetail from './pages/PandalDetail';
import SchedulePage from './pages/SchedulePage';
import CircuitsPage from './pages/CircuitsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pandal/:id" element={<PandalDetail />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/circuits" element={<CircuitsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
      <ScrollToTop />
    </>
  );
}

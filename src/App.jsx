import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header/Header';
import { Home } from './pages/Home/Home';
import { Footer } from './components/Footer/Footer';
import { FloatingActions } from './components/FloatingActions/FloatingActions';
import { AuthModal } from './components/Modals/AuthModal';
import { TopUpModal } from './components/Modals/TopUpModal';
import { HistoryModal } from './components/Modals/HistoryModal';
import { EventGuideModal } from './components/Modals/EventGuideModal';
import { OrderSuccessModal } from './components/Modals/OrderSuccessModal';
import { ToastContainer } from './components/Toast/ToastContainer';
import { AdminPage } from './pages/Admin/AdminPage';

function MainSite() {
  return (
    <>
      {/* Header Navigation */}
      <Header />

      {/* Main Content Area */}
      <Home />

      {/* Footer */}
      <Footer />

      {/* Floating Quick Action Widget */}
      <FloatingActions />

      {/* Interactive Modals */}
      <AuthModal />
      <TopUpModal />
      <HistoryModal />
      <EventGuideModal />
      <OrderSuccessModal />

      {/* Dynamic Toast Notifications */}
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* Admin does not depend on public storefront configuration. Keeping
              it outside AppProvider also prevents a second startup flash while
              public packages/site settings are loading. */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<AppProvider><MainSite /></AppProvider>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

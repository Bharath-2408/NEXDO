import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { VoiceProvider } from './voice/VoiceContext';
import { CustomerProvider } from './store/CustomerContext';
import { TechnicianProvider } from './store/TechnicianContext';

// Layouts (kept static for instant shell structure)
import { AuthLayout } from './layouts/AuthLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { TechnicianLayout } from './layouts/TechnicianLayout';

// Auth Pages (lazy loaded)
const SplashPage = lazy(() => import('./pages/auth/SplashPage').then((m) => ({ default: m.SplashPage })));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const RoleSelectionPage = lazy(() => import('./pages/auth/RoleSelectionPage').then((m) => ({ default: m.RoleSelectionPage })));

// Customer Pages (lazy loaded)
const CustomerHomePage = lazy(() => import('./pages/customer/CustomerHomePage').then((m) => ({ default: m.CustomerHomePage })));
const ExpressNeedPage = lazy(() => import('./pages/customer/ExpressNeedPage').then((m) => ({ default: m.ExpressNeedPage })));
const ProviderResultsPage = lazy(() => import('./pages/customer/ProviderResultsPage').then((m) => ({ default: m.ProviderResultsPage })));
const ProviderDetailPage = lazy(() => import('./pages/customer/ProviderDetailPage').then((m) => ({ default: m.ProviderDetailPage })));
const BookingFlowPage = lazy(() => import('./pages/customer/BookingFlowPage').then((m) => ({ default: m.BookingFlowPage })));
const BookingConfirmationPage = lazy(() => import('./pages/customer/BookingConfirmationPage').then((m) => ({ default: m.BookingConfirmationPage })));
const PaymentHandoffPage = lazy(() => import('./pages/customer/PaymentHandoffPage').then((m) => ({ default: m.PaymentHandoffPage })));
const LiveTrackingPage = lazy(() => import('./pages/customer/LiveTrackingPage').then((m) => ({ default: m.LiveTrackingPage })));
const CustomerReviewPage = lazy(() => import('./pages/customer/CustomerReviewPage').then((m) => ({ default: m.CustomerReviewPage })));
const CustomerBookingsPage = lazy(() => import('./pages/customer/CustomerBookingsPage').then((m) => ({ default: m.CustomerBookingsPage })));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage').then((m) => ({ default: m.CustomerProfilePage })));

// Technician Pages (lazy loaded)
const TechnicianHomePage = lazy(() => import('./pages/technician/TechnicianHomePage').then((m) => ({ default: m.TechnicianHomePage })));
const TechnicianCapabilitiesPage = lazy(() => import('./pages/technician/TechnicianCapabilitiesPage').then((m) => ({ default: m.TechnicianCapabilitiesPage })));
const TechnicianSubscriptionPage = lazy(() => import('./pages/technician/TechnicianSubscriptionPage').then((m) => ({ default: m.TechnicianSubscriptionPage })));
const TechnicianJobsPage = lazy(() => import('./pages/technician/TechnicianJobsPage').then((m) => ({ default: m.TechnicianJobsPage })));
const TechnicianEarningsPage = lazy(() => import('./pages/technician/TechnicianEarningsPage').then((m) => ({ default: m.TechnicianEarningsPage })));
const TechnicianProfilePage = lazy(() => import('./pages/technician/TechnicianProfilePage').then((m) => ({ default: m.TechnicianProfilePage })));

// Accessible loading indicator
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh] w-full p-8" role="status" aria-label="Loading page">
    <div className="w-8 h-8 rounded-full border-3 border-blue-600/30 border-t-blue-600 animate-spin" />
  </div>
);

// 404 Fallback
const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 font-black text-2xl flex items-center justify-center mb-3">
      404
    </div>
    <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
    <p className="text-xs text-slate-500 mt-1 max-w-xs">
      The screen you are looking for does not exist or has moved.
    </p>
    <Link
      to="/customer"
      className="mt-4 px-4 py-2 bg-[#071A36] text-white text-xs font-semibold rounded-xl hover:bg-blue-600 transition-colors"
    >
      Return to Customer Home
    </Link>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <VoiceProvider>
          <CustomerProvider>
            <TechnicianProvider>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Standalone Splash */}
                  <Route path="/" element={<SplashPage />} />

                  {/* Auth Flow Grouped */}
                  <Route element={<AuthLayout />}>
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/select-role" element={<RoleSelectionPage />} />
                  </Route>

                  {/* Customer Application Grouped */}
                  <Route path="/customer" element={<CustomerLayout />}>
                    <Route index element={<CustomerHomePage />} />
                    <Route path="express" element={<ExpressNeedPage />} />
                    <Route path="providers" element={<ProviderResultsPage />} />
                    <Route path="providers/:id" element={<ProviderDetailPage />} />
                    <Route path="book/:providerId" element={<BookingFlowPage />} />
                    <Route path="book" element={<BookingFlowPage />} />
                    <Route path="booking-confirmation/:bookingId" element={<BookingConfirmationPage />} />
                    <Route path="payment/:bookingId" element={<PaymentHandoffPage />} />
                    <Route path="payment-handoff/:bookingId" element={<PaymentHandoffPage />} />
                    <Route path="tracking/:bookingId" element={<LiveTrackingPage />} />
                    <Route path="review/:bookingId" element={<CustomerReviewPage />} />
                    <Route path="bookings" element={<CustomerBookingsPage />} />
                    <Route path="profile" element={<CustomerProfilePage />} />
                  </Route>

                  {/* Technician Application Grouped */}
                  <Route path="/technician" element={<TechnicianLayout />}>
                    <Route index element={<TechnicianHomePage />} />
                    <Route path="capabilities" element={<TechnicianCapabilitiesPage />} />
                    <Route path="subscription" element={<TechnicianSubscriptionPage />} />
                    <Route path="jobs" element={<TechnicianJobsPage />} />
                    <Route path="earnings" element={<TechnicianEarningsPage />} />
                    <Route path="profile" element={<TechnicianProfilePage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </TechnicianProvider>
          </CustomerProvider>
        </VoiceProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;

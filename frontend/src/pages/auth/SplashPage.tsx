import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  User,
  LogIn,
  UserPlus,
  Zap,
  Droplet,
  Sparkles,
  Scissors,
  Car,
  ShoppingBag,
  HeartHandshake,
  MoreHorizontal,
  ArrowRight,
  Check,
  X,
  Menu,
  ChevronDown,
  Percent,
  HelpCircle,
} from 'lucide-react';
import { FloatingVoiceButton } from '../../components/voice/FloatingVoiceButton';
import { Toast } from '../../components/ui/Toast';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { SERVICE_DOMAINS } from '../../constants/capabilities';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, clearToast, isAuthenticated, isAuthLoading, currentRole, getLastAuthorizedPage } = useApp();
  const { startListening, updateConversationContext, registerPageActionHandler } = useVoice();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalType, setRoleModalType] = useState<'LOGIN' | 'REGISTER' | null>(null);

  // Critical Requirement 3: Remember Last Authorized Page on Reopen / Refresh
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && currentRole && searchParams.get('public') !== '1') {
      const destination = getLastAuthorizedPage(currentRole);
      navigate(destination, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, currentRole, getLastAuthorizedPage, navigate, searchParams]);

  useEffect(() => {
    updateConversationContext({
      currentScreen: '/',
      role: 'customer',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'NAVIGATE_ONBOARDING' || action.type === 'CONTINUE' || action.type === 'START_BOOKING') {
        navigate('/signup?role=customer');
        return true;
      }
      if (action.type === 'NAVIGATE_LOGIN' || action.type === 'SUBMIT_LOGIN') {
        setRoleModalType('LOGIN');
        return true;
      }
      if (action.type === 'NAVIGATE_SIGNUP') {
        setRoleModalType('REGISTER');
        return true;
      }
      if (action.type === 'SWITCH_ROLE_CUSTOMER') {
        navigate('/customer');
        return true;
      }
      if (action.type === 'SWITCH_ROLE_TECHNICIAN') {
        navigate('/technician');
        return true;
      }
      return false;
    });

    return unregister;
  }, [navigate, updateConversationContext, registerPageActionHandler]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-blue-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5 text-rose-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-emerald-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-orange-400" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-teal-400" />;
      default:
        return <MoreHorizontal className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#071A36] text-white flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#071A36]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/20">
              N
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                NEX<span className="text-sky-400">DO</span>
              </span>
              <span className="text-[10px] text-sky-300 font-medium tracking-tight">
                Voice-First Service Engine
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#hero" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Subscriptions
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Dual Authentication CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Login Menu Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setRoleModalType('LOGIN')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Login</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
              </button>

              {/* Hover Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#0c244d] border border-white/15 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <button
                  onClick={() => navigate('/login?role=customer')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-sky-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Customer Login</span>
                    <span className="text-[10px] text-slate-300">Book home services</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/login?role=technician')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer mt-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Service Provider Login</span>
                    <span className="text-[10px] text-slate-300">0% pro commission</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Register Menu Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setRoleModalType('REGISTER')}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
                <ChevronDown className="w-3 h-3 text-blue-200 group-hover:rotate-180 transition-transform" />
              </button>

              {/* Hover Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#0c244d] border border-white/15 rounded-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <button
                  onClick={() => navigate('/signup?role=customer')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-sky-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Customer Registration</span>
                    <span className="text-[10px] text-slate-300">Find & book verified pros</span>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/signup?role=technician')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer mt-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Service Provider Registration</span>
                    <span className="text-[10px] text-slate-300">Keep 100% of your earnings</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-2 pb-2">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Subscriptions
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              FAQ
            </button>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => navigate('/login?role=customer')}
                className="py-2.5 rounded-xl bg-white/10 text-center hover:bg-white/15 text-white"
              >
                Customer Login
              </button>
              <button
                onClick={() => navigate('/login?role=technician')}
                className="py-2.5 rounded-xl bg-emerald-600/30 text-emerald-200 text-center hover:bg-emerald-600/40 border border-emerald-500/30"
              >
                Service Provider Login
              </button>
              <button
                onClick={() => navigate('/signup?role=customer')}
                className="py-2.5 rounded-xl bg-blue-600 text-center text-white"
              >
                Customer Registration
              </button>
              <button
                onClick={() => navigate('/signup?role=technician')}
                className="py-2.5 rounded-xl bg-emerald-600 text-center text-white"
              >
                Service Provider Registration
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative py-12 sm:py-20 px-4 sm:px-8 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Hero Text & CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-sky-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Multilingual Voice-First Service Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Every Service You Need,{' '}
              <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                All in One Place.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-xl">
              Discover everyday services, connect with service providers, and manage your needs through one multilingual, voice-first platform.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalType('REGISTER')}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all cursor-pointer"
              >
                Explore Services
              </button>

              <button
                type="button"
                onClick={() => startListening()}
                className="px-4 py-3.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
                title="Speak to Assistant"
              >
                <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Speak Now</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>0% Commission</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>₹149 Locked Diagnosis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Multi-Skill Pros</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamil & English Voice</span>
              </div>
            </div>
          </div>

          {/* Right Column: Original NEXDO Everyday Services & Voice Assistant Illustration */}
          <div className="lg:col-span-5 relative">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl relative text-left space-y-4">
              {/* Multilingual Voice Assistant Card */}
              <div className="p-4 rounded-2xl bg-[#092247] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                    <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>NEXDO Multilingual Voice Engine</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Voice Ready
                  </span>
                </div>
                <p className="text-xs text-slate-200 italic font-medium">
                  "வீட்டுல ஏசி கூலிங் வரல, உடனே பாக்க சேவை வழங்குநர் வேணும்"
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-sky-200">
                  <span className="px-2 py-0.5 rounded-md bg-white/10">தமிழ்</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10">English</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10">Tanglish</span>
                </div>
              </div>

              {/* Everyday Services Constellation Illustration */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    Connected Service Ecosystem
                  </span>
                  <span className="text-[10px] text-sky-300 font-semibold">9 Service Domains</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-200">Electrical</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <Droplet className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-bold text-slate-200">Plumbing</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <Wrench className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-200">AC & Repair</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-200">Cleaning</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-200">Transport</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#071A36]/70 border border-white/10 flex flex-col items-center text-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-bold text-slate-200">Essentials</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                  <span className="text-slate-300">Transparent Inspection:</span>
                  <span className="font-extrabold text-emerald-300">₹149 Locked Diagnosis Fee</span>
                </div>
              </div>

              {/* Zero Commission Highlight Pill */}
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-200">0% Booking Commission</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold">100% Provider Payout</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ZERO BOOKING COMMISSION POLICY BREAKDOWN */}
      <section className="py-12 bg-white/5 border-y border-white/10 px-4 sm:px-8 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                Fair Economics
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                0% Commission for Service Providers. Keep 100% of What You Earn.
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Traditional aggregator platforms take up to 25%–35% cut from every single booking. At NEXDO, service providers keep 100% of their service payouts without percentage deductions.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aggregator Comparison */}
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wide block">
                  Other Platforms
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>20% to 35% commission cut per job</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Delayed service provider payouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Surge pricing & hidden customer fees</span>
                  </li>
                </ul>
              </div>

              {/* NEXDO Model */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">
                  NEXDO Advantage
                </span>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>0% Commission</strong>: Service providers keep 100%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct instant customer settlement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transparent low-cost subscription passes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICE DOMAINS CATALOG */}
      <section id="services" className="py-16 px-4 sm:px-8 text-left max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
            Service Catalog
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Everyday Services at Your Fingertips
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2">
            Book certified local professionals across 9 core service domains or request custom doorstep assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_DOMAINS.map((domain) => (
            <div
              key={domain.code}
              className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-sky-400/40 hover:bg-white/10 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {getDomainIcon(domain.iconName)}
                  </div>
                  <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                    {domain.nameTamil}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight mb-1">
                  {domain.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {domain.description}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Locked Diagnosis ₹149</span>
                <button
                  type="button"
                  onClick={() => navigate('/signup?role=customer')}
                  className="font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-white/5 border-t border-white/10 px-4 sm:px-8 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              How NEXDO Works
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2">
              Fast, transparent, and voice-enabled from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#092247] border border-white/15 relative">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-black text-white mb-2">Tell Your Need</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Speak naturally in Tamil or English, or type in a few words. NEXDO automatically understands the required service without tedious category searching.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#092247] border border-white/15 relative">
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-black text-white mb-2">Instant Verified Match</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                NEXDO matches verified nearby service providers who have the exact capabilities needed, upfront locked diagnosis pricing, and immediate availability.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#092247] border border-white/15 relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-black text-white mb-2">Doorstep Resolution</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The service provider arrives at your doorstep, conducts inspection, gets your explicit estimate approval, and completes the service with a 30-day guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. KEY BENEFITS FOR BOTH CUSTOMERS & SERVICE PROVIDERS */}
      <section id="features" className="py-16 px-4 sm:px-8 text-left max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
            Why Choose NEXDO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Built for Customers. Fair to Service Providers.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Column */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-sky-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">For Customers</h3>
                <span className="text-xs text-slate-300">Fast, reliable, and stress-free</span>
              </div>
            </div>

            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Voice-First Simplicity</strong>: Just say what you need in Tamil or English without browsing complex menus.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Server-Locked Pricing</strong>: Guaranteed ₹149 diagnosis fee. No unexpected surge charges or hidden markups.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Verified Service Providers</strong>: Every service provider undergoes identity and background checks.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>30-Day Service Warranty</strong>: Doorstep services backed by rework assurance.</span>
              </li>
            </ul>
          </div>

          {/* Service Provider Column */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">For Service Providers</h3>
                <span className="text-xs text-slate-300">Maximum earnings, zero exploitation</span>
              </div>
            </div>

            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>0% Platform Commission</strong>: Keep 100% of your service payouts on every job.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Predictable Subscription Passes</strong>: Flat daily, weekly, or monthly passes. No percentage deductions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Domain Registration</strong>: Register across multiple domains (Electrical, AC, Plumbing, Cleaning, etc.) to maximize request matching.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Direct Payouts</strong>: Receive customer payments directly upon completing work.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. PROVIDER SUBSCRIPTION PASS DETAILS */}
      <section id="pricing" className="py-16 bg-white/5 border-t border-white/10 px-4 sm:px-8 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
              Transparent Pro Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Service Provider Subscription Passes
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2">
              No hidden commission. Flat, affordable passes giving you access to all customer service requests in your area.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Daily Pass */}
            <div className="p-6 rounded-3xl bg-[#092247] border border-white/15 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wide block">
                  Daily Pass
                </span>
                <div className="my-3">
                  <span className="text-3xl font-black text-white">₹99</span>
                  <span className="text-xs text-slate-300"> / 24 hours</span>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Ideal for part-time work or occasional free days.
                </p>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>24-Hour Request Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0% Platform Commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multi-Domain Request Matching</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate('/signup?role=technician')}
                className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Choose Daily
              </button>
            </div>

            {/* Weekly Pass */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-900/60 to-[#092247] border border-blue-400/40 relative flex flex-col justify-between shadow-xl">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-blue-500 text-[10px] font-black uppercase tracking-wider text-white">
                Popular
              </div>
              <div>
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wide block">
                  Weekly Pass
                </span>
                <div className="my-3">
                  <span className="text-3xl font-black text-white">₹599</span>
                  <span className="text-xs text-slate-300"> / 7 days</span>
                </div>
                <p className="text-xs text-slate-200 mb-4">
                  Save 15% compared to daily passes. Great for active weeks.
                </p>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>7 Days Unlimited Request Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0% Platform Commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Customer Phone Connection</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate('/signup?role=technician')}
                className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Choose Weekly
              </button>
            </div>

            {/* Monthly Pass */}
            <div className="p-6 rounded-3xl bg-[#092247] border border-white/15 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
                  Monthly Pass
                </span>
                <div className="my-3">
                  <span className="text-3xl font-black text-white">₹2,499</span>
                  <span className="text-xs text-slate-300"> / 30 days</span>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Maximum savings for full-time dedicated service providers.
                </p>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>30 Days Full Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0% Platform Commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Pro Priority Badge</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => navigate('/signup?role=technician')}
                className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Choose Monthly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. MULTILINGUAL VOICE ASSISTANT SHOWCASE */}
      <section className="py-16 px-4 sm:px-8 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-sky-900/30 to-blue-900/40 border border-white/15 shadow-2xl space-y-6">
          <button
            type="button"
            onClick={() => startListening()}
            className="w-20 h-20 rounded-3xl bg-blue-600/40 border border-blue-400/40 flex items-center justify-center mx-auto shadow-2xl relative cursor-pointer hover:bg-blue-600/60 hover:scale-105 transition-all focus:outline-none"
            title="Click to speak with assistant"
          >
            <Mic className="w-10 h-10 text-sky-300 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#071A36]" />
          </button>

          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Speak Naturally. Get Doorstep Fixes.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
              No complicated category trees. Speak in Tamil, English, or Tanglish. NEXDO extracts the exact appliance, fault, and timing automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200">
              "ஃபேன் ஓடல, சத்தம் வருது"
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200">
              "Need AC gas refill today"
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200">
              "Plumbing pipe leak in kitchen"
            </span>
          </div>
        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 bg-white/5 border-t border-white/10 px-4 sm:px-8 text-left">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2">
              Everything you need to know about NEXDO’s voice-first platform, zero-commission model, and service domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#092247] border border-white/15 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <h3 className="text-sm font-extrabold text-white">
                  How does NEXDO’s 0% booking commission work?
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                NEXDO never deducts a percentage from a service provider’s earnings. Service providers keep 100% of customer payments and access platform request matching through transparent Daily, Weekly, or Monthly subscription passes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#092247] border border-white/15 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <h3 className="text-sm font-extrabold text-white">
                  How can I log in to my Customer or Service Provider account?
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                Both Customers and Service Providers can sign in using any of three methods: their registered 10-digit Mobile Number, Email Address, or unique Username, paired with their account password.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#092247] border border-white/15 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <h3 className="text-sm font-extrabold text-white">
                  Can a service provider register for multiple service domains?
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                Yes. During Service Provider registration, providers can select one or multiple service domains—such as Electrical, Plumbing, AC & Appliance Repair, Cleaning, and more—and their selections are saved for relevant request matching.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#092247] border border-white/15 space-y-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <h3 className="text-sm font-extrabold text-white">
                  Does NEXDO guarantee a fixed number of daily jobs?
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                No. Subscription passes grant platform access and multi-domain request matching without commission cuts, but request volume depends on real customer demand in your service area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. ROLE SELECTION MODAL DIALOG */}
      {roleModalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0c244d] border border-white/20 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setRoleModalType(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-1">
                {roleModalType === 'LOGIN' ? 'Login' : 'Create Account'}
              </span>
              <h3 className="text-xl font-black text-white">
                {roleModalType === 'LOGIN' ? 'Select Your Login Portal' : 'How will you use NEXDO?'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Choose your role below to continue to the dedicated Customer or Service Provider flow.
              </p>
            </div>

            <div className="space-y-3">
              {/* Customer Choice */}
              <button
                type="button"
                onClick={() => {
                  setRoleModalType(null);
                  navigate(roleModalType === 'LOGIN' ? '/login?role=customer' : '/signup?role=customer');
                }}
                className="w-full p-4 rounded-2xl bg-white/10 border border-white/15 hover:border-blue-400 hover:bg-white/15 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-sky-300 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-white block">
                      {roleModalType === 'LOGIN' ? 'Customer Login' : 'Customer Registration'}
                    </span>
                    <span className="text-[11px] text-slate-300">Book trusted doorstep services</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Service Provider Choice */}
              <button
                type="button"
                onClick={() => {
                  setRoleModalType(null);
                  navigate(roleModalType === 'LOGIN' ? '/login?role=technician' : '/signup?role=technician');
                }}
                className="w-full p-4 rounded-2xl bg-white/10 border border-white/15 hover:border-emerald-400 hover:bg-white/15 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-white block">
                      {roleModalType === 'LOGIN'
                        ? 'Service Provider Login'
                        : 'Service Provider Registration'}
                    </span>
                    <span className="text-[11px] text-slate-300">Keep 100% earnings with 0% commission</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. FOOTER */}
      <footer className="mt-auto pt-10 pb-8 border-t border-white/10 text-xs text-slate-400 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              N
            </div>
            <span className="font-bold text-white">NEXDO Platform</span>
            <span>· © 2026 NEXDO Technologies. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => navigate('/login?role=customer')} className="hover:text-white transition-colors">
              Customer Login
            </button>
            <button onClick={() => navigate('/login?role=technician')} className="hover:text-white transition-colors">
              Service Provider Login
            </button>
            <button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">
              Register
            </button>
            <button onClick={() => navigate('/forgot-password')} className="hover:text-white transition-colors">
              Password Reset
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Voice Assistant */}
      <FloatingVoiceButton />
    </div>
  );
};

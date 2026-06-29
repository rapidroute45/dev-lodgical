import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@/modules/landing/presentation/landing.css";

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${visible ? "landing-reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const ICONS = {
  store: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </svg>
  ),
  phone: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  ),
  map: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  ),
  manager: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  planner: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.5M15 4V2.5M8.5 11l2 2 4-4" />
    </svg>
  ),
  driver: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h6.2L17 10h2a2 2 0 0 1 2 2v3h-2" />
      <path d="M3 15v-2h12v2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  accountant: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h3M8 15h3" />
      <circle cx="15.5" cy="14.5" r="2" />
    </svg>
  ),
  arrow: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: ICONS.store,
    title: "Store-to-Route Planning",
    text: "Build schedules, assign routes, and coordinate stores from one command center.",
  },
  {
    icon: ICONS.phone,
    title: "Mobile Route Execution",
    text: "Drivers run routes on mobile with GPS, geofencing, stop completion, and proof of delivery.",
  },
  {
    icon: ICONS.map,
    title: "Live Dispatch Monitoring",
    text: "Track every driver and route on a live map with real-time status updates.",
  },
];

const ROLES = [
  { icon: ICONS.manager, title: "Managers", text: "Strategic dashboard, stats, and route assignment." },
  { icon: ICONS.planner, title: "Planners", text: "Schedule creation, store management, and dispatch ops." },
  { icon: ICONS.driver, title: "Drivers", text: "Route offers, navigation, stop completion, and live tracking." },
  { icon: ICONS.accountant, title: "Accountants", text: "Payroll bills, store rates, and route-level reporting." },
];

const LIFECYCLE = [
  { label: "Pending", cls: "landing__pill--pending" },
  { label: "Accepted", cls: "landing__pill--accepted" },
  { label: "In Progress", cls: "landing__pill--progress" },
  { label: "Completed", cls: "landing__pill--done" },
];

export function LandingScreen() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      <div className="landing__mesh" />

      <div className="landing__content">
        {/* Nav */}
        <nav className={`landing__nav ${scrolled ? "landing__nav--scrolled" : ""}`}>
          <div className="landing__section flex items-center justify-between py-4">
            <span className="landing__brand">Dispatch.co</span>
            <div className="hidden items-center gap-8 md:flex">
              <a className="landing__navlink text-sm" href="#platform">Platform</a>
              <a className="landing__navlink text-sm" href="#solutions">Solutions</a>
              <a className="landing__navlink text-sm" href="#lifecycle">Lifecycle</a>
            </div>
            <Link
              to="/login"
              className="landing__btn-glow rounded-full px-5 py-2 text-sm"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="landing__section flex flex-col items-center gap-12 py-20 md:flex-row md:py-28">
          <Reveal className="flex-1">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Revolutionize Your
              <br />
              Last-Mile Field Dispatch
            </h1>
            <p className="mt-6 max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
              Dispatch.co is an integrated operations platform to Plan, Assign, Execute,
              and Track daily delivery schedules — from store to front door.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/login" className="landing__btn-glow rounded-full px-7 py-3 text-base">
                Request a Demo
              </Link>
              <a href="#platform" className="landing__btn-outline rounded-full px-7 py-3 text-base">
                Learn More
              </a>
            </div>
          </Reveal>

          <Reveal className="flex-1" delay={150}>
            <div className="landing__map w-full">
              <div className="landing__route" />
              <div className="relative p-5">
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  Live route preview
                </span>
                <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  Drivers · Stops · Geofencing · Real-time map sync
                </p>
              </div>
            </div>
          </Reveal>
        </header>

        {/* Platform features */}
        <section id="platform" className="landing__section py-12">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="landing__card p-7">
                  <div className="landing__icon">{f.icon}</div>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Solutions by role */}
        <section id="solutions" className="landing__section py-16">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Solutions By Role</h2>
              <p className="mt-2" style={{ color: "var(--text-muted)" }}>
                Key benefits tailored to every member of your operation.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} delay={i * 100}>
                <div className="landing__card p-6 text-center">
                  <div className="landing__avatar">{r.icon}</div>
                  <h4 className="mt-4 font-bold">{r.title}</h4>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Lifecycle */}
        <section id="lifecycle" className="landing__section py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold tracking-tight">Lifecycle of a Route</h2>
            <p className="mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              The core flow every delivery follows.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {LIFECYCLE.map((step, i) => (
                <div key={step.label} className="flex items-center gap-4">
                  <span className={`landing__pill ${step.cls}`}>{step.label}</span>
                  {i < LIFECYCLE.length - 1 && ICONS.arrow}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Testimonial */}
        <section className="landing__section py-12">
          <Reveal>
            <div className="landing__card mx-auto max-w-3xl p-10 text-center">
              <div className="landing__quote-mark">&ldquo;</div>
              <p className="mt-4 text-xl leading-relaxed">
                Dispatch.co gave us one place to plan routes, watch drivers live, and close
                out payroll — without juggling spreadsheets and phone calls.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="landing__avatar" style={{ width: 52, height: 52, fontSize: "1.1rem" }}>
                  {ICONS.manager}
                </div>
                <div className="text-left">
                  <strong>Elena Bermant</strong>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>Client Partner</div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="landing__section pb-20 pt-8">
          <Reveal>
            <div className="landing__cta px-8 py-12 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Ready to Transform Your Operations?</h2>
              <p className="mt-2" style={{ color: "var(--text-muted)" }}>
                Sign in to your workspace and see Dispatch.co in action.
              </p>
              <Link to="/login" className="landing__btn-glow mt-6 inline-block rounded-full px-8 py-3 text-base">
                Get Started
              </Link>
            </div>
          </Reveal>
        </section>

        <footer className="landing__section border-t py-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Dispatch.co — Last-mile dispatch platform
        </footer>
      </div>
    </div>
  );
}

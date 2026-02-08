/*
PharmaTrace — Web3 Landing Page (React + Tailwind CSS)

How to use:
1. Create a new Vite React project (React + JSX):
   npm create vite@latest pharmatrace -- --template react
   cd pharmatrace
2. Install Tailwind CSS (recommended) and dependencies:
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
  //  Configure tailwind.config.js to include ./src/**/

// 3. Add Tailwind directives to src/index.css:
//    @tailwind base;
//    @tailwind components;
//    @tailwind utilities;
// 4. Replace src/App.jsx with this file content and import the css in main.jsx:
//    import './index.css'
// 5. Start dev server: npm run dev

// Notes:
// - This file is a single-file React component (default export) built with Tailwind CSS.
// - It intentionally uses minimal external libs so it's production-ready in a Vite + Tailwind setup.
// - Replace placeholder icons, QR images and logos with your production assets when ready.
// */

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from './Components/TopNav'

export default function App() {
  const navigate = useNavigate()
  const heroRef = useRef(null)

  useEffect(() => {
    // simple fade-in on load for sections using observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-6')
          }
        })
      },
      { threshold: 0.12 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function openScanner() {
    navigate('/scan')
  }

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-b from-[#030712] via-[#050b14] to-[#0a0f1a] relative overflow-x-hidden">
      {/* Background animated particles / nodes */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#06242244] via-transparent to-transparent opacity-60" />
        <svg className="absolute right-0 top-12 w-96 h-96 opacity-20 animate-float" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#00ff9c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00e0ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g fill="url(#g1)">
            <circle cx="40" cy="60" r="36" />
            <circle cx="140" cy="20" r="18" />
            <circle cx="170" cy="130" r="10" />
          </g>
        </svg>
      </div>

      <TopNav />

      <main id="home" className="relative">
        {/* HERO */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 reveal opacity-0 translate-y-6 transition-all duration-700">
            <div className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <svg className="w-4 h-4 text-green-300" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="#6ee7b7" strokeWidth="0.8" />
              </svg>
              <span>Live on Sepolia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">Verify Medicines. Eliminate Counterfeits.</h1>
            <p className="mt-6 text-lg text-slate-300 max-w-xl">PharmaTrace connects every physical medicine bottle to an immutable digital record on the Ethereum blockchain. Scan a QR, verify authenticity in seconds.</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={openScanner} aria-label="Scan Medicine" className="inline-flex items-center gap-3 rounded-full px-5 py-3 font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-gradient-to-r from-green-400 to-cyan-400 text-black hover:scale-[1.02] transform transition"> 
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="#022" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Scan Medicine (Consumer)
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-3 rounded-full px-5 py-3 font-medium border border-white/15 text-slate-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              >
                Manufacturer Dashboard
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">🔒</div>
                <div>
                  <div className="font-semibold text-sm">Immutable</div>
                  <div className="text-xs">Tamper-proof records</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">⚡</div>
                <div>
                  <div className="font-semibold text-sm">Fast</div>
                  <div className="text-xs">Verify in seconds</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">🔍</div>
                <div>
                  <div className="font-semibold text-sm">Open</div>
                  <div className="text-xs">Open source tooling</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end reveal opacity-0 translate-y-6 transition-all duration-700">
            <div className="relative max-w-sm w-full">
              {/* glowing background */}
              <div className="absolute -inset-6 rounded-2xl blur-3xl bg-gradient-to-br from-green-400/20 to-cyan-400/10 opacity-60 -z-10" />

              {/* Ethereum floating orb and QR card */}
              <div className="p-6 rounded-2xl backdrop-blur-md bg-white/3 border border-white/6 shadow-2xl flex flex-col items-center gap-6">
                <div className="animate-rotate-slow p-4 rounded-full bg-white/5 border border-white/6">
                  <EthereumLogo className="w-20 h-20" />
                </div>

                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-white/3 to-white/2 p-4 flex items-center justify-center">
                  <div className="bg-white/8 rounded-md p-4 w-full h-full flex items-center justify-center">
                    {/* Placeholder QR - replace with generated QR */}
                    <svg viewBox="0 0 100 100" className="w-full h-full max-w-[180px] max-h-[180px]" aria-hidden>
                      <rect width="100" height="100" fill="#020617" />
                      <g fill="#89ffbf" opacity="0.95">
                        <rect x="6" y="6" width="18" height="18" />
                        <rect x="76" y="6" width="18" height="18" />
                        <rect x="6" y="76" width="18" height="18" />
                        {/* random pattern */}
                        <rect x="40" y="40" width="6" height="6" />
                        <rect x="50" y="48" width="6" height="6" />
                        <rect x="30" y="60" width="6" height="6" />
                        <rect x="60" y="30" width="6" height="6" />
                      </g>
                    </svg>
                  </div>
                </div>

                <div className="text-xs text-slate-300">Sample QR — Try the demo scanner</div>

                <div className="flex gap-3">
                  <button onClick={openScanner} className="px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 text-black font-semibold">Open Scanner</button>
                  {/* <a href="#" className="px-4 py-2 rounded-full border border-white/8">Learn More</a> */}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-8 reveal opacity-0 translate-y-6">
            <h2 className="text-3xl font-bold">The Problem: Counterfeit Drugs</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">Counterfeit medicines infiltrate supply chains globally, endangering patients and undermining trust. Real-time verification is essential.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Fake Medicines', text: 'Millions of fake medicines enter supply chains every year.' },
              { title: 'No Real-Time Trust', text: 'Consumers cannot verify authenticity instantly.' },
              { title: 'Risk to Lives', text: 'Counterfeits cause treatment failure and side effects.' },
            ].map((c, i) => (
              <article key={c.title} className="reveal opacity-0 translate-y-6 transition-all duration-600 bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 hover:scale-[1.02] transform transition-shadow" tabIndex={0}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400/20 to-cyan-400/10 flex items-center justify-center border border-white/6">
                    <div className="text-2xl">{i === 0 ? '💊' : i === 1 ? '⏱️' : '⚠️'}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                    <p className="mt-2 text-slate-300">{c.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Solution / Flow */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" aria-labelledby="solution-heading">
          <div className="text-center mb-10 reveal opacity-0 translate-y-6">
            <h2 id="solution-heading" className="text-3xl font-bold">How PharmaTrace Works</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">A simple, secure 3-step flow that links physical products to on-chain records.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FlowStep title="Mint" desc="Manufacturer records batch on Ethereum." icon={'🪙'} />
                <FlowStep title="Print QR" desc="Unique QR printed on bottle." icon={'📦'} />
                <FlowStep title="Scan & Verify" desc="Consumer scans to verify instantly." icon={'📱'} />
              </div>
            </div>

            <div className="hidden lg:block w-1/4">
              <div className="h-1 w-full flex items-center justify-center">
                <div className="w-0.5 h-48 bg-gradient-to-b from-green-400 to-cyan-400 rounded" />
              </div>
            </div>
          </div>
        </section>

        {/* LIVE DEMO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 reveal opacity-0 translate-y-6">
          <div className="bg-gradient-to-br from-white/3 to-white/2 p-6 rounded-2xl backdrop-blur-md border border-white/6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold">Live Demo</h3>
              <p className="mt-2 text-slate-300">Try a sample QR and scanner flow — simple and secure.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-lg bg-black grid place-items-center border border-white/6">
                {/* small QR thumbnail */}
                <svg viewBox="0 0 100 100" className="w-20 h-20" aria-hidden>
                  <rect width="100" height="100" fill="#031218" />
                  <g fill="#79ffd1">
                    <rect x="6" y="6" width="18" height="18" />
                    <rect x="76" y="6" width="18" height="18" />
                    <rect x="6" y="76" width="18" height="18" />
                  </g>
                </svg>
              </div>
              <button onClick={openScanner} className="px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-cyan-400 text-black font-semibold">Open Scanner</button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" aria-labelledby="features-heading">
          <div className="text-center mb-8 reveal opacity-0 translate-y-6">
            <h2 id="features-heading" className="text-3xl font-bold">Key Features</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">Secure, fast, and easy verification for everyone involved in the supply chain.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Immutable Records', desc: 'On-chain batch records that cannot be tampered.' },
              { title: 'Instant Verification', desc: 'Scan a QR and get an answer in seconds.' },
              { title: 'Anti-Replay Protection', desc: 'Unique per-unit QR with freshness proofs.' },
              { title: 'Manufacturer Dashboard', desc: 'Manage batches, mint tokens, and audit logs.' },
            ].map((f) => (
              <article key={f.title} className="reveal opacity-0 translate-y-6 transition-all duration-600 bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 hover:scale-[1.02] focus:outline-none" tabIndex={0}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400/20 to-cyan-400/10 flex items-center justify-center border border-white/6">🔐</div>
                  <div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="mt-2 text-slate-300 text-sm">{f.desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Target Users */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-8 reveal opacity-0 translate-y-6">
            <h2 className="text-3xl font-bold">Built For Everyone in the Supply Chain</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">From consumers to manufacturers and inspectors — simple to use, hard to break.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 reveal opacity-0 translate-y-6">
            <div className="bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 text-center">
              <div className="text-4xl">👥</div>
              <h4 className="mt-4 font-semibold">Consumers</h4>
              <p className="mt-2 text-slate-300 text-sm">Scan medicines before use.</p>
            </div>
            <div className="bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 text-center">
              <div className="text-4xl">🏭</div>
              <h4 className="mt-4 font-semibold">Manufacturers</h4>
              <p className="mt-2 text-slate-300 text-sm">Secure product authenticity.</p>
            </div>
            <div className="bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 text-center">
              <div className="text-4xl">🩺</div>
              <h4 className="mt-4 font-semibold">Pharmacists / Inspectors</h4>
              <p className="mt-2 text-slate-300 text-sm">Validate products instantly.</p>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-8 reveal opacity-0 translate-y-6">
            <h2 className="text-3xl font-bold">Powered By Web3</h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">Deployed on Ethereum Sepolia Testnet.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6 reveal opacity-0 translate-y-6">
            {['Ethereum','Solidity','Hardhat','React','Vite','Tailwind','MetaMask','Ethers.js'].map((t) => (
              <div key={t} className="bg-white/3 backdrop-blur-md border border-white/6 rounded-xl p-4 flex items-center justify-center text-sm">{t}</div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 reveal opacity-0 translate-y-6">
          <div className="rounded-2xl p-10 bg-gradient-to-br from-green-600/20 to-cyan-600/10 border border-white/6 backdrop-blur-md text-center">
            <h2 className="text-3xl font-bold">Start Verifying Today</h2>
            <p className="mt-3 text-slate-200 max-w-2xl mx-auto">Protect patients, secure supply chains, and restore trust with PharmaTrace.</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={openScanner} className="px-6 py-3 rounded-full bg-black/70 border border-white/6 text-green-300 font-semibold">Scan Medicine</button>
              <a href="#" className="px-6 py-3 rounded-full bg-transparent border border-white/8 text-white">Manufacturer Login</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="mt-20 border-t border-white/6 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400/20 to-cyan-400/10 border border-white/6 grid place-items-center">PT</div>
                <div>
                  <div className="font-semibold">PharmaTrace</div>
                  <div className="text-sm text-slate-300">Securing the future of medicine with blockchain.</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div>
                <div className="font-semibold mb-2">Quick Links</div>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li><a href="#home">Home</a></li>
                  <li><a href="#how">How It Works</a></li>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#tech">Tech</a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="font-semibold mb-2">Follow</div>
              <div className="flex gap-3">
                <a href="#" aria-label="GitHub" className="p-2 rounded-md bg-white/3 border border-white/6">GH</a>
                <a href="#" aria-label="LinkedIn" className="p-2 rounded-md bg-white/3 border border-white/6">IN</a>
                <a href="#" aria-label="Twitter" className="p-2 rounded-md bg-white/3 border border-white/6">TW</a>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} PharmaTrace — Built with Web3.</div>
        </footer>
      </main>

      {/* Extra styles */}
      <style>{`
        .animate-rotate-slow{ animation: rotate 14s linear infinite; }
        @keyframes rotate{ from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
        .animate-float{ animation: float 10s linear infinite; }
        @keyframes float{ 0%{ transform: translateY(0px);} 50%{ transform: translateY(-18px);} 100%{ transform: translateY(0px);} }
        .blur-3xl{ filter: blur(48px); }
      `}</style>
    </div>
  )
}

/* Reusable components used above */
function EthereumLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ethereum logo">
      <path d="M127.7 0L124.2 11.9V281.5L127.7 284.9L255.4 212.6L127.7 0Z" fill="#00E0FF" opacity="0.9" />
      <path d="M127.7 0L0 212.6L127.7 284.9V154.2V0Z" fill="#00FF9C" opacity="0.9" />
      <path d="M127.7 312.3L125.4 314.9V416.7L127.7 417L255.7 238.3L127.7 312.3Z" fill="#00C9D7" opacity="0.85" />
      <path d="M127.7 417V312.3L0 238.3L127.7 417Z" fill="#00FFA8" opacity="0.85" />
    </svg>
  )
}

function FlowStep({ title, desc, icon }) {
  return (
    <div className="bg-white/3 backdrop-blur-md border border-white/6 rounded-2xl p-6 flex flex-col items-start gap-4 hover:scale-[1.02] transform transition" tabIndex={0}>
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400/20 to-cyan-400/10 flex items-center justify-center border border-white/6 text-2xl">{icon}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-2 text-slate-300 text-sm">{desc}</p>
      </div>
    </div>
  )
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import axios from 'axios';
import { Loader2, Calculator, CheckCircle2, AlertCircle, Download, ChevronDown, ChevronUp, LineChart as LucideLineChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [equation, setEquation] = useState("y' = x + y");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/solve`, {
        equation
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || "Failed to solve the equation.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not connect to the math engine.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "login" : "register";
      const res = await axios.post(`${API_URL}/api/auth/${endpoint}`, authForm);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setShowAuth(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Authentication failed");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('solution-container');
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: 1,
      filename: 'ode_solution.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-bold text-xl tracking-wider text-white">ODE<span className="text-blue-500">SOLVER</span></div>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <span className="text-gray-300">Hi, {user.name}</span>
              <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition">History</button>
              <button onClick={logout} className="text-sm bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-full transition">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-semibold transition">Login / Signup</button>
          )}
        </div>
      </div>

      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl flex flex-col items-center"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-3 glass-card rounded-2xl mb-6"
          >
            <Calculator className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Master <span className="text-gradient">Differential Equations</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Step-by-step solutions for Exact, Linear, Bernoulli, and more. Enter your equation below and see the magic happen.
          </p>
        </div>

        <form onSubmit={handleSolve} className="w-full max-w-2xl relative mb-12 px-4 md:px-0">
          <div className="glass-card p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row items-center shadow-2xl transition-all duration-300 focus-within:shadow-blue-500/20 focus-within:border-blue-500/50">
            <input 
              type="text" 
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="e.g. y' = x + y"
              className="w-full md:flex-1 bg-transparent border-none outline-none px-6 py-4 text-xl text-white placeholder-gray-500 font-mono"
            />
            <button 
              type="submit" 
              disabled={loading || !equation}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl md:rounded-full font-semibold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solve"}
            </button>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Supported formats: <code className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded">y'</code> or <code className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded">dy/dx</code>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-2xl glass-card border-red-500/30 p-6 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-red-400 font-semibold text-lg">Error processing equation</h3>
                <p className="text-gray-300 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              id="solution-container"
              className="w-full glass-card rounded-3xl p-8 md:p-12 relative"
            >
              <div className="flex flex-col items-center border-b border-white/10 pb-8 mb-8 relative">
                <button onClick={handleDownloadPDF} className="absolute right-0 top-0 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition" title="Download PDF">
                  <Download className="w-5 h-5" />
                </button>
                <span className="text-sm uppercase tracking-widest text-blue-400 font-semibold mb-2">Original Equation</span>
                <div className="text-3xl md:text-4xl text-center overflow-x-auto w-full py-4">
                  <Latex>{`$$${result.equation}$$`}</Latex>
                </div>
              </div>

              <div className="space-y-6 mt-12">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  Solution Breakdown ({result.type})
                </h3>
                
                <div className="space-y-4">
                  {result.steps?.map((step: any, idx: number) => {
                    const isExpanded = expandedStep === idx;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all"
                      >
                        <div 
                          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5"
                          onClick={() => setExpandedStep(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isExpanded ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                              {idx + 1}
                            </div>
                            <h4 className="text-lg font-medium text-gray-200">{step.title}</h4>
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-6 pb-6"
                            >
                              <p className="text-gray-400 mb-4 ml-12">{step.detail}</p>
                              {step.latex && (
                                <div className="bg-black/50 p-4 rounded-xl overflow-x-auto ml-12 border border-white/5">
                                  <Latex>{`$$${step.latex}$$`}</Latex>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {result.plotData && result.plotData.length > 0 && (
                <div className="mt-12 space-y-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <LucideLineChart className="w-6 h-6 text-purple-400" />
                    Solution Graph (C=1)
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.plotData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                          itemStyle={{ color: '#8b5cf6' }}
                        />
                        <Line type="monotone" dataKey="y" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAuth && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card p-8 rounded-2xl w-full max-w-md relative">
                <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold mb-6">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <input type="text" placeholder="Name" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  )}
                  <input type="email" placeholder="Email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition">{isLogin ? "Login" : "Sign Up"}</button>
                </form>
                <p className="mt-4 text-center text-gray-400 text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:underline">{isLogin ? "Sign up" : "Login"}</button>
                </p>
              </motion.div>
            </motion.div>
          )}

          {showHistory && (
            <motion.div 
              initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md glass-card z-40 border-l border-white/10 p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 mt-16">
                <h2 className="text-2xl font-bold">Your History</h2>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">&times;</button>
              </div>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-gray-500">No saved equations yet.</p>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition" onClick={() => {
                      setEquation(item.equation);
                      setResult({ success: true, equation: item.equation, type: item.type, solution_latex: item.solution_latex, steps: item.steps });
                      setShowHistory(false);
                    }}>
                      <div className="text-xs text-blue-400 mb-2">{new Date(item.createdAt).toLocaleDateString()} - {item.type}</div>
                      <Latex>{`$$${item.equation}$$`}</Latex>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ChevronRight, Sparkles } from "lucide-react";

interface OnboardingModalProps {
  user: any;
  onComplete: () => void;
}

const BRANCHES = [
  { id: "CSE", name: "Computer Science & Engineering" },
  { id: "CSE-AIML", name: "CSE - AI & ML" },
  { id: "ECE", name: "Electronics & Communication" },
  { id: "EEE", name: "Electrical & Electronics" },
  { id: "ME", name: "Mechanical Engineering" },
  { id: "CE", name: "Civil Engineering" },
  { id: "IOT", name: "Internet of Things" },
  { id: "AIDS", name: "AI & Data Science" },
  { id: "OTHER", name: "Other" },
];

const YEARS = [
  { id: "1", name: "1st Year" },
  { id: "2", name: "2nd Year" },
  { id: "3", name: "3rd Year" },
  { id: "4", name: "4th Year" },
];

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show modal if user doesn't have branch or year set
    if (user && (!user.branch || !user.year)) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!branch || !year) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, year }),
      });

      if (res.ok) {
        setIsOpen(false);
        onComplete();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name?.split(' ')[0]}!</h2>
            <p className="text-indigo-100 text-sm">Let's personalize your experience</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select your Branch</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">We'll show you subjects relevant to your department</p>
                
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBranch(b.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        branch === b.id
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                      }`}
                    >
                      <p className={`font-medium text-sm ${branch === b.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                        {b.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.name}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!branch}
                  className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select your Year</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">We'll filter content based on your current semester</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {YEARS.map((y) => (
                    <button
                      key={y.id}
                      onClick={() => setYear(y.id)}
                      className={`p-6 rounded-xl border-2 text-center transition-all ${
                        year === y.id
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                      }`}
                    >
                      <p className={`text-2xl font-bold mb-1 ${year === y.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                        {y.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{y.name}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!year || loading}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Saving..." : (
                      <>
                        <Sparkles size={20} /> Let's Go!
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Progress */}
          <div className="px-8 pb-6">
            <div className="flex gap-2">
              <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

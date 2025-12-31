"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Image from "next/image";

interface Testimonial {
  id: string;
  rating: number;
  message: string;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
    branch: string | null;
    year: string | null;
  };
}

interface TestimonialsData {
  testimonials: Testimonial[];
  stats: {
    averageRating: number;
    totalReviews: number;
  };
}

interface TestimonialsProps {
  variant?: "landing" | "dashboard";
  autoPlay?: boolean;
  showStats?: boolean;
}

export default function Testimonials({ 
  variant = "landing", 
  autoPlay = true,
  showStats = true 
}: TestimonialsProps) {
  const [data, setData] = useState<TestimonialsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!autoPlay || !data || data.testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev === data.testimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, data]);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/testimonials?limit=10");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (!data) return;
    setCurrentIndex((prev) => 
      prev === data.testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (!data) return;
    setCurrentIndex((prev) => 
      prev === 0 ? data.testimonials.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className={`${variant === "landing" ? "py-16" : "py-6"}`}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className={`h-8 w-64 ${variant === "landing" ? "bg-white/10" : "bg-gray-200"} rounded-lg`} />
          <div className={`h-32 w-full max-w-2xl ${variant === "landing" ? "bg-white/10" : "bg-gray-200"} rounded-xl`} />
        </div>
      </div>
    );
  }

  if (!data || data.testimonials.length === 0) {
    return null; // Don't show section if no approved testimonials
  }

  const { testimonials, stats } = data;

  // Landing page variant - full carousel
  if (variant === "landing") {
    return (
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header with Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
              What Students Say
            </h2>
            {showStats && stats.totalReviews > 0 && (
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={`${
                        star <= Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-500"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-white">{stats.averageRating}</span>
                <span className="text-gray-400">from {stats.totalReviews} reviews</span>
              </div>
            )}
          </motion.div>

          {/* Carousel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10"
              >
                <Quote className="w-10 h-10 text-blue-300/40 mx-auto mb-4" />
                <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed">
                  &ldquo;{testimonials[currentIndex].message}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-4">
                  {testimonials[currentIndex].user.image ? (
                    <Image
                      src={testimonials[currentIndex].user.image}
                      alt={testimonials[currentIndex].user.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonials[currentIndex].user.name[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-white">
                      {testimonials[currentIndex].user.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {testimonials[currentIndex].user.branch && testimonials[currentIndex].user.year
                        ? `${testimonials[currentIndex].user.branch} • ${testimonials[currentIndex].user.year}`
                        : "Student"}
                    </p>
                  </div>
                  <div className="flex gap-0.5 ml-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${
                          star <= testimonials[currentIndex].rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-blue-400 w-6"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Dashboard variant - compact cards grid
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          What Students Say
        </h2>
        {showStats && stats.totalReviews > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{stats.averageRating}</span>
            <span className="text-gray-400">({stats.totalReviews})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.slice(0, 3).map((testimonial, idx) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-3">
              {testimonial.user.image ? (
                <Image
                  src={testimonial.user.image}
                  alt={testimonial.user.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.user.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {testimonial.user.name}
                </p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={`${
                        star <= testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3">
              &ldquo;{testimonial.message}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Stats Badge Component - for inline use
export function TestimonialsBadge() {
  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);

  useEffect(() => {
    fetch("/api/testimonials?limit=1")
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, []);

  if (!stats || stats.totalReviews === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= Math.round(stats.averageRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400"
            }`}
          />
        ))}
      </div>
      <span className="font-semibold text-white">{stats.averageRating}</span>
      <span className="text-gray-300">from {stats.totalReviews}+ students</span>
    </div>
  );
}

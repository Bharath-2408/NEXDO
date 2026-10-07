import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useApp } from '../../store/AppContext';
import { Button } from '../../components/ui/Button';

export const CustomerReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings, updateBookingReview } = useCustomer();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Excellent service, technician arrived on time and fixed cooling quickly.');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual', 'Expert Work']);

  const availableTags = [
    'Punctual',
    'Expert Work',
    'Polite Behavior',
    'Clean Up Done',
    'Fair Pricing',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingReview(booking.id, rating, comment, selectedTags);
    showToast('Thank you for rating your technician!', 'success');
    navigate('/customer/bookings');
  };

  return (
    <div className="max-w-md mx-auto text-left space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-black text-[#071A36]">Rate Your Service</h2>
        <p className="text-xs text-slate-500 mt-1">
          Help maintain quality standards for {booking.provider.name}.
        </p>

        {/* 5-Star Selector */}
        <div className="flex items-center justify-center gap-2 my-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1.5 transition-transform hover:scale-110 focus-ring rounded-lg"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Feedback Tag Pills */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            What went well?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSel = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isSel
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Review comment */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Detailed Feedback
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 text-xs text-slate-800 border border-slate-300 rounded-xl focus-ring"
          />
        </div>

        <Button fullWidth size="lg" onClick={handleSubmit}>
          Submit Review
        </Button>
      </div>
    </div>
  );
};

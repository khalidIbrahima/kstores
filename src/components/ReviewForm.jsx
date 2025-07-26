import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StarRating from './StarRating';

export default function ReviewForm({ productId, userId, onReviewAdded }) {
  const [rate, setRate] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      if (!userId || !productId) return;
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('userId', userId)
        .eq('productId', productId)
        .single();
      if (data) setExistingReview(data);
    };
    fetchReview();
  }, [userId, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('reviews').insert({
      userId: userId,
      productId: productId,
      rate,
      comment
    });
    setLoading(false);
    setSuccess(true);
    setRate(5);
    setComment('');
    if (onReviewAdded) onReviewAdded();
    setTimeout(() => setSuccess(false), 2000);
    // Rafraîchir l'avis existant
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('userId', userId)
      .eq('productId', productId)
      .single();
    if (data) setExistingReview(data);
  };

  if (existingReview) {
    return (
      <div className="mt-2 p-2 rounded bg-accent-light border border-accent">
        <div className="flex items-center gap-2 mb-1">
          <StarRating value={existingReview.rate} onChange={() => {}} />
          <span className="text-xs text-text-light">{existingReview.created_at && new Date(existingReview.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-text text-sm">{existingReview.comment}</div>
        <div className="text-accent text-xs mt-1">Merci pour votre avis !</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <label className="block text-sm font-medium text-text">Note :</label>
      <StarRating value={rate} onChange={setRate} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Votre avis..."
        className="input w-full"
      />
      <button 
        type="submit" 
        disabled={loading} 
        className="btn-primary"
      >
        Laisser un avis
      </button>
      {success && <div className="text-accent text-sm mt-1">Merci pour votre avis !</div>}
    </form>
  );
} 
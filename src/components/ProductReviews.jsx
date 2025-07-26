import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StarRating from './StarRating';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users:user_id (
            email,
            full_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculer la moyenne des notes
      if (data && data.length > 0) {
        const sum = data.reduce((acc, review) => acc + review.rate, 0);
        setAverageRating(sum / data.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('reviews.login_required'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          userId: user.id,
          productId: productId,
          rate: userRating,
          comment: userComment
        });

      if (error) throw error;

      // Réinitialiser le formulaire
      setUserRating(5);
      setUserComment('');
      
      // Rafraîchir les avis
      await fetchReviews();
      
      toast.success(t('reviews.success'));
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('reviews.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-background-dark rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-background-dark rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const userHasReviewed = reviews.some(review => review.userId === user?.id);

  return (
    <div className="card bg-background">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-text-dark">
          {t('reviews.title')}
        </h2>
        <div className="flex items-center gap-2">
          <StarRating value={averageRating} onChange={() => {}} />
          <span className="text-text-light">
            ({reviews.length} {t('reviews.count')})
          </span>
        </div>
      </div>

      {/* Formulaire d'avis */}
      {user && !userHasReviewed && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-background-light rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-text-dark">{t('reviews.write_review')}</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('reviews.your_rating')}
            </label>
            <StarRating value={userRating} onChange={setUserRating} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('reviews.your_review')}
            </label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="input w-full"
              rows="4"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('reviews.submit')}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-text-light">
          {t('reviews.no_reviews')}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-background-dark pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-primary">
                    {review.users?.full_name?.[0] || review.users?.email?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-text-dark">
                      {review.users?.full_name || t('reviews.anonymous')}
                    </p>
                    <p className="text-sm text-text-light">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rate} onChange={() => {}} />
              </div>
              <p className="text-text-dark mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
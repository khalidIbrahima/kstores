import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProductReviewList = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      // Récupérer les avis
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('productId', productId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Récupérer les emails des utilisateurs
      const userIds = reviewsData.map(review => review.userId);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Combiner les données
      const reviewsWithUsers = reviewsData.map(review => ({
        ...review,
        user: usersData.find(user => user.id === review.userId)
      }));

      setReviews(reviewsWithUsers || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-text-light">
        {t('reviews.no_reviews')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-background-dark pb-6 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-primary">
                {review.user?.email?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium text-text-dark">
                  {review.user?.full_name || t('reviews.anonymous')}
                </p>
                <p className="text-sm text-text-light">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex text-secondary">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rate ? 'fill-current' : ''}`}
                />
              ))}
            </div>
          </div>
          <p className="text-text mt-2">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductReviewList; 
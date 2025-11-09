import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Get the actual scrollable element (main content in admin layout)
  const getScrollableElement = () => {
    // Try to find the main content area in admin layout
    const mainContent = document.querySelector('main');
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
      return mainContent;
    }
    
    // Fallback to document element
    return document.documentElement;
  };

  // Get current scroll position from the correct element
  const getCurrentScrollPosition = () => {
    const scrollableElement = getScrollableElement();
    return scrollableElement.scrollTop || 0;
  };

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    const scrollY = getCurrentScrollPosition();
    const shouldShow = scrollY > 50;
    
    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
    }
  };

  // Set the scroll event listener
  useEffect(() => {
    toggleVisibility();
    
    // Add scroll listener to the correct element
    const scrollableElement = getScrollableElement();
    scrollableElement.addEventListener('scroll', toggleVisibility);
    
    return () => {
      scrollableElement.removeEventListener('scroll', toggleVisibility);
    };
  }, [isVisible]);

  // Comprehensive scroll test function
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== SCROLL BUTTON CLICKED ===');
    
    // Get current scroll position from the correct element
    const scrollableElement = getScrollableElement();
    const currentScroll = getCurrentScrollPosition();
    
    if (currentScroll === 0) {
      console.log('Already at top, no need to scroll');
      return;
    }
    
    
    // Method 1: Scroll the specific element
    try {
      scrollableElement.scrollTop = 0;
    } catch (error) {
      console.error('Method 1 failed:', error);
    }
    
    // Method 2: Use scrollTo on the element
    try {
      scrollableElement.scrollTo(0, 0);
    } catch (error) {
      console.error('Method 2 failed:', error);
    }
    
    // Method 3: Use scrollIntoView
    try {
      scrollableElement.scrollIntoView({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Method 3 failed:', error);
    }
    
    // Method 4: Fallback to window scroll
    try {
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Method 4 failed:', error);
    }
    
    // Check if scroll worked after a delay
    setTimeout(() => {
      const newScroll = getCurrentScrollPosition();
      
      if (newScroll === 0) {
        console.log('Scroll successful!');
      } else {
        console.log('Scroll failed - still at position:', newScroll);
      }
    }, 200);
    
  };

  // Only show when visible
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:shadow-2xl"
      style={{
        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
      }}
    >
      <ChevronUp className="h-6 w-6" />
    </div>
  );
};

export default ScrollToTop; 
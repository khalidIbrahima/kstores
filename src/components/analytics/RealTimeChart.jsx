import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getCurrentActiveVisitors, getActiveVisitorsHistory, getCurrentActiveOrders, getActiveOrdersHistory } from '../../services/analyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RealTimeChart = ({ 
  title = 'Visiteurs en temps réel', 
  data, 
  height = '300px', 
  updateInterval = 30000, // 30 seconds for real data
  showVisitors = true,
  showOrders = false 
}) => {
  // Default data if none provided
  const getDefaultColor = () => {
    if (showVisitors) return { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' };
    if (showOrders) return { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' };
    return { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' };
  };

  const getDefaultLabel = () => {
    if (showVisitors) return 'Visiteurs actifs';
    if (showOrders) return 'Commandes récentes';
    return 'Activité';
  };

  const defaultData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (11 - i));
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [{
      label: getDefaultLabel(),
      data: Array.from({ length: 12 }, () => 0),
      borderColor: getDefaultColor().border,
      backgroundColor: getDefaultColor().bg,
      tension: 0.4,
      fill: true
    }]
  };

  const [chartData, setChartData] = useState(data || defaultData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentVisitors, setCurrentVisitors] = useState(0);
  const [currentOrders, setCurrentOrders] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  // Function to fetch real-time data
  const fetchRealTimeData = async () => {
    if (!showVisitors && !showOrders) return;
    
    try {
      setIsUpdating(true);
      
      if (data) {
        // If external data is provided, use it
        setChartData(data);
      } else if (showVisitors) {
        // Fetch real-time visitor data
        const [currentCount, history] = await Promise.all([
          getCurrentActiveVisitors(),
          getActiveVisitorsHistory(12, 5) // 12 points, 5 minute intervals
        ]);
        
        setCurrentVisitors(currentCount);
        
        const newData = {
          labels: history.map(point => point.time),
          datasets: [{
            label: 'Visiteurs actifs',
            data: history.map(point => point.visitors),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
        
        setChartData(newData);
      } else if (showOrders) {
        // Fetch real-time orders data
        const [currentCount, history] = await Promise.all([
          getCurrentActiveOrders(60), // 60 minutes window for orders
          getActiveOrdersHistory(12, 5) // 12 points, 5 minute intervals
        ]);
        
        setCurrentOrders(currentCount);
        
        const newData = {
          labels: history.map(point => point.time),
          datasets: [{
            label: 'Commandes récentes',
            data: history.map(point => point.orders),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
        
        setChartData(newData);
      }
      
      setTimeout(() => setIsUpdating(false), 500);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsUpdating(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRealTimeData();
  }, [showVisitors, showOrders]);

  // Set up interval for real-time updates
  useEffect(() => {
    if (showVisitors || showOrders) {
      intervalRef.current = setInterval(fetchRealTimeData, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, showVisitors, showOrders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          title: (context) => `Temps: ${context[0].label}`,
          label: (context) => {
            const value = Math.round(context.parsed.y);
            if (showVisitors) {
              return `${context.dataset.label}: ${value} visiteur${value > 1 ? 's' : ''}`;
            } else if (showOrders) {
              return `${context.dataset.label}: ${value} commande${value > 1 ? 's' : ''}`;
            } else {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderDash: [5, 5],
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        hoverBorderWidth: 2,
        hoverBorderColor: 'white',
      },
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: true,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-xl bg-white p-6 shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Header avec indicateur en temps réel */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <AnimatePresence>
            {isUpdating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-1"
              >
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">En direct</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span className="text-xs text-gray-500">Temps réel</span>
        </div>
      </div>

      {/* Graphique */}
      <div style={{ height }} className="relative">
        <Line data={chartData} options={options} />
        
        {/* Overlay pour les animations */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Statistiques en bas */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {showVisitors ? 'En ligne maintenant' : showOrders ? 'Dernière heure' : 'Actuel'}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {showVisitors 
              ? (currentVisitors || Math.round(chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1] || 0))
              : showOrders
              ? (currentOrders || Math.round(chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1] || 0))
              : (chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1]?.toFixed(1) || '0')
            }
            {(showVisitors || showOrders) && (
              <span className="text-xs text-gray-500 ml-1">
                {showVisitors 
                  ? `visiteur${((currentVisitors || 0) > 1) ? 's' : ''}`
                  : `commande${((currentOrders || 0) > 1) ? 's' : ''}`
                }
              </span>
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {showVisitors ? 'Moyenne/heure' : showOrders ? 'Moyenne/période' : 'Moyenne'}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {(showVisitors || showOrders)
              ? Math.round(chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) / chartData.datasets[0]?.data.length || 0)
              : (chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) / chartData.datasets[0]?.data.length || 0).toFixed(1)
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {showVisitors ? 'Pic aujourd\'hui' : showOrders ? 'Pic période' : 'Max'}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {(showVisitors || showOrders)
              ? Math.round(Math.max(...(chartData.datasets[0]?.data || [0])))
              : Math.max(...(chartData.datasets[0]?.data || [0])).toFixed(1)
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RealTimeChart; 
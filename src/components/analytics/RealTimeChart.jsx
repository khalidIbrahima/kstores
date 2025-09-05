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
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  getCurrentActiveVisitors, 
  getActiveVisitorsHistory, 
  getCurrentActiveOrders, 
  getActiveOrdersHistory,
  getDetailedVisitorStats,
  getDetailedOrderStats
} from '../../services/analyticsService';
import { 
  Eye, 
  Users, 
  ShoppingCart, 
  Calendar, 
  TrendingUp, 
  Clock, 
  X, 
  Filter,
  BarChart3,
  Activity
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

const RealTimeChart = ({ 
  title = 'Visiteurs en temps réel', 
  data, 
  height = '300px', 
  updateInterval = 30000, // 30 seconds for real data
  showVisitors = true,
  showOrders = false 
}) => {
  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailedStats, setDetailedStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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

  // Function to fetch detailed stats for modal
  const fetchDetailedStats = async (period) => {
    setIsLoadingDetails(true);
    try {
      let stats;
      if (showVisitors) {
        stats = await getDetailedVisitorStats(period);
      } else if (showOrders) {
        stats = await getDetailedOrderStats(period);
      }
      setDetailedStats(stats);
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle modal open
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    await fetchDetailedStats(selectedPeriod);
  };

  // Handle period change
  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    if (isModalOpen) {
      await fetchDetailedStats(period);
    }
  };

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
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
        onClick={handleOpenModal}
      >
      {/* Header avec indicateur en temps réel */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <BarChart3 className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
        </div>
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
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">En direct</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Temps réel</span>
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {showVisitors ? 'En ligne maintenant' : showOrders ? 'Dernière heure' : 'Actuel'}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {showVisitors 
              ? (currentVisitors || Math.round(chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1] || 0))
              : showOrders
              ? (currentOrders || Math.round(chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1] || 0))
              : (chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1]?.toFixed(1) || '0')
            }
            {(showVisitors || showOrders) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {showVisitors 
                  ? `visiteur${((currentVisitors || 0) > 1) ? 's' : ''}`
                  : `commande${((currentOrders || 0) > 1) ? 's' : ''}`
                }
              </span>
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {showVisitors ? 'Moyenne/heure' : showOrders ? 'Moyenne/période' : 'Moyenne'}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(showVisitors || showOrders)
              ? Math.round(chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) / chartData.datasets[0]?.data.length || 0)
              : (chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) / chartData.datasets[0]?.data.length || 0).toFixed(1)
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {showVisitors ? 'Pic aujourd\'hui' : showOrders ? 'Pic période' : 'Max'}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(showVisitors || showOrders)
              ? Math.round(Math.max(...(chartData.datasets[0]?.data || [0])))
              : Math.max(...(chartData.datasets[0]?.data || [0])).toFixed(1)
            }
          </p>
        </div>
      </div>

      {/* Indicateur de clic */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Toucher pour détails
        </div>
      </div>
    </motion.div>

    {/* Modal avec détails */}
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-1 sm:p-4 pt-2 sm:pt-8 pb-2 sm:pb-8 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-4xl w-full min-h-0 mx-1 sm:mx-0 mb-4 sm:mb-8"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 1rem)' }}
          >
            <div className="max-h-full overflow-y-auto pb-4">
              {/* Header du modal */}
              <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {showVisitors ? <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" /> : <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 flex-shrink-0" />}
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {showVisitors ? 'Analyse Visiteurs' : 'Analyse Commandes'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 -m-2 flex-shrink-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Filtres de période */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Période :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['day', 'week', 'month'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      selectedPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {period === 'day' ? 'Aujourd\'hui' : period === 'week' ? 'Cette semaine' : 'Ce mois'}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              </div>
            ) : detailedStats ? (
              <div className="space-y-3 sm:space-y-6">
                {/* Métriques globales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2">
                      {showVisitors ? <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" /> : <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                      <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        {showVisitors ? 'Visiteurs Uniques' : 'Total Commandes'}
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {showVisitors ? detailedStats.totalVisitors : detailedStats.totalOrders}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                        {showVisitors ? 'Pages Vues' : 'Revenus'}
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {showVisitors 
                        ? detailedStats.totalPageViews 
                        : `${detailedStats.totalRevenue?.toFixed(2) || '0'} FCFA`
                      }
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                        Pic {selectedPeriod === 'day' ? 'Horaire' : 'Quotidien'}
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {detailedStats.summary?.peakVisits || detailedStats.summary?.peakOrders || 0}
                    </p>
                    {detailedStats.summary?.peakTime && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        à {detailedStats.summary.peakTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Graphique détaillé */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-6 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                    {showVisitors ? 'Évolution des Visites' : 'Évolution des Commandes'} 
                    <span className="block sm:inline"> ({selectedPeriod === 'day' ? 'par heure' : 'par jour'})</span>
                  </h3>
                  <div className="h-40 sm:h-48 md:h-64">
                    {detailedStats.chartData.length > 0 ? (
                      <Bar
                        data={{
                          labels: detailedStats.chartData.map(d => d.time),
                          datasets: [{
                            label: showVisitors ? 'Visites' : 'Commandes',
                            data: detailedStats.chartData.map(d => showVisitors ? d.visits : d.orders),
                            backgroundColor: showVisitors ? 'rgba(34, 197, 94, 0.7)' : 'rgba(245, 158, 11, 0.7)',
                            borderColor: showVisitors ? 'rgb(34, 197, 94)' : 'rgb(245, 158, 11)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true,
                              ticks: { 
                                font: { size: 10 },
                                maxTicksLimit: 5
                              }
                            },
                            x: {
                              ticks: { 
                                font: { size: 10 },
                                maxRotation: 45,
                                maxTicksLimit: window.innerWidth < 640 ? 6 : 12
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm sm:text-base text-center px-4">
                        Aucune donnée disponible pour cette période
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Résumé</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          {showVisitors ? 'Moyenne par ' + (selectedPeriod === 'day' ? 'heure' : 'jour') : 'Commandes moyennes'}:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {detailedStats.summary?.averageVisitsPerPeriod || detailedStats.summary?.averageOrdersPerPeriod || 0}
                        </span>
                      </div>
                      {!showVisitors && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Valeur moyenne:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            {detailedStats.summary?.averageOrderValue?.toFixed(2) || '0'} FCFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showOrders && detailedStats.statusStats && (
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Par Statut</h4>
                      <div className="space-y-2 sm:space-y-3">
                        {Object.entries(detailedStats.statusStats).map(([status, count]) => (
                          <div key={status} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 capitalize">{status}:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Erreur lors du chargement des données
              </div>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default RealTimeChart; 
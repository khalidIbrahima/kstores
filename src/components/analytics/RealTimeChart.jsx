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
  title = 'Activité en temps réel', 
  data, 
  height = '300px', 
  updateInterval = 5000 
}) => {
  // Default data if none provided
  const defaultData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (11 - i));
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [{
      label: 'Activité',
      data: Array.from({ length: 12 }, () => Math.random() * 100 + 50),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const [chartData, setChartData] = useState(data || defaultData);
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setChartData(data || defaultData);
  }, [data]);

  useEffect(() => {
    // Simuler des mises à jour en temps réel
    intervalRef.current = setInterval(() => {
      setIsUpdating(true);
      
      // Ajouter un nouveau point de données
      const currentData = chartData || defaultData;
      const newData = {
        ...currentData,
        labels: [...currentData.labels.slice(-11), new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })],
        datasets: currentData.datasets.map(dataset => ({
          ...dataset,
          data: [...dataset.data.slice(-11), Math.random() * 100 + 50]
        }))
      };
      
      setChartData(newData);
      
      setTimeout(() => setIsUpdating(false), 500);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chartData, updateInterval, defaultData]);

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
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`
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
          <p className="text-xs text-gray-500">Actuel</p>
          <p className="text-lg font-semibold text-gray-900">
            {chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1]?.toFixed(1) || '0'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Moyenne</p>
          <p className="text-lg font-semibold text-gray-900">
            {(chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) / chartData.datasets[0]?.data.length || 0).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Max</p>
          <p className="text-lg font-semibold text-gray-900">
            {Math.max(...(chartData.datasets[0]?.data || [0])).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RealTimeChart; 
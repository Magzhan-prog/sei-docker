import React, { useState, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import domtoimage from "dom-to-image";
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Button, 
  Paper, 
  Menu,
  Box 
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Вспомогательная функция для получения цвета из палитры
const getColor = (index) => {
  const colors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
  ];
  return colors[index % colors.length];
};

// Функция для форматирования чисел
const formatNumber = (value, format) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  switch (format) {
    case "thousands":
      return (num / 1000).toFixed(2) + " тыс.";
    case "millions":
      return (num / 1000000).toFixed(2) + " млн.";
    default:
      return num;
  }
};

const LineChart = ({ data, primary_data }) => {
  // Если данных нет или массив пуст, возвращаем сообщение
  if (!data || data.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }
  
  // Если данные переданы в виде строки, парсим их
  data = typeof data === "string" ? JSON.parse(data) : data;
  primary_data = typeof primary_data === "string" ? JSON.parse(primary_data) : primary_data;
  
  // Получаем все ключи из первого объекта, которые содержат год (например, "2017 г.")
  const sampleObj = data[0];
  let years = Object.keys(sampleObj).filter((key) =>
    /(\d{4})\s*г(?:од)?\.?/i.test(key)
  );
  
  // Сортируем ключи по возрастанию года
  years.sort((a, b) => {
    const matchA = a.match(/(\d{4})/);
    const matchB = b.match(/(\d{4})/);
    const yearA = matchA ? parseInt(matchA[1], 10) : 0;
    const yearB = matchB ? parseInt(matchB[1], 10) : 0;
    return yearA - yearB;
  });
  
  // Состояние для выбора количества отображаемых столбцов ("7", "10" или "all")
  const [visibleCount, setVisibleCount] = useState("7");
  // Состояние для выбора формата чисел: "none", "thousands", "millions"
  const [numberFormat, setNumberFormat] = useState("none");
  
  // Определяем видимые годы: если выбрано "all" – показываем все, иначе последние N ключей
  const visibleYears = visibleCount === "all" ? years : years.slice(-parseInt(visibleCount, 10));
  
  // Формируем datasets для каждого объекта
  const datasets = data.map((item, index) => {
    const seriesData = visibleYears.map((year) => parseFloat(item[year]));
    return {
      label: item.text || `Серия ${index + 1}`,
      data: seriesData,
      borderColor: getColor(index),
      backgroundColor: getColor(index),
      fill: false,
    };
  });
  
  // Объект с данными для графика
  const chartData = {
    labels: visibleYears,
    datasets: datasets,
  };
  
  // Опции графика, зависящие от формата чисел
  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: primary_data.name },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || "";
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return datasetLabel + ": " + formatNumber(value, numberFormat);
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: (value) => formatNumber(value, numberFormat)
        }
      },
    },
  }), [numberFormat, primary_data.name]);
  
  // Ref для контейнера графика (для экспорта изображения)
  const chartContainerRef = useRef(null);
  
  // Обработчики изменения значений селектов
  const handleVisibleCountChange = (event) => {
    setVisibleCount(event.target.value);
  };
  
  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
  };
  
  // Состояние и обработчики для выпадающего меню скачивания
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const openDownloadMenu = Boolean(downloadAnchorEl);
  
  const handleDownloadButtonClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };
  
  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };
  
  const handleDownloadMenuItemClick = (format) => {
    if (!chartContainerRef.current) return;
    let promise;
    if (format === "png") {
      promise = domtoimage.toPng(chartContainerRef.current);
    } else if (format === "jpg") {
      promise = domtoimage.toJpeg(chartContainerRef.current, { quality: 0.95 });
    } else if (format === "svg") {
      promise = domtoimage.toSvg(chartContainerRef.current);
    }
    promise
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `chart.${format}`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Ошибка при экспорте графика:", error);
      });
    handleDownloadMenuClose();
  };
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Верхняя часть: график */}
      <Paper ref={chartContainerRef} sx={{ p: 2, mb: 2 }}>
        <Line data={chartData} options={options} />
      </Paper>
      
      {/* Нижняя панель: слева единица измерения, справа панель управления */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch' }}>
        <Typography variant="subtitle1">
          Единица измерения: <i>{primary_data.measureName}</i>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 80,
          }}
        >
          {/* Первая строка: выбор количества столбцов и формата чисел */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="visible-count-label">Столбцов</InputLabel>
              <Select
                labelId="visible-count-label"
                id="visible-count-select"
                value={visibleCount}
                onChange={handleVisibleCountChange}
                label="Столбцов"
              >
                <MenuItem value="7">7</MenuItem>
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="all">Все</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="number-format-label">Формат чисел</InputLabel>
              <Select
                labelId="number-format-label"
                id="number-format-select"
                value={numberFormat}
                onChange={handleNumberFormatChange}
                label="Формат чисел"
              >
                <MenuItem value="none">Без изменения</MenuItem>
                <MenuItem value="thousands">Тысячи</MenuItem>
                <MenuItem value="millions">Миллионы</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Вторая строка: кнопка скачивания, выровненная по правому краю */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleDownloadButtonClick}>
              Скачать изображение
            </Button>
            <Menu
              anchorEl={downloadAnchorEl}
              open={openDownloadMenu}
              onClose={handleDownloadMenuClose}
            >
              <MenuItem onClick={() => handleDownloadMenuItemClick("png")}>PNG</MenuItem>
              <MenuItem onClick={() => handleDownloadMenuItemClick("jpg")}>JPG</MenuItem>
              <MenuItem onClick={() => handleDownloadMenuItemClick("svg")}>SVG</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LineChart;

import React, { useState, useMemo, useRef } from "react";
import { Bar } from "react-chartjs-2";
import domtoimage from "dom-to-image";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Menu,
  Box,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Регистрируем необходимые элементы для построения столбчатого графика и плагин для отображения значений над столбцами
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Вспомогательная функция для выбора цвета из палитры
const getColor = (index) => {
  const colors = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
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

const BarChart = ({ data, primary_data }) => {
  // Если данные переданы как строка, преобразуем их
  data = typeof data === "string" ? JSON.parse(data) : data;
  primary_data =
    typeof primary_data === "string" ? JSON.parse(primary_data) : primary_data;

  // Если данных нет или массив пуст, возвращаем сообщение
  if (!data || data.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  // Состояния для выбора количества отображаемых столбцов и формата чисел
  const [visibleCount, setVisibleCount] = useState("7");
  const [numberFormat, setNumberFormat] = useState("none");

  // Получаем ключи из первого объекта (ищем строки с годами)
  const sampleObj = data[0];
  let keys = Object.keys(sampleObj).filter((key) =>
    /\d{4}\s*(?:г(?:\.|од)?)?(?:\s*\(.*\))?$/i.test(key)
  );

  // Сортируем ключи по возрастанию года
  keys.sort((a, b) => {
    const matchA = a.match(/(\d{4})/);
    const matchB = b.match(/(\d{4})/);
    const yearA = matchA ? parseInt(matchA[1], 10) : 0;
    const yearB = matchB ? parseInt(matchB[1], 10) : 0;
    return yearA - yearB;
  });

  // Вычисляем видимые ключи: если выбрано "all" – показываем все, иначе последние N ключей
  const visibleKeys =
    visibleCount === "all" ? keys : keys.slice(-parseInt(visibleCount, 10));
  const labels = visibleKeys;

  // Формируем наборы данных для каждого объекта
  const datasets = data.map((item, index) => {
    const seriesData = visibleKeys.map((key) => parseFloat(item[key]));
    return {
      label: item.text || `Серия ${index + 1}`,
      data: seriesData,
      backgroundColor: getColor(index),
      borderColor: getColor(index),
      borderWidth: 1,
    };
  });

  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  // Опции графика с интегрированным заголовком оси Y (единица измерения),
  // числовые подписи по оси Y отключены (ticks.display: false),
  // а значения над столбцами форматируются через плагин ChartDataLabels
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        title: { 
          display: true, 
          text: primary_data.name,
          font: { family: "Roboto, sans-serif", size: 18, weight: "bold" },
          color: "#333", 
          padding: { bottom: 20, top: 10 },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const datasetLabel = context.dataset.label || "";
              const value =
                context.parsed.y !== undefined
                  ? context.parsed.y
                  : context.parsed;
              return datasetLabel + ": " + formatNumber(value, numberFormat);
            },
          },
        },
        datalabels: {
          display: true,
          anchor: "end",
          align: "top",
          formatter: (value) => formatNumber(value, numberFormat),
          font: { size: 12, family: "Roboto, sans-serif" },
          color: "#555",
        },
      },
      scales: {
        x: {
          grid: { display: false }, // Отключаем сетку по оси X
          ticks: {
            font: { family: "Roboto, sans-serif", size: 14 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { display: false }, // Отключаем сетку по оси Y
          ticks: { display: false }, // Отключаем подписи оси Y
          title: {
            display: true,
            text: primary_data.measureName,
            font: { size: 14, family: "Roboto, sans-serif" },
            color: "#555",
            padding: { bottom: 3 }
          },
        },
      },
    }),
    [numberFormat, primary_data.name, primary_data.measureName]
  );

  // Ref для области графика (для экспорта изображения)
  const chartContainerRef = useRef(null);

  // Обработчики изменения селектов
  const handleVisibleCountChange = (event) => {
    setVisibleCount(event.target.value);
  };

  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
  };

  // Управление меню скачивания
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const openDownloadMenu = Boolean(downloadAnchorEl);

  const handleDownloadButtonClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };

  // Функция скачивания изображения в выбранном формате
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
    <Box>
      {/* Панель управления графиком */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "end", mb: 2 }}>
        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: 120, borderRadius: 1, boxShadow: 3 }}
        >
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
        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: 150, borderRadius: 1, boxShadow: 3 }}
        >
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

      {/* График с интегрированным заголовком оси Y и отключёнными числовыми подписями */}
      <Paper
        ref={chartContainerRef}
        sx={{ p: 1, mb: 1, borderRadius: 1, boxShadow: 3, minHeight: 350 }}
      >
        <Bar
          data={chartData}
          options={options}
          key={`${visibleCount}-${numberFormat}`}
        />
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "end", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 1, boxShadow: 3 }}
          onClick={handleDownloadButtonClick}
        >
          Скачать
        </Button>
        <Menu
          anchorEl={downloadAnchorEl}
          open={openDownloadMenu}
          onClose={handleDownloadMenuClose}
        >
          <MenuItem onClick={() => handleDownloadMenuItemClick("png")}>
            PNG
          </MenuItem>
          <MenuItem onClick={() => handleDownloadMenuItemClick("jpg")}>
            JPG
          </MenuItem>
          <MenuItem onClick={() => handleDownloadMenuItemClick("svg")}>
            SVG
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default BarChart;

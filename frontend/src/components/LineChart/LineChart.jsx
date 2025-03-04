import React, { useState, useRef, useMemo } from "react";
import { Line } from "react-chartjs-2";
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Регистрируем необходимые компоненты Chart.js и плагин для отображения данных на графике
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Вспомогательная функция для получения цвета из палитры
const getColor = (index) => {
  const colors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
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
  if (!data || data.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  // Парсим данные, если они переданы строкой
  data = typeof data === "string" ? JSON.parse(data) : data;
  primary_data =
    typeof primary_data === "string" ? JSON.parse(primary_data) : primary_data;

  // Получаем все ключи с годами (например, "2017 г.")
  const sampleObj = data[0];
  let years = Object.keys(sampleObj).filter((key) =>
    /(\d{4})\s*г(?:од)?\.?/i.test(key)
  );

  // Сортируем годы по возрастанию
  years.sort((a, b) => {
    const matchA = a.match(/(\d{4})/);
    const matchB = b.match(/(\d{4})/);
    const yearA = matchA ? parseInt(matchA[1], 10) : 0;
    const yearB = matchB ? parseInt(matchB[1], 10) : 0;
    return yearA - yearB;
  });

  // Состояния для выбора количества столбцов и формата чисел (формат применяется к tooltip и data labels)
  const [visibleCount, setVisibleCount] = useState("7");
  const [numberFormat, setNumberFormat] = useState("none");

  // Определяем видимые года: либо все, либо последние N
  const visibleYears =
    visibleCount === "all" ? years : years.slice(-parseInt(visibleCount, 10));

  // Формируем datasets для графика
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

  const chartData = {
    labels: visibleYears,
    datasets: datasets,
  };

  // Настройки графика с улучшенным дизайном,
  // единица измерения (primary_data.measureName) интегрирована как заголовок оси Y
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "Roboto, sans-serif", size: 12, color: "#555" },
          },
        },
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
          grid: { display: false },
          ticks: {
            font: { family: "Roboto, sans-serif", size: 12 },
          },
        },
        y: {
          grid: { display: false },
          ticks: { display: false },
          // Добавляем заголовок оси Y с единицей измерения
          title: {
            display: true,
            text: primary_data.measureName,
            font: {
              size: 14,
              family: "Roboto, sans-serif",
            },
            color: "#555",
            padding: { bottom: 20 },
          },
        },
      },
      elements: {
        line: {
          tension: 0.4, // плавные изгибы линий
          borderWidth: 2,
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          backgroundColor: "#fff",
          borderWidth: 2,
        },
      },
    }),
    [numberFormat, primary_data.name, primary_data.measureName]
  );

  const chartContainerRef = useRef(null);

  const handleVisibleCountChange = (event) => {
    setVisibleCount(event.target.value);
  };

  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
  };

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
    <Box>
      {/* Панель управления графиком */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "end",
          alignItems: "stretch",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
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
      </Box>

      {/* График с интегрированным указателем единицы измерения по оси Y */}
      <Paper
        ref={chartContainerRef}
        sx={{ p: 1, mb: 1, borderRadius: 1, boxShadow: 3, minHeight: 350 }}
      >
        <Line data={chartData} options={options} />
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "end", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadButtonClick}
          sx={{ borderRadius: 1, boxShadow: 3 }}
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

export default LineChart;

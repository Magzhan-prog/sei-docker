import React, { useState, useMemo, useEffect, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import domtoimage from "dom-to-image";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Box,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Typography,
  Button,
} from "@mui/material";

// Регистрируем необходимые элементы Chart.js и плагин для подписей
ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

// Вспомогательная функция для выбора цвета из палитры
const getColor = (index) => {
  const colors = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
    "rgba(199, 199, 199, 0.7)",
  ];
  return colors[index % colors.length];
};

const DoughnutChartByYear = ({ data, primary_data }) => {
  // Если данные переданы как строка, преобразуем их в объект
  data = typeof data === "string" ? JSON.parse(data) : data;
  primary_data =
    typeof primary_data === "string" ? JSON.parse(primary_data) : primary_data;

  // Если данных нет или массив пуст, выводим сообщение
  if (!data || data.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  // Вычисляем уникальные доступные года из ключей первого объекта.
  // Регулярное выражение учитывает 4 цифры, затем опциональные пробелы и "г." или "год"
  // и опционально дополнительные данные в скобках (например, "(кв.)") до конца строки.
  const availableYears = useMemo(() => {
    const keys = Object.keys(data[0]);
    const years = keys.reduce((acc, key) => {
      const match = key.match(/(\d{4})\s*(?:г(?:\.|од)?)?(?:\s*\(.*\))?$/i);
      if (match) {
        acc.push(match[1]);
      }
      return acc;
    }, []);
    return [...new Set(years)].sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );
  }, [data]);

  // Состояние для выбранного года (например, "2011")
  const [selectedYear, setSelectedYear] = useState("");

  // Состояние для anchor элемента выпадающего меню скачивания
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const openDownloadMenu = Boolean(downloadAnchorEl);

  // Устанавливаем выбранный год по умолчанию (последний из availableYears), если он ещё не выбран
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Обработчики для выпадающего меню скачивания
  const handleDownloadButtonClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadMenuItemClick = (format) => {
    handleDownloadImage(format);
    handleDownloadMenuClose();
  };

  // Агрегируем для каждого объекта данные, ключи которых соответствуют выбранному году.
  // Обновлённое регулярное выражение учитывает дополнительные данные после года.
  const aggregatedValues = data.map((item) => {
    let sum = 0;
    Object.keys(item).forEach((key) => {
      const regex = new RegExp(`\\b${selectedYear}\\s*г(?:од)?\\.?(?:\\s*\\(.*\\))?$`, "i");
      if (regex.test(key)) {
        const value = parseFloat(item[key]);
        if (!isNaN(value)) {
          sum += value;
        }
      }
    });
    return sum;
  });

  // Формируем данные для графика:
  // - labels: названия регионов (поле text)
  // - datasets: агрегированные значения за выбранный год
  const chartData = {
    labels: data.map((item) => item.text),
    datasets: [
      {
        label: selectedYear,
        data: aggregatedValues,
        backgroundColor: data.map((_, index) => getColor(index)),
        borderColor: data.map((_, index) =>
          getColor(index).replace("0.7", "1")
        ),
        borderWidth: 1,
      },
    ],
  };

  // Опции графика с настройкой подписей через ChartDataLabels
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "right" },
      title: {
        display: true,
        text: `Распределение значений за ${selectedYear}`,
      },
      datalabels: {
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[0];
          const total = dataset.data.reduce((acc, cur) => acc + cur, 0);
          const percentage = total ? ((value / total) * 100).toFixed(2) : 0;
          return `${percentage}%`;
        },
        color: "#fff",
        font: {
          weight: "bold",
          size: 14,
        },
      },
    },
  };

  // Создаем ref для области графика (без кнопок)
  const chartContainerRef = useRef(null);

  // Функция для скачивания графика в выбранном формате (PNG, JPG, SVG)
  const handleDownloadImage = (format) => {
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
  };

  return (
    <Box sx={{ margin: "0 auto" }}>
      <Grid container spacing={2}>
        {/* Левая колонка: область графика */}
        <Grid item xs={12} md={8}>
          <Paper
            ref={chartContainerRef}
            sx={{
              p: 2,
              height: "100%",
              overflow: "visible",
              backgroundColor: "#fff",
            }}
          >
            {selectedYear && <Doughnut data={chartData} options={options} />}
          </Paper>
        </Grid>
        {/* Правая колонка: настройки */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: "#f9f9f9" }}>
            <Typography variant="h5" gutterBottom>
              {primary_data.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Единица измерения: <i>{primary_data.measureName}</i>
            </Typography>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Выберите год:
            </Typography>
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel id="year-select-label">Год</InputLabel>
              <Select
                labelId="year-select-label"
                id="year-select"
                value={selectedYear}
                label="Год"
                onChange={handleYearChange}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Скачать изображение:
            </Typography>
            {/* Объединенная кнопка для скачивания с выпадающим меню */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadButtonClick}
            >
              Скачать изображение
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoughnutChartByYear;

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import domtoimage from "dom-to-image";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Box,
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
    typeof primary_data === "string"
      ? JSON.parse(primary_data)
      : primary_data;

  if (!data || data.length === 0) {
    return <div>Нет данных для отображения графика</div>;
  }

  // Вычисляем уникальные доступные года из ключей первого объекта.
  const availableYears = useMemo(() => {
    const keys = Object.keys(data[0]);
    const years = keys.reduce((acc, key) => {
      const match = key.match(/(\d{4})\s*(?:г(?:\.|од)?)?(?:\s*\(.*\))?$/i);
      if (match) {
        acc.push(match[1]);
      }
      return acc;
    }, []);
    return [...new Set(years)].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [data]);

  // Состояние для выбранного года
  const [selectedYear, setSelectedYear] = useState("");
  // Состояние для выбранного формата чисел: "unchanged", "thousands", "millions", "trillions"
  const [numberFormat, setNumberFormat] = useState("unchanged");

  // Состояние для anchor элемента выпадающего меню скачивания
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const openDownloadMenu = Boolean(downloadAnchorEl);

  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
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

  // Функция форматирования числа в зависимости от выбранного формата
  const formatNumber = (value, format) => {
    if (format === "thousands") {
      return (value / 1000).toFixed(2) + " тыс.";
    } else if (format === "millions") {
      return (value / 1000000).toFixed(2) + " млн";
    } else if (format === "trillions") {
      return (value / 1000000000000).toFixed(2) + " трлн";
    }
    return value;
  };

  // Агрегируем для каждого объекта данные, ключи которых соответствуют выбранному году.
  const aggregatedValues = data.map((item) => {
    let sum = 0;
    Object.keys(item).forEach((key) => {
      const regex = new RegExp(
        `\\b${selectedYear}\\s*г(?:од)?\\.?(?:\\s*\\(.*\\))?$`,
        "i"
      );
      if (regex.test(key)) {
        const value = parseFloat(item[key]);
        if (!isNaN(value)) {
          sum += value;
        }
      }
    });
    return sum;
  });

  // Формируем данные для графика
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

  // Опции графика с настройкой подписей через ChartDataLabels.
  // В форматтере используем выбранный формат чисел.
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: `Распределение значений за ${selectedYear}`,
        padding: 10,
      },
      datalabels: {
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[0];
          const total = dataset.data.reduce((acc, cur) => acc + cur, 0);
          const percentage = total ? ((value / total) * 100).toFixed(2) : 0;
          return `${formatNumber(value, numberFormat)} (${percentage}%)`;
        },
        color: "#000",
        font: {
          size: 12,
        },
        anchor: "top",
        align: "top",
      },
    },
  };

  // Ref для области графика
  const chartContainerRef = useRef(null);

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
    <Box>
      {/* Контейнер для селекторов: сначала год, затем формат чисел */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: 120, borderRadius: 1, boxShadow: 3 }}
        >
          <InputLabel id="year-select-label">Выберите год</InputLabel>
          <Select
            labelId="year-select-label"
            id="year-select"
            value={selectedYear}
            label="Выберите год"
            onChange={handleYearChange}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: 150, ml: 2, borderRadius: 1, boxShadow: 3 }}
        >
          <InputLabel id="number-format-label">Формат чисел</InputLabel>
          <Select
            labelId="number-format-label"
            id="number-format-select"
            value={numberFormat}
            label="Формат чисел"
            onChange={handleNumberFormatChange}
          >
            <MenuItem value="unchanged">Без изменения</MenuItem>
            <MenuItem value="thousands">Тысячи</MenuItem>
            <MenuItem value="millions">Миллионы</MenuItem>
            <MenuItem value="trillions">Триллионы</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper
        ref={chartContainerRef}
        sx={{
          p: 2,
          mb: 1,
          borderRadius: 1,
          boxShadow: 3,
          maxHeight: 500,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h7" sx={{fontWeight:"bold"}}>
          {primary_data.name} ({primary_data.measureName})
        </Typography>
        {selectedYear && (
          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Box sx={{ width: "100%", maxWidth: 500, height: 350 }}>
              <Doughnut data={chartData} options={options} />
            </Box>
          </Box>
        )}
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

export default DoughnutChartByYear;

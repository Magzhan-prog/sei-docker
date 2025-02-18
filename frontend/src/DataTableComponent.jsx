import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
} from "@mui/material";
import * as XLSX from "xlsx";

const DataTableComponent = ({ data, primary_data }) => {
  // Если данные переданы в виде строки, пытаемся их распарсить
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      return <div>Ошибка парсинга данных</div>;
    }
  }

  if (typeof primary_data === "string") {
    try {
      primary_data = JSON.parse(primary_data);
    } catch (error) {
      return <div>Ошибка парсинга данных</div>;
    }
  }

  // Если данных нет или они не являются массивом, выводим сообщение
  if (!Array.isArray(data) || data.length === 0) {
    return <div>Нет данных для отображения</div>;
  }

  // Получаем список всех столбцов из ключей первого объекта,
  // исключая "id" и "leaf"
  const allColumns = Object.keys(data[0]).filter(
    (col) => col !== "id" && col !== "leaf"
  );

  // Отделяем столбец "text" (который будет показан как "Наименование")
  const textColumn = allColumns.find((col) => col === "text");
  let otherColumns = allColumns.filter((col) => col !== "text");

  // Сортируем остальные столбцы по возрастанию года, извлекая 4-значное число
  otherColumns.sort((a, b) => {
    const matchA = a.match(/(\d{4})/);
    const matchB = b.match(/(\d{4})/);
    const yearA = matchA ? parseInt(matchA[1], 10) : 0;
    const yearB = matchB ? parseInt(matchB[1], 10) : 0;
    return yearA - yearB;
  });

  // Состояние для выбора количества отображаемых столбцов (без столбца "text")
  const [visibleCount, setVisibleCount] = useState("7");
  // Состояние для формата отображаемых чисел: "none" (без изменения), "thousands", "millions"
  const [numberFormat, setNumberFormat] = useState("none");

  // Вычисляем видимые столбцы из остальных: если выбрано "all" — показываем все,
  // иначе берем последние N элементов (ближе к актуальной дате)
  const visibleDataColumns =
    visibleCount === "all"
      ? otherColumns
      : otherColumns.slice(-parseInt(visibleCount, 10));

  // Итоговый список столбцов: столбец "text" всегда первым, затем выбранные столбцы данных
  const visibleColumns = textColumn
    ? [textColumn, ...visibleDataColumns]
    : visibleDataColumns;

  // Функция для форматирования числовых значений
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

  // Обработчик изменения количества отображаемых столбцов
  const handleVisibleCountChange = (event) => {
    setVisibleCount(event.target.value);
  };

  // Обработчик изменения формата чисел
  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
  };

  // Функция для скачивания таблицы в Excel формате
  const downloadExcel = () => {
    // Создаем заголовок для файла (если столбец равен "text", заменяем на "Наименование")
    const header = visibleColumns.map((col) =>
      col === "text" ? "Наименование" : col
    );

    // Формируем массив строк из данных – только видимые столбцы.
    // Для числовых значений экспортируем оригинальное число.
    const rows = data.map((row) => {
      const rowObj = {};
      visibleColumns.forEach((col) => {
        rowObj[col === "text" ? "Наименование" : col] = row[col];
      });
      return rowObj;
    });

    // Создаем рабочий лист и книгу
    const worksheet = XLSX.utils.json_to_sheet(rows, { header });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    // Сохраняем книгу как data.xlsx
    XLSX.writeFile(workbook, "data.xlsx");
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Заголовок по центру */}
      <Typography variant="h5" align="center" sx={{ mb: 2 }}>
        {primary_data.name}
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => {
                const headerTitle = col === "text" ? "Наименование" : col;
                return (
                  <TableCell key={col} sx={{ fontWeight: "bold" }}>
                    {headerTitle}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {visibleColumns.map((col) => (
                  <TableCell key={col}>
                    {col === "text"
                      ? row[col]
                      : formatNumber(row[col], numberFormat)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="subtitle1" sx={{mb:2}}>
        Единица измерения: <i>{primary_data.measureName}</i>
      </Typography>

      {/* Панель управления */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {/* Выбор количества столбцов и формата чисел в одной строке */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="column-select-label">Столбцов</InputLabel>
            <Select
              labelId="column-select-label"
              id="column-select"
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
        {/* Кнопка скачивания, выровненная по правому нижнему углу */}
        <Box sx={{ ml: 2 }}>
          <Button variant="contained" onClick={downloadExcel}>
            Скачать в Excel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DataTableComponent;

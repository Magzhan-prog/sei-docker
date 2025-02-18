import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { BACKEND_API } from "./constants/constants";

const DataTable = ({ queryParams, onSelectedRowsChange }) => {
  // Деструктуризация входящих параметров с значениями по умолчанию
  const {
    p_index_id = 18789901,
    p_period_id = 8,
    p_terms = "247783,741917",
    p_term_id = 247783,
    p_dicIds = "67,749",
    idx = 0,
  } = queryParams || {};

  const [data, setData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [numberFormat, setNumberFormat] = useState("default");
  const [selectedRows, setSelectedRows] = useState([]); // выбранные строки

  // При каждом изменении selectedRows вызываем callback и передаём данные родителю
  useEffect(() => {
    if (onSelectedRowsChange) {
      onSelectedRowsChange(selectedRows);
    }
  }, [selectedRows, onSelectedRowsChange]);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);

  // Функция запроса данных (дерево) с использованием axios
  const fetchData = (parentId = null) => {
    const url = `${BACKEND_API}new_get_index_tree_data?p_measure_id=1&p_index_id=${p_index_id}&p_period_id=${p_period_id}&p_terms=${p_terms}&p_term_id=${p_term_id}&p_dicIds=${p_dicIds}&idx=${idx}${
      parentId ? `&p_parent_id=${parentId}` : ""
    }`;

    axios
      .get(url)
      .then((response) => {
        const fetchedData = response.data;
        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
          if (parentId) {
            setData((prevData) =>
              updateChildData(prevData, parentId, fetchedData)
            );
          } else {
            setData(fetchedData);
            extractColumns(fetchedData);
          }
        }
      })
      .catch((error) =>
        console.error("Ошибка при получении данных:", error)
      );
  };

  // Рекурсивное обновление дочерних строк
  const updateChildData = (data, parentId, children) => {
    return data.map((row) => {
      if (row.id === parentId) {
        return { ...row, children };
      } else if (row.children) {
        return {
          ...row,
          children: updateChildData(row.children, parentId, children),
        };
      }
      return row;
    });
  };

  // Извлечение столбцов из данных (например, содержащих "год" или "Январь")
  const extractColumns = (fetchedData) => {
    const extractedColumns = Array.from(
      new Set(
        fetchedData.flatMap((row) =>
          Object.keys(row).filter(
            (key) => key.includes("год") || key.includes("Январь")
          )
        )
      )
    );
    setColumns(extractedColumns);
    setVisibleColumns(extractedColumns.slice(0, 5)); // по умолчанию показываем 5 столбцов
  };

  // Раскрытие строки (если у строки есть дочерние данные)
  const handleRowExpand = (id, leaf) => {
    setExpandedRows((prev) => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(id)) {
        newExpandedRows.delete(id);
      } else {
        newExpandedRows.add(id);
        if (String(leaf) === "false") {
          fetchData(id);
        }
      }
      return newExpandedRows;
    });
  };

  // Переключение выбора строки (чекбокс)
  const toggleRowSelection = (row) => {
    setSelectedRows((prevSelected) => {
      const isSelected = prevSelected.some((r) => r.id === row.id);
      if (isSelected) {
        return prevSelected.filter((r) => r.id !== row.id);
      } else {
        return [...prevSelected, row];
      }
    });
  };

  const isRowSelected = (row) => {
    return selectedRows.some((r) => r.id === row.id);
  };

  // Рендер строк таблицы
  const renderRows = (rows, level = 0) => {
    return rows.map((row) => (
      <React.Fragment key={row.id}>
        <TableRow
          sx={{
            backgroundColor: level === 0 ? "#f9f9f9" : "#ffffff",
            "&:hover": { backgroundColor: "#f1f1f1" },
            transition: "background-color 0.3s ease",
          }}
        >
          <TableCell
            sx={{
              paddingLeft: `${level * 16}px`,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: level === 0 ? "bold" : "normal",
              paddingY: "6px",
            }}
          >
            <Checkbox
              checked={isRowSelected(row)}
              onChange={(e) => {
                e.stopPropagation();
                toggleRowSelection(row);
              }}
            />
            {String(row.leaf) === "false" && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowExpand(row.id, String(row.leaf));
                }}
                sx={{ padding: "6px", fontSize: "18px" }}
              >
                {expandedRows.has(row.id) ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            )}
            {row.text}
          </TableCell>
          {visibleColumns.map((column) => (
            <TableCell
              key={column}
              sx={{ padding: "6px 12px", fontSize: "14px" }}
            >
              {row[column] ? formatNumber(row[column]) : "--"}
            </TableCell>
          ))}
        </TableRow>
        {expandedRows.has(row.id) &&
          row.children &&
          renderRows(row.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Форматирование чисел
  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    const n = parseFloat(num);
    switch (numberFormat) {
      case "thousands":
        return (
          new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
            n / 1_000
          ) + " тыс"
        );
      case "millions":
        return (
          new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
            n / 1_000_000
          ) + " млн"
        );
      default:
        return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(
          n
        );
    }
  };

  // Выбор количества отображаемых столбцов
  const handleColumnSelect = (event) => {
    const selectedValue = event.target.value;
    let newVisibleColumns = [];
    if (selectedValue === "3") {
      newVisibleColumns = columns.slice(-3);
    } else if (selectedValue === "5") {
      newVisibleColumns = columns.slice(0, 5);
    } else if (selectedValue === "7") {
      newVisibleColumns = columns.slice(0, 7);
    } else if (selectedValue === "10") {
      newVisibleColumns = columns.slice(0, 10);
    } else if (selectedValue === "all") {
      newVisibleColumns = columns;
    }
    setVisibleColumns(newVisibleColumns);
  };

  const handleNumberFormatChange = (event) => {
    setNumberFormat(event.target.value);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "end",
          flexWrap: "wrap",
          gap: 2,
          marginBottom: 2,
        }}
      >
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="number-format-label">Формат чисел</InputLabel>
          <Select
            labelId="number-format-label"
            value={numberFormat}
            onChange={handleNumberFormatChange}
            label="Формат чисел"
          >
            <MenuItem value="default">Без изменений</MenuItem>
            <MenuItem value="thousands">Тысячи</MenuItem>
            <MenuItem value="millions">Миллионы</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="column-select-label">
            Выберите количество столбцов
          </InputLabel>
          <Select
            labelId="column-select-label"
            value={
              visibleColumns.length === columns.length
                ? "all"
                : visibleColumns.length
            }
            onChange={handleColumnSelect}
            label="Выберите количество столбцов"
          >
            <MenuItem value="3">3</MenuItem>
            <MenuItem value="5">5</MenuItem>
            <MenuItem value="7">7</MenuItem>
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="all">Все</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "8px",
          maxHeight: "500px",
          boxShadow: 2,
          marginBottom: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", padding: "8px 16px" }}>
                Наименование
              </TableCell>
              {visibleColumns.map((column) => (
                <TableCell
                  key={column}
                  sx={{ fontWeight: "bold", padding: "8px 16px" }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{renderRows(data)}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

DataTable.propTypes = {
  queryParams: PropTypes.shape({
    p_index_id: PropTypes.number,
    p_period_id: PropTypes.number,
    p_terms: PropTypes.string,
    p_term_id: PropTypes.number,
    p_dicIds: PropTypes.string,
    idx: PropTypes.number,
  }),
  onSelectedRowsChange: PropTypes.func, // Callback для передачи выбранных строк
};

export default DataTable;

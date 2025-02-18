import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import LoadingAutocomplete from "./components/LoadingAutocomplete";
import useFetchData from "./hooks/useFetchData";
import { BACKEND_API } from "./constants/constants";
import { Item } from "./components/Item";
import DataTable from "./TestTable";

// Определяем шаги (фильтры) для выбора
const steps = [
  "Показатель",
  "Период",
  "Классификация",
  "Главный классификатор",
  "Выберите данные для гарфика",
  "Тип графика",
];

export default function Dashboard() {
  const [activeStep, setActiveStep] = useState(0);

  const [selectedRows, setSelectedRows] = useState([]);
  // Функция, которая будет вызвана из DataTable при изменении выбранных строк
  const handleSelectedRowsChange = (rows) => {
    setSelectedRows(rows);
  };

  const [chartType, setChartType] = useState('');

  // Обработчик изменения выбора в выпадающем списке
  const handleChange = (event) => {
    setChartType(event.target.value);
    // Здесь можно добавить логику для обновления графика
  };

  const [selectedFilters, setSelectedFilters] = useState({
    indicator: null,
    period: null,
    segment: null,
    mainClassification: null,
  });

  // Состояния для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // "success" или "error"
  });

  // Получаем данные для автодополнения
  const { data: indicators, loading: loadingIndicators } = useFetchData(
    BACKEND_API + "get_indicators",
    []
  );
  const { data: periods, loading: loadingPeriods } = useFetchData(
    selectedFilters.indicator
      ? BACKEND_API + `get_periods?indexId=${selectedFilters.indicator.id}`
      : null,
    [selectedFilters.indicator]
  );
  const { data: segments, loading: loadingSegments } = useFetchData(
    selectedFilters.indicator && selectedFilters.period
      ? BACKEND_API +
          `get_segments?indexId=${selectedFilters.indicator.id}&periodId=${selectedFilters.period.id}`
      : null,
    [selectedFilters.indicator, selectedFilters.period]
  );
  //primary_data
  const { data: indexAttributes, loading: loadingIndexAttributes } =
    useFetchData(
      selectedFilters.indicator && selectedFilters.period
        ? BACKEND_API +
            `get_index_attributes?indexId=${selectedFilters.indicator.id}&periodId=${selectedFilters.period.id}`
        : null,
      [selectedFilters.indicator, selectedFilters.period]
    );

  const mainClassifications = selectedFilters.segment
    ? selectedFilters.segment.mas_names || []
    : [];

  const [loadingResults, setLoadingResults] = useState(false);

  // Функции управления шагами
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFilters({
      indicator: null,
      period: null,
      segment: null,
      mainClassification: null,
    });
    setSelectedRows([]);
    setChartType('');
  };

  // Проверка, выбран ли вариант для текущего шага
  const isStepCompleted = (step) => {
    switch (step) {
      case 0:
        return Boolean(selectedFilters.indicator);
      case 1:
        return Boolean(selectedFilters.period);
      case 2:
        return Boolean(selectedFilters.segment);
      case 3:
        return Boolean(selectedFilters.mainClassification);
      case 4:
        return Boolean(selectedRows.length);
      case 5:
        return Boolean(chartType);
      default:
        return false;
    }
  };

  // Возвращает контент для текущего шага
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <LoadingAutocomplete
            loading={loadingIndicators}
            options={indicators}
            value={selectedFilters.indicator}
            onChange={(e, newValue) =>
              setSelectedFilters({
                indicator: newValue,
                period: null,
                segment: null,
                mainClassification: null,
              })
            }
            label="Показатель"
            placeholder="Введите или выберите показатель..."
            tooltipTitle={
              selectedFilters.indicator
                ? `${selectedFilters.indicator.name} (${selectedFilters.indicator.id})`
                : ""
            }
          />
        );
      case 1:
        return (
          <LoadingAutocomplete
            loading={loadingPeriods}
            options={periods}
            value={selectedFilters.period}
            onChange={(e, newValue) =>
              setSelectedFilters((prev) => ({
                ...prev,
                period: newValue,
                segment: null,
                mainClassification: null,
              }))
            }
            label="Период"
            placeholder="Введите или выберите период..."
            tooltipTitle={
              selectedFilters.period
                ? `${selectedFilters.period.name} (${selectedFilters.period.id})`
                : ""
            }
          />
        );
      case 2:
        return (
          <LoadingAutocomplete
            loading={loadingSegments}
            options={segments}
            value={selectedFilters.segment}
            onChange={(e, newValue) =>
              setSelectedFilters((prev) => ({
                ...prev,
                segment: newValue,
                mainClassification: null,
              }))
            }
            label="Классификация"
            placeholder="Введите или выберите классификацию..."
            tooltipTitle={
              selectedFilters.segment
                ? `${selectedFilters.segment.names} (${selectedFilters.segment.id})`
                : ""
            }
          />
        );
      case 3:
        return (
          <LoadingAutocomplete
            loading={false}
            options={mainClassifications}
            value={selectedFilters.mainClassification}
            onChange={(e, newValue) =>
              setSelectedFilters((prev) => ({
                ...prev,
                mainClassification: newValue
                  ? { ...newValue, id: Number(newValue.id) }
                  : null,
              }))
            }
            label="Главный классификатор"
            placeholder="Введите или выберите главный классификатор..."
            tooltipTitle={
              selectedFilters.mainClassification
                ? `${selectedFilters.mainClassification.name} (${selectedFilters.mainClassification.id})`
                : ""
            }
          />
        );
      case 4:
        return (
          <>
            {selectedFilters.indicator &&
            selectedFilters.period &&
            selectedFilters.segment &&
            selectedFilters.mainClassification ? (
              <DataTable
                queryParams={{
                  p_index_id: selectedFilters.indicator.id,
                  p_period_id: selectedFilters.period.id,
                  p_terms: selectedFilters.segment.termIds,
                  p_term_id: Number(selectedFilters.mainClassification.id), // Преобразование в число
                  p_dicIds: selectedFilters.segment.dicId,
                  idx: selectedFilters.segment.idx,
                }}
                onSelectedRowsChange={handleSelectedRowsChange}
              />
            ) : null}
          </>
        );
      case 5:
        return (
          <Box sx={{ margin: "0 auto", mt: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="chart-type-label">Тип графика</InputLabel>
              <Select
                labelId="chart-type-label"
                id="chart-type-select"
                value={chartType}
                label="Тип графика"
                onChange={handleChange}
              >
                <MenuItem value="line">Линейный график</MenuItem>
                <MenuItem value="bar">Столбчатый график</MenuItem>
                <MenuItem value="pie">Круговой график</MenuItem>
                <MenuItem value="doughnut">Пончиковый график</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      default:
        return "Неизвестный шаг";
    }
  };

  const handleSave = async () => {
    if (
      selectedFilters.indicator &&
      selectedFilters.period &&
      selectedFilters.segment &&
      selectedFilters.mainClassification
    ) {
      const data = {
        p_index_id: selectedFilters.indicator.id,
        p_period_id: selectedFilters.period.id,
        p_terms: selectedFilters.segment.termIds,
        p_term_id: selectedFilters.mainClassification.id,
        p_dicIds: selectedFilters.segment.dicId,
        idx: selectedFilters.segment.idx,
        chart_type: chartType,
        selected_data: JSON.stringify(selectedRows),
        primary_data: JSON.stringify(indexAttributes),
      };

      setLoadingResults(true);
      try {
        const response = await fetch(BACKEND_API + "save-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }
        const result = await response.json();
        console.log("Ответ сервера:", result);
        setSnackbar({
          open: true,
          message: "Все ок! Данные успешно сохранены",
          severity: "success",
        });
        handleReset();
      } catch (error) {
        console.error("Ошибка при сохранении данных:", error);
        setSnackbar({
          open: true,
          message: "Что-то пошло не так! Попробуйте еще раз.",
          severity: "error",
        });
      } finally {
        setLoadingResults(false);
      }
    } else {
      return false;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2, maxWidth: 1000, margin: "0 auto" }}>
      <Item sx={{ marginBottom: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Критерии для анализа
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Горизонтальный Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepCompleted(index)}>
              <StepLabel
                optional={
                  isStepCompleted(index) ? (
                    <Typography variant="caption" color="primary">
                      {(() => {
                        switch (index) {
                          case 0:
                            return selectedFilters.indicator
                              ? selectedFilters.indicator.name
                              : "";
                          case 1:
                            return selectedFilters.period
                              ? selectedFilters.period.name
                              : "";
                          case 2:
                            return selectedFilters.segment
                              ? selectedFilters.segment.names
                              : "";
                          case 3:
                            return selectedFilters.mainClassification
                              ? selectedFilters.mainClassification.name
                              : "";
                          case 4:
                            return selectedRows.length
                              ? `Количество выбранных строк: ${selectedRows.length}`
                              : "";
                          case 5:
                            return chartType? chartType:"";
                          default:
                            return "";
                        }
                      })()}
                    </Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Контент для текущего шага */}
        <Box sx={{ mt: 4, mb: 2 }}>
          {activeStep < steps.length ? (
            <>
              {getStepContent(activeStep)}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Назад
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepCompleted(activeStep)}
                >
                  Далее
                </Button>
              </Box>
            </>
          ) : (
            // Если все шаги пройдены, выводим финальное окно
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                Все критерии выбраны!
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Button onClick={handleReset} variant="outlined">
                  Сбросить выбор
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={
                    !selectedFilters.indicator ||
                    !selectedFilters.period ||
                    !selectedFilters.segment ||
                    !selectedFilters.mainClassification
                  }
                >
                  {loadingResults ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Сохранить данные"
                  )}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Item>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import PropTypes from "prop-types";
import GetIndexAttributes from "./GetIndexAttributes";
import ChartRenderer from "./ChartRenderer";
import DataTableComponent from "./DataTableComponent";

// Компонент для работы с вкладками (Tabs)
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const DataTable = ({ queryParams }) => {
  const {
    chart_type = "",
    selected_data = "",
    primary_data = "",
  } = queryParams || {};

  // По умолчанию показываем вкладку с графиками (индекс 1)
  const [value, setValue] = useState(1);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Таблица" {...a11yProps(0)} />
          <Tab label="График" {...a11yProps(1)} />
          <Tab label="Паспорт показателя" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <DataTableComponent data={selected_data} primary_data={primary_data} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <ChartRenderer
          chart_type={chart_type}
          data={selected_data}
          primary_data={primary_data}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <GetIndexAttributes indexAttributes={primary_data} />
      </CustomTabPanel>
    </Box>
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
    chart_type: PropTypes.string,
    selected_data: PropTypes.string,
    primary_data: PropTypes.string,
  }),
};

export default DataTable;

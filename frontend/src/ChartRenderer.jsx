import React from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChartByYear from './PieChartByYear';
import DoughnutChartByYear from './DoughnutChartByYear';

const ChartRenderer = ({ chart_type, data, primary_data }) => {
  switch (chart_type) {
    case 'line':
      return <LineChart data={data} primary_data={primary_data} />;
    case 'bar':
      return <BarChart data={data} primary_data={primary_data} />;
    case 'pie':
      return <PieChartByYear data={data} primary_data={primary_data} />;
    case 'doughnut':
      return <DoughnutChartByYear data={data} primary_data={primary_data} />;
    default:
      return <div>Пожалуйста, выберите тип графика</div>;
  }
};

export default ChartRenderer;

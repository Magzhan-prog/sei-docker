import { CircularProgress, Tooltip } from "@mui/material";
import CustomAutocomplete from "./CustomAutocomplete";

const LoadingAutocomplete = ({
  loading,
  options,
  value,
  onChange,
  label,
  placeholder,
  tooltipTitle,
}) => {
  return loading ? (
    <CircularProgress size={50} sx={{ display: "block", mx: "auto", my: 2 }} />
  ) : (
    <Tooltip title={tooltipTitle || ""} arrow>
      <CustomAutocomplete
        options={options}
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
      />
    </Tooltip>
  );
};

export default LoadingAutocomplete;

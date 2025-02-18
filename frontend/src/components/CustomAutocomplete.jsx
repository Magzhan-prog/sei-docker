import React, { forwardRef } from "react";
import { Autocomplete, TextField } from "@mui/material";

const CustomAutocomplete = forwardRef(({
  options,
  value,
  onChange,
  label,
  placeholder,
  loading,
  noOptionsText = "Нет совпадений",
  getOptionLabel = (option) => (option?.name ? option.name : ""),
  isOptionEqualToValue = (option, value) => option.id === value?.id,
  ...props
}, ref) => (
    <Autocomplete
      sx={{ mb: 1, minWidth: 200 }} // Уменьшил отступы и ширину
      {...props}
      ref={ref}
      options={options}
      getOptionLabel={getOptionLabel}
      value={value || null}
      onChange={onChange}
      isOptionEqualToValue={isOptionEqualToValue}
      noOptionsText={noOptionsText}
      size="small" // Добавлен компактный размер
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          fullWidth
          size="small" // Уменьшен размер
          sx={{ fontSize: 14 }} // Сделал текст меньше
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id} style={{ fontSize: 14, padding: "4px 8px" }}>
          {option.name}
        </li>
      )}
    />
));

export default CustomAutocomplete;

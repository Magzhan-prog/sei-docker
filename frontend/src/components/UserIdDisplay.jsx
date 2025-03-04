import React, { useState } from "react";
import { Button, Typography, Box } from "@mui/material";

// Функция для получения значения cookie по имени
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Компонент для отображения текущего user_id из cookies
const UserIdDisplay = () => {
  const [userId, setUserId] = useState(getCookie("user_id") || "Не задан");

  const handleRefresh = () => {
    const currentUserId = getCookie("user_id") || "Не задан";
    setUserId(currentUserId);
  };

  return (
    <Box
      sx={{
        border: "1px solid #ccc",
        borderRadius: 2,
        p: 2,
        m: 2,
        textAlign: "center",
        maxWidth: 500,
        margin: "0 auto"
      }}
    >
      <Typography variant="h6" gutterBottom>
        User ID Display
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Текущий user_id: <strong>{userId}</strong>
      </Typography>
      <Button variant="outlined" onClick={handleRefresh}>
        Обновить
      </Button>
    </Box>
  );
};


export default UserIdDisplay;

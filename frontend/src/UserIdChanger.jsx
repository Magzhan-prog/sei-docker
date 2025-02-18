import React from "react";
import { Button, Typography, Box } from "@mui/material";

// Функция для установки cookie
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Компонент для случайной смены user_id
const UserIdChanger = () => {
  const handleChangeUserId = () => {
    // Выбираем случайное число от 1 до 3
    const randomUserId = Math.floor(Math.random() * 3) + 1;
    setCookie("user_id", randomUserId, 7); // сохраняем на 7 дней
    alert(`User ID изменен на ${randomUserId}`);
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
        User ID Changer
      </Typography>
      <Button variant="contained" color="primary" onClick={handleChangeUserId}>
        Сменить user_id (1-3) случайным образом
      </Button>
    </Box>
  );
};

export default UserIdChanger;

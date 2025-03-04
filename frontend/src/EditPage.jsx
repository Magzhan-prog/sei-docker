import React, { useEffect, useState } from "react";
import { Container } from "@mui/material";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import { BACKEND_API } from "./constants/constants";

const EditPage = ({ folders, setFolders }) => {
  const [loading, setLoading] = useState(true);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Получение списка папок с backend
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch(`${BACKEND_API}get-user-folders`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Ошибка при получении папок");
        }
        const data = await response.json();
        setFolders(data);
      } catch (error) {
        console.error("Ошибка загрузки папок:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [setFolders]);
  
  // Функция для обновления названия папки
  const handleEditFolder = async (id, newName) => {
    try {
      const response = await fetch(`${BACKEND_API}update-folder/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Ошибка обновления папки");
      }

      setFolders(
        folders.map((folder) =>
          folder.id === id ? { ...folder, name: newName } : folder
        )
      );
      setEditingFolder(null);
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      alert("Ошибка при обновлении папки");
    }
  };

  // Функция для удаления папки с проверкой наличия данных
  const handleDeleteFolder = async (id) => {
    try {
      const response = await fetch(`${BACKEND_API}delete-folder/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail && errorData.detail.includes("связана с данными пользователя")) {
          alert("Папку невозможно удалить, так как в ней есть данные.");
        } else {
          alert("Ошибка удаления папки.");
        }
        return;
      }

      setFolders(folders.filter((folder) => folder.id !== id));
    } catch (error) {
      console.error("Ошибка при удалении папки:", error);
      alert("Ошибка при удалении папки: " + error.message);
    }
  };

  // Функция для добавления новой папки
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(`${BACKEND_API}save-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newFolderName }),
      });

      if (!response.ok) {
        throw new Error("Ошибка добавления папки");
      }

      const newFolder = await response.json();
      // Обновляем состояние в App
      setFolders((prevFolders) => [...prevFolders, newFolder]);
      setNewFolderName("");
    } catch (error) {
      console.error("Ошибка при добавлении папки:", error);
      alert("Ошибка при добавлении папки");
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container>
      <h2>Редактор папок</h2>
      <Box sx={{ display: "flex", mb: 2 }}>
        <TextField
          label="Новая папка"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          fullWidth
        />
        <IconButton onClick={handleAddFolder} color="primary">
          <AddIcon />
        </IconButton>
      </Box>

      <List>
        {folders.map((folder) => (
          <ListItem
            key={folder.id}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            {editingFolder === folder.id ? (
              <TextField
                value={folder.name}
                onChange={(e) =>
                  setFolders(
                    folders.map((f) =>
                      f.id === folder.id ? { ...f, name: e.target.value } : f
                    )
                  )
                }
                fullWidth
              />
            ) : (
              <ListItemText primary={folder.name} />
            )}

            <Box>
              {editingFolder === folder.id ? (
                <IconButton
                  onClick={() => handleEditFolder(folder.id, folder.name)}
                  color="success"
                >
                  <SaveIcon />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => setEditingFolder(folder.id)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              )}

              <IconButton
                onClick={() => handleDeleteFolder(folder.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default EditPage;

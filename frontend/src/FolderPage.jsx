import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Box,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { BACKEND_API } from "./constants/constants";
import DataTable from "./TestDrilldownChart";

const FolderPage = ({ folders, loading }) => {
  const { folderId } = useParams();

  if (loading) {
    return <Typography>Загрузка...</Typography>;
  }

  const folder = folders.find((f) => String(f.id) === folderId);

  if (!folder) {
    return <Typography>Папка не найдена</Typography>;
  }

  const [data, setData] = useState([]);
  const [loadingf, setLoadingf] = useState(true);

  // Состояния для модального окна
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Хук для адаптивности
  const isBetween1440And2160 = useMediaQuery("(min-width:1440px) and (max-width:2159px)");
  const isBetween2160And2880 = useMediaQuery("(min-width:2160px) and (max-width:2879px)");
  const isAbove2880 = useMediaQuery("(min-width:2880px)");

  let gridItemSize = 12; // по умолчанию 1 столбец
  if (isBetween1440And2160) {
    gridItemSize = 6; // 2 столбца
  } else if (isBetween2160And2880) {
    gridItemSize = 4; // 3 столбца
  } else if (isAbove2880) {
    gridItemSize = 3; // 4 столбца
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Используем folderId, полученный из useParams
        const url = folderId 
          ? `${BACKEND_API}get-data?folder_id=${folderId}` 
          : `${BACKEND_API}get-data`;
        
        const response = await fetch(url, {
          credentials: "include", // для отправки cookie
        });
        if (!response.ok) {
          throw new Error("Ошибка при получении данных");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Ошибка получения данных:", error);
      } finally {
        setLoadingf(false);
      }
    };
  
    fetchUserData();
  }, [folderId]); // folderId добавлен в зависимости

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BACKEND_API}delete-data/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Ошибка при удалении данных");
      }
      // Обновляем состояние, исключая удалённый элемент
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Ошибка при удалении:", error);
    }
  };

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  if (loadingf) {
    return (
      <Container maxWidth={false} disableGutters>
        <Grid container justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Grid>
      </Container>
    );
  }

  if (data.length === 0) {
    return (
      <Container maxWidth={false} disableGutters>
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Нет данных для отображения
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth={false} disableGutters>
        <Grid container spacing={2} alignItems="stretch">
          {data.map((item) => (
            <Grid item key={item.id} xs={gridItemSize}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: 3,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "end" }}>
                    <IconButton onClick={() => handleOpenDialog(item)}>
                      <OpenInFullIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <DataTable
                    queryParams={{
                      p_index_id: item.p_index_id,
                      p_period_id: item.p_period_id,
                      p_terms: item.p_terms,
                      p_term_id: item.p_term_id,
                      p_dicIds: item.p_dicIds,
                      idx: item.idx,
                      chart_type: item.chart_type,
                      selected_data: item.selected_data,
                      primary_data: item.primary_data,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Модальное окно */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            m: 2,
            height: "calc(100vh - 32px)",
            borderRadius: 2,
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {selectedItem ? selectedItem.primary_data.name : ""}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2 }}>
          {selectedItem && (
            <DataTable
              queryParams={{
                p_index_id: selectedItem.p_index_id,
                p_period_id: selectedItem.p_period_id,
                p_terms: selectedItem.p_terms,
                p_term_id: selectedItem.p_term_id,
                p_dicIds: selectedItem.p_dicIds,
                idx: selectedItem.idx,
                chart_type: selectedItem.chart_type,
                selected_data: selectedItem.selected_data,
                primary_data: selectedItem.primary_data,
              }}
            />
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default FolderPage;

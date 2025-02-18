import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  IconButton,
  Dialog,
  AppBar,
  Toolbar,
  Box
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { BACKEND_API } from "./constants/constants";
import DataTable from "./TestDrilldownChart";

const GetItems = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояния для модального окна
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(BACKEND_API + "get-data", {
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
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  if (loading) {
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
            <Grid item xs={12} sm={4} md={4} key={item.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardHeader
                  action={
                    <>
                      <IconButton onClick={() => handleOpenDialog(item)}>
                        <OpenInFullIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
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
            m: 2, // отступы от краёв экрана
            height: "calc(100vh - 32px)", // высота с учётом отступов (2*16px)
            borderRadius: 2,
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)", // более тёмный фон
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

export default GetItems;

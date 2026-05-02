import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

const columns = [
  { id: "product_id", label: "Product ID", minWidth: 50 },
  { id: "pack_size", label: "Pack Size", minWidth: 100 },
  { id: "serving_size", label: "Serving Size", minWidth: 100 },
  { id: "energy", label: "Energy", minWidth: 100 },
  { id: "calories", label: "Calories", minWidth: 100 },
  { id: "fat", label: "Fat", minWidth: 100 },
  { id: "saturates", label: "Saturates", minWidth: 100 },
  { id: "sugars", label: "Sugars", minWidth: 100 },
  { id: "salt", label: "Salt", minWidth: 100 },
  { id: "actions", label: "Actions", minWidth: 100 },
];

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;

export default function NutrientsTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [dialogType, setDialogType] = useState("Add");
  const [currentRow, setCurrentRow] = useState({
    product_id: "",
    pack_size: "",
    serving_size: "",
    energy: "",
    calories: "",
    fat: "",
    saturates: "",
    sugars: "",
    salt: "",
  });

  useEffect(() => {
    async function fetchNutrients() {
      try {
        const response = await fetch(
          `${URL}/mng-nutrients/nutrients`
        );
        const data = await response.json();
        setRows(data);
      } catch (error) {
        console.error("Error fetching nutrients:", error);
        alert("Error fetching nutrients: " + error.message);
      }
    }

    fetchNutrients();
  }, []);

  const handleOpenDialog = (type, row) => {
    setDialogType(type);
    setCurrentRow(type === "Add" ? {} : row);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setCurrentRow({});
  };

  const handleSave = async () => {
    const url =
      dialogType === "Add"
        ? `${URL}/mng-nutrients/nutrients`
        : `${URL}/mng-nutrients/nutrients/${currentRow.product_id}`;
    const method = dialogType === "Add" ? "POST" : "PUT";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentRow),
      });

      if (response.ok) {
        const newRow = await response.json();
        if (dialogType === "Add") {
          setRows([...rows, newRow]);
        } else {
          setRows(
            rows.map((row) =>
              row.product_id === newRow.product_id ? newRow : row
            )
          );
        }
        handleCloseDialog();
        alert("Successful!");
      } else {
        alert("Failed to save the row: " + response.statusText);
      }
    } catch (error) {
      alert("Error saving the row: " + error.message);
    }
  };

  const handleDelete = async (product_id) => {
    try {
      const response = await fetch(
        `${URL}/mng-nutrients/nutrients/${product_id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setRows(rows.filter((row) => row.product_id !== product_id));
      } else {
        alert("Failed to delete the row: " + response.statusText);
      }
    } catch (error) {
      alert("Error deleting the row: " + error.message);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <div>
      {/* <h1 style={{ fontSize: "px", textAlign: "center" }}>Manage Nutrients</h1> */}
      <Paper sx={{ width: "100%" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog("Add")}>
          Add New
        </Button>
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.product_id}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {value}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button onClick={() => handleOpenDialog("Update", row)}>
                          Update
                        </Button>
                        <Button onClick={() => handleDelete(row.product_id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogTitle>{dialogType} Nutrient</DialogTitle>
          <DialogContent>
            {columns.map(
              (column) =>
                column.id !== "actions" && (
                  <TextField
                    key={column.id}
                    margin="dense"
                    label={column.label}
                    fullWidth
                    value={currentRow[column.id] || ""}
                    onChange={(e) =>
                      setCurrentRow({
                        ...currentRow,
                        [column.id]: e.target.value,
                      })
                    }
                  />
                )
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
}

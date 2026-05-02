import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;

const RecordTable = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        `${URL}/mng-record/records`
      );
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const deleteRecord = async (record_id) => {
    try {
      await axios.delete(`${URL}/mng-record/records/${record_id}`);
      alert("Successful!");
      fetchRecords(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>User ID</TableCell>
            <TableCell>Type of Chart</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.record_id}>
              <TableCell>{record.record_id}</TableCell>
              <TableCell>{record.user_id}</TableCell>
              <TableCell>{record.typeOfChart}</TableCell>
              <TableCell>{record.date}</TableCell>
              <TableCell>
                <Button onClick={() => deleteRecord(record.record_id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecordTable;

import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;

function AuthAdm() {
  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    axios
      .post(`${URL}/auth/admin/login`, JSON.stringify(values), {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        console.log(res.data);
        if (res.data.token) {
          // Lưu token vào LocalStorage
          localStorage.setItem("token", res.data.token); // Lưu token
          setNotifySuccess(true);
          setErrorMessage("");
          setTimeout(() => navigate("/admin/dashboard"), 2000);
        } else {
          setErrorMessage("Log in failed: " + res.data.error);
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        setErrorMessage("Login unsuccessfully!");
        if (err.response && err.response.status === 401) {
          alert("Your session has expired. Please log in again.");
          navigate("/admin/login");
        }
      });
  };

  function Copyright(props) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        {...props}>
        {"Copyright © "}
        <Link color="inherit" href="https://mui.com/">
          KNF
        </Link>{" "}
        {new Date().getFullYear()}
        {"."}
      </Typography>
    );
  }

  const defaultTheme = createTheme();

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Admin Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username "
              name="username"
              autoComplete="username"
              autoFocus
              value={values.username}
              onChange={(e) =>
                setValues({ ...values, username: e.target.value })
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}>
              Sign In
            </Button>
            {notifySuccess && (
              <Typography variant="body1" color="success">
                Success
              </Typography>
            )}
            {errorMessage && (
              <Typography variant="body1" color="error">
                {errorMessage}
              </Typography>
            )}
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/signup" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
}

export default AuthAdm;

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import PieChart from "../Pie/PieChart.js";
import PolarChart from "../Polar/PolarChart.js";
import StackedBarChart from "../Bar/BarChart.js";
import TrafficLight from "../Traffic Light System/TrafficLight.js";
import Slide from "@mui/material/Slide";
import FormControlLabel from "@mui/material/FormControlLabel";
import { alpha, styled } from "@mui/material/styles";
import { pink } from "@mui/material/colors";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import SendIcon from "@mui/icons-material/Send";
import FormGroup from "@mui/material/FormGroup";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment-timezone";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
const PinkSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: pink[600],
    "&:hover": {
      backgroundColor: alpha(pink[600], theme.palette.action.hoverOpacity),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: pink[600],
  },
}));

const label = { inputProps: { "aria-label": "Color switch demo" } };

export const AllCharts = () => {
  const { productId } = useParams();
  const [showPerContainer, setShowPerContainer] = useState(false);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [selectedCharts, setSelectedCharts] = useState({
    bar: false,
    polar: false,
    pie: false,
    table: false,
  });

  const handleSwitchChange = (event) => {
    setShowPerContainer(event.target.checked);
  };

  const handleRatingClick = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You need to log in before rating.");
        navigate("/login");
        return;
      }

      const decodedToken = jwtDecode(token);
      const currentTime = moment().unix();
      const expirationTime = decodedToken.exp;

      if (currentTime > expirationTime) {
        alert("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }

      setOpen(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to verify token. Please log in again.");
      navigate("/login");
    }
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleCheckboxChange = (event) => {
    setSelectedCharts({
      ...selectedCharts,
      [event.target.name]: event.target.checked,
    });
    console.log(selectedCharts);
  };
  const handleSendRating = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Token is missing. Please log in again.");
        navigate("/login");
        return;
      }

      const selectedTypes = Object.keys(selectedCharts).filter(
        (type) => selectedCharts[type]
      );

      for (const type of selectedTypes) {
        await axios.post(
          `${URL || `http://localhost:${PORT}`}/record/rating`,
          {
            token,
            typeOfChart: type,
            date: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm:ss"),
          }
        );
      }

      alert("Rating sent successfully");
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send rating");
    }
  };

  return (
    <div style={{ marginLeft: "5rem", marginTop: "1rem" }}>
      <Row>
        <Col>
          <StackedBarChart
            productId={productId}
            showPerContainer={showPerContainer}
          />
        </Col>
        <Col>
          <PolarChart
            productId={productId}
            showPerContainer={showPerContainer}
          />
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <PieChart productId={productId} showPerContainer={showPerContainer} />
        </Col>
        <Col>
          <TrafficLight
            productId={productId}
            showPerContainer={showPerContainer}
          />
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <FormControlLabel
            control={
              <PinkSwitch
                {...label}
                checked={showPerContainer}
                onChange={handleSwitchChange}
              />
            }
            label="Show Per Container"
          />
        </Col>
      </Row>
      <Button color="warning" onClick={handleRatingClick}>
        * Rating
      </Button>
      <React.Fragment>
        {" "}
        <Dialog
          open={open}
          TransitionComponent={Transition}
          keepMounted
          onClose={handleClose}
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogTitle>
            {
              "A clear and easily understandable chart for optimal user comprehension"
            }
          </DialogTitle>
          <DialogContent>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox onChange={handleCheckboxChange} />}
                label="Bar"
                name="bar"
              />
              <FormControlLabel
                control={<Checkbox onChange={handleCheckboxChange} />}
                label="Polar"
                name="polar"
              />
              <FormControlLabel
                control={<Checkbox onChange={handleCheckboxChange} />}
                label="Pie"
                name="pie"
              />
              <FormControlLabel
                control={<Checkbox onChange={handleCheckboxChange} />}
                label="Table"
                name="table"
              />
            </FormGroup>
            <Button
              variant="outlined"
              endIcon={<SendIcon />}
              onClick={handleSendRating}
            >
              Send
            </Button>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    </div>
  );
};

export default AllCharts;

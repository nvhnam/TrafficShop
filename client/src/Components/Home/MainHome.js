import React from "react";
import "./MainHome.css";
import trafficLight from "../../asset/trafficLight.png";
import { Link } from "react-router-dom";

const Carousel = () => {
  return (
    <div className="main-home">
      <div className="left_main-home">
        <h3
          className="animate__animated animate__fadeInUp"
          style={{ color: "#D89834" }}
        >
          Explore the Power of Nutrition
        </h3>
        <h1 className="animate__animated animate__fadeInUp animate__delay-1s">
          Make Smarter Food Choices with
        </h1>
        <h1 className="animate__animated animate__fadeInUp animate__delay-1s">
          <span style={{ color: "#D89834" }}>Traffic</span>
          <span style={{ color: "black" }}>Shop</span>
        </h1>
        <div className="desciption_main-home">
          <ul className="animate__animated animate__fadeInUp animate__delay-2s">
            <li>
              <i
                className="las la-check"
                style={{ backgroundColor: "#D89834" }}
              />
              Identify Healthier Options at a Glance
            </li>
            <li>
              <i
                className="las la-check"
                style={{ backgroundColor: "#D89834" }}
              />
              Take Control of Your Diet and Well-Being
            </li>
          </ul>
          <Link to="/product-list">
            <button
              className="btn-quote animate__animated animate__fadeInUp animate__delay-3s"
              style={{ backgroundColor: "#D89834" }}
            >
              GET STARTED
            </button>
          </Link>
        </div>
      </div>
      <div className="right_main-home">
        <div className="main-home__img animate__animated animate__fadeInUp animate__delay-2s">
          <img src={trafficLight} alt="Food Healthy Paramid" />
        </div>
      </div>
    </div>
  );
};
export default Carousel;

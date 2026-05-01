import { Button } from "@mui/material";
import { useChat } from "ai/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../Home/Footer.js";
import HeaderSub from "../Home/HeaderSub.js";
import ChartButton from "./ChartButton.js";
import "./ProductDetail.css";
import LoadingIndicator from "../Loading/LoadingIndicator.js";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;
const ProductDetail = ({ isChecked }) => {
  const [product, setProduct] = useState(null);
  const { productId } = useParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [caloriesCurrent, setCaloriesCurrent] = useState("");
  const [caloriesMaxSuggestion, setCaloriesMaxSuggestion] = useState("");

  const chatParent = useRef(null);
  const { messages, input, setInput, append, setMessages } = useChat({
    streamProtocol: "text",
    fetch: `${URL || `http://localhost:${PORT}`}/api/chat-product`,
  });
  const handleNewlines = (text) => {
    return text.split("\n").map((str, index) => (
      <span key={index}>
        {str}
        <br />
      </span>
    ));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [setMessages]);

  useEffect(() => {
    const checkStatusBar = localStorage.getItem("StatusBar");
    if (checkStatusBar) {
      const parsedStatusBar = JSON.parse(checkStatusBar);
      setCaloriesCurrent(parsedStatusBar.caloriesCurrent || 0);
      setCaloriesMaxSuggestion(parsedStatusBar.caloriesMaxSuggestions || 0);

      console.log(
        "Check Calories Max in status bar is ",
        caloriesMaxSuggestion
      );
      console.log("Check Calories Current in status bar is ", caloriesCurrent);
    }
  }, [caloriesMaxSuggestion, caloriesCurrent]);

  useEffect(() => {
    const fetchProductAndNutrients = async () => {
      setLoading(true);
      try {
        // // Fetch product details
        // const productResponse = await axios.get(
        //   `${URL || `http://localhost:${PORT}`}/product-detail/${productId}`
        // );

        // Fetch product nutrients
        const nutrientResponse = await axios.get(
          `${URL || `http://localhost:${PORT}`}/product-nutrients/${productId}`
        );

        // Combine product and nutrient data
        // const productData = nutrientResponse.data, // Add nutrients to the product

        setProduct(nutrientResponse.data);
        console.log("Combined Data:", nutrientResponse.data);
      } catch (error) {
        console.error("Error fetching product and nutrients:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductAndNutrients();
    }
  }, [productId]);

  if (product === null) {
    return <LoadingIndicator />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // await append({ role: "user", content: input });
      const newMessage = { role: "user", content: input };
      await append(newMessage);

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      // const updatedMessages = [...messages];
      // Send messages to backend
      // console.log("FE: ", updatedMessages);
      const response = await fetch(
        `${URL || `http://localhost:${PORT}`}/api/chat-product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: updatedMessages }),
        }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // console.log("response: ", response);
      // console.log("reader: ", reader);
      // console.log("decoder: ", decoder);

      let finalResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalResponse += decoder.decode(value);
      }
      // append({ role: "system", content: finalResponse });

      const assistantMessage = { role: "system", content: finalResponse };
      // setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      localStorage.setItem("chatMessages", JSON.stringify(newMessages));
      // setMessages([
      //   ...newMessages,
      //   { role: "assistant", content: finalResponse },
      // ]);
      setInput("");
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  const deleteMessage = () => {
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("sortedProductsSuggestion");
    localStorage.removeItem("DataNutrient");

    setMessages([]);
    // setProductsSuggestion([]);
  };

  const handleAddToCart = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const userId = JSON.parse(storedUser)?.user_id;

      if (!token) {
        setErrorMessage("Please log in to add products to your cart.");
        return;
      }

      const response = await axios.post(
        `${URL}/cart/add`,
        {
          userId: userId,
          productId: product.product_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setErrorMessage("");
        const checkStatusBar = localStorage.getItem("StatusBar");
        const calories = Math.round(product?.calories || 0);

        if (checkStatusBar) {
          setCaloriesCurrent((prev) => {
            const updatedCalories = Math.round(prev) + calories;

            const statusBar = {
              caloriesCurrent: updatedCalories,
              caloriesMaxSuggestions: caloriesMaxSuggestion,
            };
            localStorage.setItem("StatusBar", JSON.stringify(statusBar));

            return updatedCalories;
          });
        }

        alert("Product added to cart successfully!");
      } else {
        setErrorMessage("Failed to add product to the cart. Please try again.");
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      setErrorMessage(
        "An error occurred. Please log in to add products to your cart."
      );
    }
  };

  const StatusBar = ({ caloriesCurrent, caloriesMaxSuggestion }) => {
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
      if (caloriesCurrent > caloriesMaxSuggestion) {
        setShowAlert(true);
      }
      const timeoutId = setTimeout(() => {
        setShowAlert(false);
      }, 3000);

      return () => clearTimeout(timeoutId);
    }, [caloriesCurrent, caloriesMaxSuggestion]);

    const handleCloseAlert = () => {
      setShowAlert(false);
    };

    return (
      <div>
        {showAlert && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              padding: "10px 20px",
              backgroundColor: "#f8d7da", // Red color
              color: "#721c24",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "300px",
            }}
          >
            <span>Your cart exceeds the recommended calorie limit!</span>
            <button
              onClick={handleCloseAlert}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#721c24",
              }}
            >
              &times;
            </button>
          </div>
        )}

        <div
          className="StatusBar d-flex align-items-center"
          style={{
            display: "flex",
            width: "500px",
            alignItems: "center",
            gap: "10px",
            padding: "10px 15px",
            backgroundColor: "#e9ecef",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            color: "#333",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>Max Calories:</p>
          <span
            style={{
              color:
                caloriesCurrent > caloriesMaxSuggestion ? "#dc3545" : "#007bff", // Red if exceeds, blue otherwise
            }}
          >
            {caloriesCurrent}
          </span>
          <span style={{ fontWeight: "bold", color: "#6c757d" }}>/</span>
          <span style={{ color: "#28a745" }}>{caloriesMaxSuggestion}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <HeaderSub />
      {loading ? (
        <LoadingIndicator />
      ) : (
        <div
          className="pd w-100 mt-4 d-flex flex-column align-items-center"
          key={product.product_id}
        >
          {isChecked ? (
            <>
              <h3 style={{ color: "#D89834" }}>
                How much nutrition is in this food?
              </h3>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ChartButton productId={product.product_id} />
              </div>
            </>
          ) : (
            <h3 style={{ color: "#D89834" }}>Our Digital Services</h3>
          )}

          <div
            className="pd_content d-md-flex d-sm-block align-items-start flex-row justify-content-center w-100"
            style={{ maxWidth: "1300px", height: "480px" }}
          >
            <div
              style={{ backgroundColor: "#FDEED8" }}
              className="pd_item w-25 p-0 rounded"
            >
              <img
                src={product.img}
                className="rounded-top w-100 h-100px mb-3"
                style={{ objectFit: "contain", height: "300px" }}
                alt={product.name}
              />
              <h3 className="text-center">{product.product_name}</h3>

              <p className="mt-3" style={{ textAlign: "left" }}>
                <span>Brand:</span> {product.brand}
              </p>
              <div className="d-flex justify-content-between align-items-center w-100 mt-n2">
                <p
                  className="my-auto w-50 text-break"
                  style={{
                    textAlign: "left",
                    wordBreak: "break-word",
                    height: "1.4rem",
                    overflow: "hidden",
                  }}
                >
                  <span>Origin:</span> {product.origin}
                </p>

                <div className="d-flex w-50 pr-2 justify-content-center">
                  <Button
                    variant="contained"
                    // color="success"
                    size="medium"
                    className="px-5 text-center py-2 mr-3"
                    onClick={handleAddToCart}
                    style={{ backgroundColor: "#D89834" }}
                  >
                    <span className="text-center mx-auto">
                      <i className="fa-solid fa-cart-shopping text-center"></i>
                    </span>
                  </Button>
                </div>
              </div>
              {errorMessage && (
                <p className="text-center fs-6 mt-1" style={{ color: "red" }}>
                  {errorMessage}
                </p>
              )}
            </div>

            <div style={{ backgroundColor: "#FDEED8" }} className="pd_item">
              <h3 className="text-center">Ingredients:</h3>
              <div className="w-100 h-75 d-flex flex-column justify-content-between">
                <p>{product.ingredients}</p>
              </div>
            </div>

            {/* {loggedIn && ( */}
            <div className="chatbot" style={{ width: "600px", height: "100%" }}>
              <div className="d-flex flex-column w-100 h-100 align-items-center justify-content-center">
                <StatusBar
                  caloriesCurrent={caloriesCurrent}
                  caloriesMaxSuggestion={caloriesMaxSuggestion}
                />
                <section className="container p-0 w-100">
                  <ul
                    ref={chatParent}
                    className="list-unstyled p-3 rounded-3 shadow-sm overflow-auto"
                    style={{
                      height: "400px",
                      maxWidth: "100%",
                      overflowY: "auto",
                      overflowX: "hidden",
                      backgroundColor: "#FDEED8",
                    }}
                  >
                    {messages.map((m, index) => (
                      <li
                        key={m.id || index}
                        className={
                          m.role === "user"
                            ? "d-flex mb-3"
                            : "d-flex flex-row-reverse mb-3"
                        }
                      >
                        <div
                          className={`p-3 rounded-3 shadow-sm`}
                          style={{
                            backgroundColor:
                              m.role === "user" ? "#D2E296" : "#FBF4EA",
                          }}
                        >
                          <p className="mb-0 fs-6">
                            {handleNewlines(m.content)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="mb-4 w-100">
                  <form
                    className="d-flex align-items-center"
                    onSubmit={handleSubmit}
                  >
                    <input
                      className="form-control flex-1 me-2"
                      placeholder="Type your question here..."
                      type="text"
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                      }}
                      style={{
                        backgroundColor: "#FBF4EA",
                        borderColor: "#7D9F00",
                      }}
                    />
                    <button
                      style={{ backgroundColor: "#D89834" }}
                      className="btn btn-primary"
                      type="submit"
                    >
                      <i
                        style={{ fontSize: "14px" }}
                        class="fa-solid fa-paper-plane"
                      ></i>
                    </button>
                  </form>
                  <Button
                    variant="contained"
                    className="mt-2 w-100"
                    size="small"
                    color="error"
                    onClick={deleteMessage}
                  >
                    Remove all messages
                  </Button>
                </section>
              </div>
            </div>
            {/* )} */}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ProductDetail;

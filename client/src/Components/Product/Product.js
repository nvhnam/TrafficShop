/* eslint-disable no-mixed-operators */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-global-assign */
import { Button } from "@mui/material";
import { useChat } from "ai/react";
import axios from "axios";
import { MDBInput } from "mdb-react-ui-kit";
import { useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import Col from "react-bootstrap/Col";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import { Link } from "react-router-dom";
import "rsuite/dist/rsuite.min.css";
import Footer from "../Home/Footer";
import HeaderSub from "../Home/HeaderSub";
import TrafficLight from "../Visualization/Traffic Light System/TrafficLight.js";
import Category from "./Category";
import "./Product.css";
import LoadingIndicator from "../Loading/LoadingIndicator";

const PORT = process.env.REACT_APP_PORT;
const URL = process.env.REACT_APP_URL || `http://localhost:${PORT}`;

const Product = ({ isChecked, isToggle }) => {
  const [product, setProduct] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [foodPerPage] = useState(18);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Category");

  const [fatFilter, setFatFilter] = useState("all");
  const [saturatesFilter, setSaturatesFilter] = useState("all");
  const [sugarsFilter, setSugarsFilter] = useState("all");
  const [saltFilter, setSaltFilter] = useState("all");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("Male");
  const [goal, setGoal] = useState("Lose weight");
  const [minCal, setMinCal] = useState("");
  const [maxCal, setMaxCal] = useState("");

  const [foodGroups, setFoodGroup] = useState("");
  const [fatSuggest, setFatSuggest] = useState("");
  const [saturatesSuggest, setSaturatesSuggest] = useState("");
  const [sugarSuggest, setSugarSuggest] = useState("");
  const [saltSuggest, setSaltSuggest] = useState("");
  const [productSuggestion, setProductsSuggestion] = useState([]);
  const [showProductsSuggestion, setShowProductsSuggestion] = useState(true);
  const [caloriesCurrent, setCaloriesCurrent] = useState("");
  const [caloriesMaxSuggestion, setCaloriesMaxSuggestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // open AI ChatBox
  const [isOpenAIChatBox, setIsOpenAIChatBox] = useState(false);

  // Toggle AI ChatBox dropdown
  const toggleAIChatBox = () => {
    setIsOpenAIChatBox(!isOpenAIChatBox);
  };

  const { messages, input, setInput, append, setMessages } = useChat({
    streamProtocol: "text",
    fetch: `${URL || `http://localhost:${PORT}`}/api/chat`,
  });

  const extractMinCalories = (response) => {
    const caloriesMatch = response.match(/Calories Suggestion Min:\s*(\d+)/);
    console.log(caloriesMatch);
    return caloriesMatch ? parseInt(caloriesMatch[1], 10) : null;
  };
  const extractMaxCalories = (response) => {
    const caloriesMatch = response.match(/Calories Suggestion Max:\s*(\d+)/);
    console.log(caloriesMatch);
    return caloriesMatch ? parseInt(caloriesMatch[1], 10) : null;
  };

  const extractFoodGroups = (response) => {
    const predefinedGroups = [
      "Cereals and potatoes",
      "Sugary Snacks",
      "Fish Meat Eggs",
      "Fat and sauces",
      "Fruits and vegetables",
      "Beverages",
      "Salty Snacks",
    ];

    const foodGroupRegex = new RegExp(predefinedGroups.join("|"), "i"); // Case-insensitive match
    const foodGroupMatch = response.match(foodGroupRegex);

    if (foodGroupMatch) {
      return foodGroupMatch[0].trim();
    }

    return null;
  };
  const extractFat = (response) => {
    const fatRegex = /Fat Suggestion:\s*(\d+)\s*[gG]/;
    const fatMatch = response.match(fatRegex);
    console.log(fatMatch);
    return fatMatch ? parseInt(fatMatch[1], 10) : 10;
  };

  const extractSaturates = (response) => {
    const saturatesRegex = /Saturates Suggestion:\s*(\d+)\s*[gG]/;
    const saturatesMatch = response.match(saturatesRegex);
    return saturatesMatch ? parseInt(saturatesMatch[1], 10) : 15;
  };

  const extractSugars = (response) => {
    const sugarsRegex = /Sugars Suggestion:\s*(\d+)\s*[gG]/;
    const sugarsMatch = response.match(sugarsRegex);
    return sugarsMatch ? parseInt(sugarsMatch[1], 10) : 0.5;
  };

  const extractSalt = (response) => {
    const saltRegex = /Salt Suggestion:\s*(\d+)\s*[gG]/; // Match the number before "g" or "G"
    const saltMatch = response.match(saltRegex);
    return saltMatch ? parseInt(saltMatch[1], 10) : 3;
  };

  const handleUserInfo = async (e) => {
    e.preventDefault();

    const parsedAge = parseInt(age, 10);
    const parsedWeight = parseInt(weight, 10);
    const parsedHeight = parseInt(height, 10);

    if (isNaN(parsedAge) || isNaN(parsedWeight) || isNaN(parsedHeight)) {
      alert("Please enter valid numbers for age, weight, and height.");
      return;
    }

    if (!gender || !goal) {
      alert("Please select both gender and goal.");
      return;
    }

    const userInfo = {
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      gender,
      goal,
    };
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    alert("User info has been saved successfully!");

    const userMessage = {
      role: "user",
      content: `
        - Age: ${parsedAge}
        - Gender: ${gender}
        - Height: ${parsedHeight} cm
        - Weight: ${parsedWeight} kg
        - Goal: ${goal}
      `,
    };

    try {
      const response = await fetch(
        `${URL || `http://localhost:${PORT}`}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [userMessage] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        alert("There was an error processing your request.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let finalResponse = "";
      let caloriesMinValue = null;
      let caloriesMaxValue = null;
      let foodGroups = null;

      let fat = null;
      let sugar = null;
      let saturates = null;
      let salt = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        finalResponse += decoder.decode(value);
      }

      finalResponse = finalResponse.replace(/[*#]/, "");
      caloriesMinValue = extractMinCalories(finalResponse);
      caloriesMaxValue = extractMaxCalories(finalResponse);

      foodGroups = extractFoodGroups(finalResponse);
      fat = extractFat(finalResponse);
      saturates = extractSaturates(finalResponse);
      sugar = extractSugars(finalResponse);
      salt = extractSalt(finalResponse);

      setMinCal(caloriesMinValue);
      setMaxCal(caloriesMaxValue);

      setFoodGroup(foodGroups);
      setSelectedCategory(foodGroups);
      setFatSuggest(fat);
      setSaturatesSuggest(saturates);
      setSugarSuggest(sugar);
      setSaltSuggest(salt);

      console.log("Calories min value set:", caloriesMinValue);
      console.log("Calories max value set:", caloriesMaxValue);
      console.log("Food groups set:", foodGroups);
      console.log("fat", fat);
      console.log("saturates", saturates);
      console.log("sugar", sugar);
      console.log("salt", salt);

      const updatedMessages = [
        ...messages,
        userMessage,
        { role: "system", content: finalResponse },
      ];
      setMessages(updatedMessages);
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      setInput("");
    } catch (error) {
      console.error("Error fetching chat:", error);
      alert("There was an error sending the request.");
    }
  };
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser || token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (productSuggestion && productSuggestion.length > 0) {
      try {
        localStorage.setItem(
          "sortedProductsSuggestion",
          JSON.stringify(productSuggestion)
        );
      } catch (error) {
        console.error(
          "Error saving product suggestions to localStorage:",
          error
        );
      }
    }
  }, [productSuggestion]);

  useEffect(() => {
    const checkUserInfo = localStorage.getItem("userInfo");
    const checkIsSubmit = localStorage.getItem("CheckIsSubmit");
    if (checkUserInfo && checkIsSubmit) {
      const parsedInfo = JSON.parse(checkUserInfo);
      const parsedSubmit = JSON.parse(checkIsSubmit);
      setAge(parsedInfo.age || "");
      setWeight(parsedInfo.weight || "");
      setHeight(parsedInfo.height || "");
      setGender(parsedInfo.gender || "");
      setGoal(parsedInfo.goal || "");
    }
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [setMessages]);

  useEffect(() => {
    if (
      minCal &&
      maxCal &&
      fatSuggest &&
      saturatesSuggest &&
      sugarSuggest &&
      saltSuggest
    ) {
      const dataNutrientSuggest = {
        caloriesMin: minCal,
        caloriesMax: maxCal,
        fat: fatSuggest,
        saturates: saturatesSuggest,
        sugar: sugarSuggest,
        salt: saltSuggest,
      };

      localStorage.setItem("DataNutrient", JSON.stringify(dataNutrientSuggest));
    }
  }, [minCal, maxCal, fatSuggest, saturatesSuggest, sugarSuggest, saltSuggest]);

  useEffect(() => {
    if (maxCal) {
      const checkNutrientSuggest = localStorage.getItem("DataNutrient");
      if (checkNutrientSuggest) {
        const parsedInfo = JSON.parse(checkNutrientSuggest);
        setCaloriesMaxSuggestion(parsedInfo.caloriesMax || 0);
        try {
          const statusBar = {
            caloriesCurrent: caloriesCurrent,
            caloriesMaxSuggestions: caloriesMaxSuggestion,
          };
          localStorage.setItem("StatusBar", JSON.stringify(statusBar));
        } catch (error) {
          console.error(
            "Error saving product suggestions to localStorage:",
            error
          );
        }
      }
    }
  }, [caloriesMaxSuggestion, maxCal, caloriesCurrent]);

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
    } else {
      setCaloriesCurrent(0);
      setCaloriesMaxSuggestion(0);
    }
  }, [caloriesMaxSuggestion, caloriesCurrent]);

  const chatParent = useRef(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [chatParent]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const sortedProductsSuggestion = localStorage.getItem(
          "sortedProductsSuggestion"
        );

        if (sortedProductsSuggestion && showProductsSuggestion) {
          const productSuggestionAI = JSON.parse(sortedProductsSuggestion);
          console.log(
            "Loaded products from localStorage:",
            productSuggestionAI
          );
          setProduct(productSuggestionAI);
        } else {
          const response = await axios.get(
            `${URL || `http://localhost:${PORT}`}/product-with-nutrients`,
            {
              params: {
                fat: fatFilter,
                saturates: saturatesFilter,
                sugars: sugarsFilter,
                salt: saltFilter,
                category: selectedCategory,
                currentPage: currentPage,
                limit: foodPerPage,
              },
            }
          );

          // console.log("Fetched products from server:", response.data);
          setSearchResults(response.data.results);
          setProduct(response.data.results);
          setTotalPages(response.data.totalPages);
        }

        setSearchTerm("");
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [
    fatFilter,
    saltFilter,
    saturatesFilter,
    showProductsSuggestion,
    sugarsFilter,
    selectedCategory,
    currentPage,
    foodPerPage,
  ]);

  useEffect(() => {
    const checkUserInfo = localStorage.getItem("userInfo");
    if (checkUserInfo) {
      const parsedInfo = JSON.parse(checkUserInfo);
      setAge(parsedInfo.age || "");
      setWeight(parsedInfo.weight || "");
      setHeight(parsedInfo.height || "");
      setGender(parsedInfo.gender || "male");
      setGoal(parsedInfo.goal || "none");
    }
  }, []);

  useEffect(() => {
    const fetchFilteredProductsChatBot = async () => {
      if (foodGroups !== "") {
        try {
          let api = `${URL || `http://localhost:${PORT}`}/filter`;

          const response = await axios.get(api, {
            params: {
              level0: foodGroups || null,
            },
          });

          console.log("filter: ", response.data);

          const filteredProducts = response.data
            .map((filteredItem) => {
              const productImage = product.find(
                (item) => item.product_id === filteredItem.product_id
              );
              return {
                ...filteredItem,
                product_name: productImage ? productImage.product_name : null,
                img: productImage ? productImage.img : null,
                nutrients: productImage ? productImage.nutrients : null,
              };
            })
            .filter((item) => {
              const { nutrients } = item;
              const maxCaloInEachProduct = Math.round(maxCal / 3);
              const minCaloInEachProduct = Math.round(minCal / 3);
              console.log("maxCalo", maxCaloInEachProduct);
              if (maxCal === minCal) {
                return (
                  nutrients &&
                  nutrients.calories < maxCaloInEachProduct + 50 &&
                  nutrients.calories >= minCaloInEachProduct
                );
              } else {
                return (
                  nutrients &&
                  nutrients.calories < maxCaloInEachProduct &&
                  nutrients.calories >= minCaloInEachProduct
                );
              }
            });

          const finalProducts =
            filteredProducts.length > 0 ? filteredProducts : response.data;

          const sortedProducts = finalProducts.sort((a, b) => {
            const caloriesA = a.nutrients.calories || 0;
            const caloriesB = b.nutrients.calories || 0;
            return caloriesA - caloriesB;
          });
          setSearchResults(sortedProducts);
          setProductsSuggestion(sortedProducts);
        } catch (error) {
          console.error("Error fetching filtered products:", error);
        }
      } else {
        setSearchResults(product);
      }
    };
    fetchFilteredProductsChatBot();
  }, [
    foodGroups,
    product,
    fatSuggest,
    saltSuggest,
    sugarSuggest,
    minCal,
    maxCal,
  ]);

  useEffect(() => {
    const results = searchTerm
      ? product.filter((productItem) =>
          productItem.product_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      : product;

    setSearchResults(results);
  }, [searchTerm, product, currentPage, foodPerPage]);

  // const handleToggle = () => {
  //   setIsChecked(!isChecked);
  // };

  const deleteMessage = () => {
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("sortedProductsSuggestion");
    localStorage.removeItem("DataNutrient");
    // localStorage.removeItem("StatusBar");

    setMessages([]);
    // setProductsSuggestion([]);
  };

  const StatusBar = ({ caloriesCurrent, caloriesMaxSuggestion }) => {
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
      if (caloriesCurrent > caloriesMaxSuggestion) {
        setShowAlert(true);
      }
      const timeoutId = setTimeout(() => {
        setShowAlert(false);
      }, 2500);

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
              position: "absolute",
              top: "-7px",
              right: "0px",
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
          className="AI-advisor-status"
          // style={{
          //   display: "flex",
          //   width: 300,
          //   alignItems: "center",
          //   gap: "10px",
          //   padding: "10px 15px",
          //   backgroundColor: "#e9ecef",
          //   borderRadius: "8px",
          //   fontSize: "16px",
          //   fontWeight: "500",
          //   color: "#333",
          //   boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          // }}
        >
          <p style={{ margin: 0, fontWeight: "400" }}>Max Calories:</p>
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

  const handleAddToCart = async (product) => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const userId = JSON.parse(storedUser)?.user_id;
      if (!token) {
        setErrorMessage("Please log in to add products to your cart.");
        alert("Please log in to add products to your cart.");
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
        const energy = Math.round(product?.nutrients?.calories);

        setCaloriesCurrent((prev) => {
          const updatedCalories = Math.round(prev) + energy;
          console.log("check status bar", energy);
          const statusBar = {
            caloriesCurrent: updatedCalories,
            caloriesMaxSuggestions: caloriesMaxSuggestion,
          };
          localStorage.setItem("StatusBar", JSON.stringify(statusBar));
          return updatedCalories;
        });

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

  const currentFood = searchResults;
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
        `${URL || `http://localhost:${PORT}`}/api/chat`,
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

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      const results = product.filter((productItem) =>
        productItem.product_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    }
  };

  const handleSelectedCategory = (category) => {
    setSelectedCategory(category);
    setShowProductsSuggestion(false);
  };

  const truncate = (nameOfFood, maxLength) => {
    if (!nameOfFood) {
      return "";
    }
    if (nameOfFood.length <= maxLength) {
      return nameOfFood;
    }
    return nameOfFood.substr(0, maxLength) + "...";
  };

  const renderPaginationItems = () => {
    const maxPagesToShow = 5;
    const middlePage = Math.ceil(maxPagesToShow / 2);
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= middlePage) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + middlePage >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - middlePage + 1;
      endPage = currentPage + middlePage - 1;
    }

    const items = [];
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (startPage !== 1) {
      items.unshift(<Pagination.Ellipsis key="startEllipsis" />);
    }

    if (endPage !== totalPages) {
      items.push(<Pagination.Ellipsis key="endEllipsis" />);
    }

    return items;
  };

  const handleNewlines = (text) => {
    return text.split("\n").map((str, index) => (
      <span key={index}>
        {str}
        <br />
      </span>
    ));
  };

  // if (loading) {
  //   return <LoadingIndicator />;
  // }

  return (
    <>
      <div className="product d-flex flex-column align-items-center w-100 h-100 mb-5">
        <HeaderSub />

        <div
          className="product-items p-1 mx-auto d-flex gap-5"
          style={{ marginTop: "7rem" }}
        >
          <div className="select-items w-25">
            <Category
              onSelectCategory={handleSelectedCategory}
              selectedCategory={selectedCategory}
            />
            <div className="mb-4"></div>
            {isChecked && (
              <div className="w-100">
                <div className="w-100 d-flex justify-content-start mb-4">
                  <h3 className="text-left fs-4">Traffic Light</h3>
                </div>
                <div className="w-100 d-flex flex-column gap-2">
                  {[
                    { name: "Fat", state: fatFilter, setState: setFatFilter },
                    {
                      name: "Saturated Fat",
                      state: saturatesFilter,
                      setState: setSaturatesFilter,
                    },
                    {
                      name: "Sugars",
                      state: sugarsFilter,
                      setState: setSugarsFilter,
                    },
                    {
                      name: "Salt",
                      state: saltFilter,
                      setState: setSaltFilter,
                    },
                  ].map(({ name, state, setState }) => (
                    <div key={name} className="w-100">
                      <label className="w-50 mb-2 fs-6">{name}:</label>
                      <div className="d-flex w-100 gap-1 flex-wrap">
                        {[
                          {
                            id: "all",
                            label: "All",
                            color: "secondary",
                            textColor: "black",
                          },
                          {
                            id: "low",
                            label: "Low",
                            color: "success",
                            textColor: "white",
                          },
                          {
                            id: "medium",
                            label: "Medium",
                            color: "warning",
                            textColor: "white",
                          },
                          {
                            id: "high",
                            label: "High",
                            color: "danger",
                            textColor: "white",
                          },
                        ].map(({ id, label, color, textColor }) => (
                          <div
                            key={id}
                            className={`w-auto bg-${color} rounded px-2 py-1 d-flex gap-1`}
                          >
                            <input
                              type="radio"
                              id={`${name.toLowerCase()}-${id}`}
                              name={name.toLowerCase()}
                              value={id}
                              checked={state === id}
                              onChange={() => setState(id)}
                            />
                            <label
                              htmlFor={`${name.toLowerCase()}-${id}`}
                              style={{ fontWeight: "bold", color: textColor }}
                            >
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="container-fluid">
            <div className="d-flex flex-wrap justify-content-between align-items-center search-container">
              <div className="nav-search">
                <div className="form-outline">
                  <MDBInput
                    type="text"
                    id="formTextExample1"
                    className="form-control"
                    aria-describedby="textExample1"
                    placeholder="Kind Of Food"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                  />
                  {searchTerm !== "" && (
                    <div className="search-results">
                      {searchResults.map((productItem) => (
                        <div
                          key={productItem.product_id}
                          className="search-item"
                        >
                          <Card.Body>
                            <Link
                              to={`/product-detail/${productItem.product_id}`}
                              className="search-link"
                            >
                              <p>{truncate(productItem.product_name, 50)}</p>
                            </Link>
                          </Card.Body>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div id="textExample1" className="form-text">
                  We have a board of food.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input switch-input"
                  type="checkbox"
                  role="switch"
                  id="flexSwitchCheckChecked"
                  checked={isChecked}
                  onChange={isToggle}
                />
                <label
                  className="form-check-label"
                  htmlFor="flexSwitchCheckChecked"
                >
                  Show Nutrition Labelling
                </label>
              </div>
            </div>

            {loading ? (
              <LoadingIndicator />
            ) : (
              <Row className={`g-4 mt-2 ${isOpenAIChatBox ? "w-75" : "w-100"}`}>
                {currentFood.map((productItem) => (
                  <Col
                    key={productItem.product_id}
                    xs={12}
                    sm={12}
                    md={isOpenAIChatBox ? 12 : 6}
                    lg={isOpenAIChatBox ? 6 : 4}
                    className={`product-col`}
                  >
                    <Card
                      className={`card-product ${
                        !isChecked ? "no-traffic-light" : ""
                      }`}
                    >
                      <Link to={`/product-detail/${productItem.product_id}`}>
                        {productItem.img ? (
                          <Card.Img
                            variant="top"
                            src={productItem.img}
                            className="card-product-img"
                          />
                        ) : (
                          <div className="no-image-placeholder">
                            <span>No Image Available</span>
                          </div>
                        )}
                        <Card.Body className="card-product-container">
                          <Card.Title
                            className="card-product-title"
                            title={productItem.product_name}
                          >
                            {truncate(productItem.product_name, 17)}
                          </Card.Title>
                          {isChecked && (
                            <TrafficLight
                              productId={productItem.product_id}
                              showText={false}
                              mainPage={true}
                              showPerContainer={true}
                              theWidth="calc(203px + 3vw)"
                            />
                          )}
                        </Card.Body>
                      </Link>
                      <div className="d-flex justify-content-center mt-auto">
                        <Button
                          className="button-primary button-add-to-cart"
                          onClick={() => handleAddToCart(productItem)}
                        >
                          <i className="fa-solid fa-cart-shopping"></i>
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* AI CHATBOX */}
          {/* {loggedIn && ( */}
          <div
            className={`AI-advisor-container ${
              isOpenAIChatBox ? "open" : "closed"
            }`}
            // className="d-flex flex-column w-50 h-75 align-items-center justify-content-center"
          >
            <div className="AI-advisor-header" onClick={toggleAIChatBox}>
              <div className="AI-advisor-header-title">
                AI Product Advisor
                <span
                  className={`AI-toggle-icon ${isOpenAIChatBox ? "open" : ""}`}
                >
                  {isOpenAIChatBox ? "▲" : "▼"}
                </span>
              </div>
              <hr className="AI-header-divider" />
              <StatusBar
                caloriesCurrent={caloriesCurrent}
                caloriesMaxSuggestion={caloriesMaxSuggestion}
              />
            </div>

            {/* Dropdown content */}
            {isOpenAIChatBox && (
              <div className="AI-advisor-content">
                <section className="mb-4">
                  <p className="title-filter-chatbox">Profile</p>
                  <hr className="divider" />
                  <form className="w-100 mt-3" onSubmit={handleUserInfo}>
                    <div className="w-100 d-flex align-items-center justify-content-between gap-3">
                      <div className="w-50">
                        <div className="mb-3 d-flex align-items-center justify-content-between">
                          <label htmlFor="userAge" className="form-label fs-6">
                            Age
                          </label>
                          <input
                            id="userAge"
                            className="form-control w-50"
                            placeholder="20"
                            type="number"
                            value={age}
                            min="1"
                            onChange={(event) => {
                              setAge(event.target.value);
                            }}
                            required
                            style={{
                              backgroundColor: "#FBF4EA",
                              borderColor: "#7D9F00",
                            }}
                          />
                        </div>
                        <div className="mb-3 d-flex align-items-center justify-content-between gap-2">
                          <label
                            htmlFor="userGender"
                            className=" form-label fs-6"
                          >
                            Gender
                          </label>
                          <select
                            id="userGender"
                            className="form-select form-select-sm w-50"
                            required
                            value={gender}
                            onChange={(event) => setGender(event.target.value)}
                            style={{
                              backgroundColor: "#FBF4EA",
                              borderColor: "#7D9F00",
                            }}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="w-50">
                        <div className="w-100 mb-3 d-flex align-items-center gap-2 justify-content-between">
                          <label
                            htmlFor="userWeight"
                            className="form-label fs-6"
                          >
                            Weight (kg)
                          </label>
                          <input
                            id="userWeight"
                            className="form-control w-50"
                            placeholder="60"
                            type="number"
                            min="1"
                            value={weight}
                            onChange={(event) => {
                              setWeight(event.target.value);
                            }}
                            required
                            style={{
                              backgroundColor: "#FBF4EA",
                              borderColor: "#7D9F00",
                            }}
                          />
                        </div>
                        <div className="w-100 mb-3 d-flex align-items-center justify-content-between gap-2">
                          <label
                            htmlFor="userHeight"
                            className="form-label fs-6"
                          >
                            Height (cm)
                          </label>
                          <input
                            id="userHeight"
                            className="form-control w-50"
                            min="10"
                            placeholder="170"
                            type="number"
                            value={height}
                            onChange={(event) => {
                              setHeight(event.target.value);
                            }}
                            style={{
                              backgroundColor: "#FBF4EA",
                              borderColor: "#7D9F00",
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-100 d-flex align-items-center justify-content-between gap-2">
                      <label htmlFor="userGoal" className=" form-label fs-6">
                        Goal
                      </label>
                      <select
                        id="userGoal"
                        className="form-select form-select w-50"
                        required
                        value={goal}
                        onChange={(event) => setGoal(event.target.value)}
                        style={{
                          backgroundColor: "#FBF4EA",
                          borderColor: "#7D9F00",
                        }}
                      >
                        <option value="loseWeight">Lose weight</option>
                        <option value="gainWeight">Gain weight</option>
                        <option value="maintainWeight">Maintain weight</option>
                        <option value="none">None</option>
                      </select>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        style={{
                          backgroundColor: "#D89834",
                          fontSize: "15px",
                        }}
                      >
                        Set
                      </button>
                    </div>
                  </form>
                </section>
                <section className="container p-0 w-100">
                  <p className="title-filter-chatbox">ChatBox</p>
                  <hr className="divider" />

                  <ul
                    ref={chatParent}
                    className="chat-box-frame list-unstyled p-3 rounded-3 border-none outline-none shadow-none shadow-sm overflow-auto"
                    style={{ height: "500px", backgroundColor: "#FDEED8" }}
                  >
                    {messages && messages.length > 0 ? (
                      messages.map((m, index) => (
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
                      ))
                    ) : (
                      <p className="mb-0 fs-6">
                        If you want me to recommend products based on your
                        health, please fill out the form above now.
                      </p>
                    )}
                  </ul>
                </section>
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
                    className="btn btn-primary"
                    type="submit"
                    style={{ backgroundColor: "#D89834" }}
                  >
                    <i
                      style={{ fontSize: "14px" }}
                      className="fa-solid fa-paper-plane"
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
              </div>
            )}

            {/* END DROPDOWN CONTENT */}
          </div>
          {/* END AI CHATBOX */}
          {/* // )} */}
        </div>

        <div style={{ marginTop: "6rem" }}>
          <Pagination style={{ display: "flex", justifyContent: "flex-end" }}>
            <Pagination.First onClick={() => paginate(1)} />
            <Pagination.Prev
              onClick={() => paginate(Math.max(1, currentPage - 1))}
            />
            {renderPaginationItems()}
            <Pagination.Next
              onClick={() => paginate(Math.min(currentPage + 1, totalPages))}
            />
            <Pagination.Last onClick={() => paginate(totalPages)} />
          </Pagination>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;

roduct;

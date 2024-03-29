import React, { useState, useEffect } from "react";
import "./chatbox.css";
import { BsChatRightTextFill } from "react-icons/bs";
import { RiCloseFill } from "react-icons/ri";
import { IoMdSend } from "react-icons/io";
import ChatboxMessage from "../ChatboxMessage";
import CheckoutButton from "../CheckoutButton";
import MyDatePicker from "../DatePicker";
import ImageCarousel from "../ImageCarousel";
import Button, { StackHorizontal } from "../Button";
import { format } from "date-fns";

//import ImageUploadForm from '../ImageUpload';
//import Button from '@material-ui/core/Button';

//import fetch from 'node-fetch';

//const URL = "http://localhost:8000/api/response/";
// const URL = "http://127.0.0.1:8000/api/response/";
const URL = "https://api.eazibots.com/api/response/";

function Chatbox({ userName, operatorName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [manualTextInput, setManualTextInput] = useState("");
  const [currentInputMode, setCurrentInputMode] = useState({
    type: "manualInput",
    value: "",
  });
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState("");
  const [prevPlaceholder, setPlaceholder] = useState(
    "Hi I'm Aurora, an AI powered assistant."
  );
  const [userInteracted, setUserInteracted] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  //const [csrftoken, setcsrftoken] = useState('');
  function getCookie(name) {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      let cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendBtn();
      setUserInteracted(true);
    }
  };

  const formatDate = (datetime, formatType) => {
    const types = {
      forBackend: "yyyy-MM-dd'T'HH:mm:ssxxx",
      humanReadable: "p',' PPPP",
    };

    let stringFormat = types[formatType];

    return format(new Date(datetime), stringFormat);
  };

  const updateCurrentInputValue = (value) => {
    return setCurrentInputMode((prevState) => {
      return {
        type: prevState.type,
        value: value,
      };
    });
  };

  const handleSendBtn = () => {
    const { type, value } = currentInputMode;

    if (
      (type === "manualInput" && manualTextInput.trim() === "") ||
      (type !== "manualInput" && value === "")
    ) {
      return;
    }

    let newMessage, valueToSend;

    if (type !== "date" && type !== "manualInput") {
      // for button and image
      newMessage = value;
      valueToSend = value;
    } else if (type === "date") {
      newMessage = formatDate(value, "humanReadable");
      valueToSend = formatDate(value, "forBackend");
    } else {
      newMessage = manualTextInput;
      valueToSend = manualTextInput;
    }

    setLoading(true);
    const msg1 = { role: "user", name: userName, message: String(newMessage) };
    setMessages((messages) => [...messages, msg1]);

    // resets
    setManualTextInput("");
    setAvailableDates([]);
    setCurrentInputMode(() => {
      return {
        type: "manualInput",
        value: "",
      };
    });

    // send value to backend
    return submitValue(valueToSend);
  };

  const submitValue = async (value) => {
    const csrftoken = getCookie("csrftoken");
    const sessiontoken = getCookie("sessionid");
    //console.log(csrftoken, ">>>>>>", sessiontoken);

    try {
      const response = await fetch(URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
          "X-Session-ID": sessiontoken,
        },
        body: JSON.stringify({ msg: value, session_key: sessionKey }),
        credentials: "include",
      });
      const result = await response.json();
      //console.log(result)

      setLoading(false);

      const msg2 = {
        role: "operator",
        name: operatorName,
        message: result["response"],
      };
      setSessionKey(result["session_key"]);

      if (Array.isArray(result["response"])) {
        const startDates = result["response"].map((dateObj) => dateObj.start);
        //console.log(startDates)
        setAvailableDates(startDates); // Update availableDates state with the array of start dates
        setCurrentInputMode(() => {
          return {
            type: "date",
            value: "",
          };
        });
      } else if (result["response"].includes("Which teeth")) {
        setCurrentInputMode(() => {
          return {
            type: "image",
            value: "",
          };
        });
      } else if (result["response"].includes("Y/N")) {
        setCurrentInputMode(() => {
          return {
            type: "button",
            value: "",
          };
        });
      } else if (result["response"].includes("START button below")) {
        setCurrentInputMode(() => {
          return {
            type: "button",
            value: "",
          };
        });
      } else if (result["response"].includes("new or existing")) {
        setCurrentInputMode(() => {
          return {
            type: "button",
            value: "",
          };
        });
      } else if (result["response"].includes("I/C")) {
        setCurrentInputMode(() => {
          return {
            type: "button",
            value: "",
          };
        });
      } else if (result["response"].includes("Click the PAY")) {
        setCurrentInputMode(() => {
          return {
            type: "button",
            value: "",
          };
        });
      }
      else {
        setCurrentInputMode(() => {
          return {
            type: "manualInput",
            value: "",
          };
        });
      }

      setMessages((messages) => [...messages, msg2]);
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    // auto send button/image value once state has been updated
    if (
      (currentInputMode.type === "button" ||
        currentInputMode.type === "image") &&
      currentInputMode.value
    ) {
      handleSendBtn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInputMode.value, currentInputMode.type]);

  useEffect(() => {
    if (!userInteracted) {
      let typingTimer;
      const placeholderText = "Hi. I'm Aurora, an AI powered assistant.";
      const typingDelay = 100; // Delay between each character
      const erasingDelay = 50; // Delay between each character while erasing
      const pauseDelay = 5000; // Delay before starting erasing

      const typeText = () => {
        let currentIndex = -1;
        setPlaceholder("");

        typingTimer = setInterval(() => {
          setPlaceholder(
            (prevPlaceholder) => prevPlaceholder + placeholderText[currentIndex]
          );
          currentIndex++;

          if (currentIndex === placeholderText.length - 1) {
            clearInterval(typingTimer);
            setTimeout(eraseText, pauseDelay);
          }
        }, typingDelay);
        //console.log(placeholder, placeholderText, currentIndex)
      };

      const eraseText = () => {
        let currentIndex = placeholderText.length - 1;

        typingTimer = setInterval(() => {
          setPlaceholder((prevPlaceholder) =>
            prevPlaceholder.slice(0, currentIndex)
          );
          currentIndex--;

          if (currentIndex === placeholderText.length - 1) {
            clearInterval(typingTimer);
            setTimeout(typeText, pauseDelay);
          }
        }, erasingDelay);

        if (currentIndex === placeholderText.length - 1) {
          clearInterval(typingTimer);
          setTimeout(typeText, pauseDelay);
        }
      };

      typeText();

      return () => {
        clearInterval(typingTimer);
      };
    }
  }, [userInteracted]);

  return (
    <div className="chatbox">
      <div className={`chatbox__support ${isOpen ? "chatbox--active" : ""}`}>
        <div className="chatbox__header">
          <img
            src="https://royalmewsdentalpractice.co.uk/wp-content/uploads/2019/09/royal-mews-logo-300x113.png"
            style={{
              verticalAlign: "middle",
              height: "50px",
              width: "150px",
              marginRight: "5px",
            }}
            alt=""
          />
          <span
            className="chatbox__title"
            style={{ color: "white", font: "4px" }}
          >
            <b></b>
          </span>
          <button className="chatbox__close" onClick={toggleChatbox}>
            <RiCloseFill size={20} fill="#FFF" />
          </button>
        </div>
        <div className="chatbox__messages">
          {loading && (
            <div className="loading">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
              {loading}
            </div>
          )}
          {messages
            .slice()
            .reverse()
            .map((msg, index) => {
              if (Array.isArray(msg["message"])) {
                return (
                  <React.Fragment key={index}>
                    {availableDates.length > 0 && index === 0 ? (
                      <MyDatePicker
                        availableDates={availableDates}
                        setDateTime={updateCurrentInputValue}
                      />
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={{
                        role: "operator",
                        name: operatorName,
                        message:
                          "Please choose a date and time that works for you and press the send arrow below.",
                      }}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                );
              } else if (
                msg["role"] === "operator" &&
                msg["message"].includes("Which teeth")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "image" && index === 0 ? (
                      <ImageCarousel
                        selectedImage={currentInputMode.value}
                        onSelect={updateCurrentInputValue}
                      />
                    ) : null}
                    <ChatboxMessage
                      msg={{
                        role: "operator",
                        name: operatorName,
                        message: msg.message,
                      }}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                );
              } else if (
                msg["role"] === "operator" &&
                msg["message"].includes("Y/N")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "button" && index === 0 ? (
                      <StackHorizontal>
                        <Button
                          label={"Yes"}
                          onClick={() => updateCurrentInputValue("Yes")}
                          style={{ padding: "5px 10px", fontSize: "3px" }}
                        />
                        <Button
                          label={"No"}
                          onClick={() => updateCurrentInputValue("No")}
                          style={{ padding: "5px 10px", fontSize: "3px" }}
                        />
                      </StackHorizontal>
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                );
              } else if (
                msg["role"] === "operator" &&
                msg["message"].includes("new or existing")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "button" && index === 0 ? (
                      <StackHorizontal>
                        <Button
                          label={"New"}
                          onClick={() => updateCurrentInputValue("New")}
                        />
                        <Button
                          label={"Existing"}
                          onClick={() => updateCurrentInputValue("Existing")}
                        />
                      </StackHorizontal>
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                );
              }
              else if (
                msg["role"] === "operator" &&
                msg["message"].includes("START button below")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "button" && index === 0 ? (
                      <StackHorizontal>
                        <Button
                          label={"START"}
                          onClick={() => updateCurrentInputValue("START")}
                        />
                      </StackHorizontal>
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                ); 
              } else if (
                msg["role"] === "operator" &&
                msg["message"].includes("Click the PAY")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "button" && index === 0 ? (
                      <StackHorizontal>
                        <Button
                          label={"PAY"}
                          onClick={() => updateCurrentInputValue("PAY")}
                        />
                      </StackHorizontal>
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                ); 
              } else if (
                msg["role"] === "operator" &&
                msg["message"].includes("I/C")
              ) {
                return (
                  <React.Fragment key={index}>
                    {currentInputMode.type === "button" && index === 0 ? (
                      <StackHorizontal>
                        <Button
                          label={"In-Person"}
                          onClick={() => updateCurrentInputValue("In-Person")}
                          style={{ padding: "5px 10px", fontSize: "8px" }}
                        />
                        <Button
                          label={"Call Back"}
                          onClick={() => updateCurrentInputValue("Call Back")}
                          style={{ padding: "5px 10px", fontSize: "8px" }}
                        />
                      </StackHorizontal>
                    ) : null}
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                ); 
              } 
              else if (msg["message"].includes("checkout")) {
                return (
                  <React.Fragment key={index}>
                    <CheckoutButton sessionKey={sessionKey} />
                    <ChatboxMessage
                      key={index}
                      msg={msg}
                      sessionKey={sessionKey}
                    />
                  </React.Fragment>
                );
              } else {
                return (
                  <ChatboxMessage
                    key={index}
                    msg={msg}
                    sessionKey={sessionKey}
                  />
                );
              }
            })}
        </div>

        <div className="chatbox__footer">
          <div className="chatbox__send">
            <input
              type="text"
              value={manualTextInput}
              onChange={(e) => setManualTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={prevPlaceholder}
              disabled={currentInputMode.type !== "manualInput"}
            />

            <button className="send__button" onClick={handleSendBtn}>
              <IoMdSend size={30} color="#FFF" />
            </button>
          </div>
          <div className="chatbox__powered">
            <b>Powered By EaziBots</b>{" "}
            <img
              src="https://img.icons8.com/?size=512&id=63766&format=png"
              style={{
                verticalAlign: "middle",
                height: "30px",
                width: "30px",
                marginRight: "5px",
              }}
              alt="globe"
            ></img>
          </div>
        </div>
      </div>
      <div className="chatbox__toggle">
        <button className="chatbox__button" onClick={toggleChatbox}>
          <BsChatRightTextFill size={40} color="#FFF" />
        </button>
      </div>
    </div>
  );
}

export default Chatbox;
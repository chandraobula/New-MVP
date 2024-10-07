import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./ArticlePage.css";
import { Typography } from "@mui/material";
import flag from "../../assets/images/flash.svg";
import Arrow from "../../assets/images/back-arrow.svg";
import annotate from "../../assets/images/task-square.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { CircularProgress } from "@mui/material";
import Annotation from "../../components/Annotaions";
import notesicon from "../../assets/images/note-2.svg";
import rehypeRaw from "rehype-raw";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";
import { IoSaveOutline } from "react-icons/io5";
import NotesManager from "../../components/NotesManager";
import { TextContext } from "../../components/TextProvider";
//import Createnotes from "../NewNote/CreateNotes";

const ArticlePage = () => {
  const { pmid } = useParams();
  const location = useLocation();
  const { data } = location.state || { data: [] };
  const [searchTerm, setSearchTerm] = useState("");
  const [articleData, setArticleData] = useState(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState(""); // Initialize with empty string
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const annotateData = location.state.annotateData || { annotateData: [] };
  const endOfMessagesRef = useRef(null); // Ref to scroll to the last message
  const [chatHistory, setChatHistory] = useState(() => {
    const storedHistory = sessionStorage.getItem("chatHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [showStreamingSection, setShowStreamingSection] = useState(false);
  // const [chatInput, setChatInput] = useState(true);
  const [openAnnotate, setOpenAnnotate] = useState(false);
  const [openNotes, setOpenNotes] = useState(false);
  //const [activeSection, setActiveSection] = useState("Title");
  const contentRef = useRef(null); // Ref to target the content div
  const [contentWidth, setContentWidth] = useState(); // State for content width
  //const [selectedText, setSelectedText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const { setSelectedText } = useContext(TextContext);

  const handleMouseUp = (event) => {
    const selection = window.getSelection().toString();

    if (selection) {
      setSelectedText(selection);
      setPopupPosition({ x: event.pageX, y: event.pageY });
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  };

  // const handleMoveToNotes = () => {
  //   // alert(`Sending to Copilot: ${selectedText}`);
  //   //console.log(selectedText);
  //   setShowPopup(false);
  // };

  useEffect(() => {
    // Access the computed width of the content div
    if (contentRef.current) {
      const width = contentRef.current.offsetWidth; // Get the width of the content div in pixels
      setContentWidth(`${width}px`); // Update the contentWidth state with the computed width
    }
  }, [openAnnotate]);
  useEffect(() => {
    // Access the computed width of the content div
    if (contentRef.current) {
      const width = contentRef.current.offsetWidth; // Get the width of the content div in pixels
      setContentWidth(`${width}px`); // Update the contentWidth state with the computed width
    }
  }, [openNotes]);
  console.log(showStreamingSection);

  useEffect(() => {
    if (data && data.articles) {
      const savedTerm = sessionStorage.getItem("SearchTerm");
      setSearchTerm(savedTerm);
      console.log(
        "PMID from state data:",
        typeof data.articles.map((article) => article.pmid)
      );
      console.log(typeof pmid);
      //console.log(response);
      // console.log(pmid)
      const article = data.articles.find((article) => {
        // Example: If pmid is stored as `article.pmid.value`, modify accordingly
        const articlePmid = article.pmid.value || article.pmid; // Update this line based on the actual structure of pmid
        return String(articlePmid) === String(pmid);
      });
      console.log(article);
      if (article) {
        setArticleData(article);
      } else {
        console.error("Article not found for the given PMID");
      }
    } else {
      console.error("Data or articles not available");
    }
  }, [pmid, data, response]);
  console.log(articleData);
  useEffect(() => {
    // Scroll to the bottom whenever chat history is updated
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]); // This will trigger when chatHistory changes

  const handleAskClick = async () => {
    if (!query) {
      alert("Please enter a query");
      return;
    }

    setShowStreamingSection(true);
    setLoading(true);

    const newChatEntry = { query, response: "" };
    setChatHistory((prevChatHistory) => [...prevChatHistory, newChatEntry]);

    const bodyData = JSON.stringify({
      question: query,
      pmid: pmid,
    });

    try {
      const response = await fetch("http://13.127.207.184:80/generateanswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bodyData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setQuery("");

      const readStream = async () => {
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            buffer += decoder.decode(value, { stream: true });

            // Store the latest history entry on top
            if (articleData) {
              let storedHistory =
                JSON.parse(localStorage.getItem("history")) || [];
              const newHistoryEntry = {
                pmid: pmid,
                title: articleData.article_title.toLowerCase(),
              };

              // Add the new entry to the beginning of the history
              storedHistory = [
                newHistoryEntry,
                ...storedHistory.filter((item) => item.pmid !== pmid),
              ];

              // Update localStorage
              localStorage.setItem("history", JSON.stringify(storedHistory));
            }
            // While there is a complete JSON object in the buffer
            while (buffer.indexOf("{") !== -1 && buffer.indexOf("}") !== -1) {
              let start = buffer.indexOf("{");
              let end = buffer.indexOf("}", start); // Ensure this is after the start
              if (start !== -1 && end !== -1) {
                // Extract the complete JSON object from the buffer
                const jsonChunk = buffer.slice(start, end + 1);
                buffer = buffer.slice(end + 1); // Keep the remaining buffer for the next chunk

                try {
                  const parsedData = JSON.parse(jsonChunk); // Try parsing the extracted JSON
                  const answer = parsedData.answer;

                  // Update the chat history with the new response
                  setChatHistory((chatHistory) => {
                    const updatedChatHistory = [...chatHistory];
                    const lastEntryIndex = updatedChatHistory.length - 1;

                    if (lastEntryIndex >= 0) {
                      updatedChatHistory[lastEntryIndex] = {
                        ...updatedChatHistory[lastEntryIndex],
                        response:
                          updatedChatHistory[lastEntryIndex].response + answer,
                      };
                    }

                    return updatedChatHistory;
                  });

                  setResponse((prev) => prev + answer);

                  // Scroll to the bottom of the chat history
                  if (endOfMessagesRef.current) {
                    endOfMessagesRef.current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }
                } catch (error) {
                  console.error("Error parsing JSON chunk:", error);
                  console.log("Chunk content:", jsonChunk);
                  // Continue reading the stream
                }
              } else {
                // No more complete JSON objects in the buffer; break out of the loop
                break;
              }
            }
          }
        }

        setLoading(false);
        sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
      };

      readStream();
    } catch (error) {
      console.error("Error fetching or reading stream:", error);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAskClick();
    }
  };

  const handleBackClick = () => {
    navigate("/search", { state: { data, searchTerm } });
  };
  // const handleNavigationClick = (section) => {
  //   setActiveSection(section);
  // };

  const boldTerm = (text) => {
    if (typeof text !== "string") {
      return JSON.stringify(text);
    }

    if (!searchTerm) return text;

    // Create a regex to find the search term
    const regex = new RegExp(`(${searchTerm})`, "gi");

    // Replace the search term in the text with markdown bold syntax
    return text.replace(regex, "**$1**"); // Wrap the matched term with markdown bold syntax
  };

  const handleAnnotate = () => {
    if (openAnnotate) {
      setOpenAnnotate(false);
    } else {
      setOpenAnnotate(true);
      setOpenNotes(false);
    }
  };
  const handleNotes = () => {
    if (openNotes) {
      setOpenNotes(false);
    } else {
      setOpenAnnotate(false);
      setOpenNotes(true);
    }
  };
  // Dynamically render the nested content in order, removing numbers, and using keys as side headings
  // Dynamically render the nested content in order, removing numbers, and using keys as side headings

  // Helper function to capitalize the first letter of each word
  // Helper function to capitalize the first letter of each word
  const capitalizeFirstLetter = (text) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const capitalize = (text) => {
    if (!text) return text; // Return if the text is empty
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const MyMarkdownComponent = ({ markdownContent }) => {
    return (
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]} // Enables HTML parsing
      >
        {markdownContent}
      </ReactMarkdown>
    );
  };
  const renderContentInOrder = (content, isAbstract = false) => {
    const sortedKeys = Object.keys(content).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    return sortedKeys.map((sectionKey) => {
      const sectionData = content[sectionKey];

      // Remove numbers from the section key
      const cleanedSectionKey = sectionKey.replace(/^\d+[:.]?\s*/, "");

      // Handle the case where the key is 'paragraph'
      if (cleanedSectionKey.toLowerCase() === "paragraph") {
        // Check if sectionData is a string, if not convert to string
        const textContent =
          typeof sectionData === "string"
            ? sectionData
            : JSON.stringify(sectionData);
        const boldtextContent = boldTerm(textContent);
        return (
          <div key={sectionKey} style={{ marginBottom: "10px" }}>
            {/* Display only the value without the key */}
            <MyMarkdownComponent markdownContent={boldtextContent} />
          </div>
        );
      }

      // Handle the case where the key is 'keywords'
      if (cleanedSectionKey.toLowerCase() === "keywords") {
        // If sectionData is an array, join the keywords into a single line
        let keywords = Array.isArray(sectionData)
          ? sectionData.join(", ")
          : sectionData;
        // Capitalize the first letter of each word in the keywords
        keywords = capitalizeFirstLetter(keywords);
        const boldKeywords = boldTerm(keywords);

        return (
          <div key={sectionKey} style={{ marginBottom: "10px" }}>
            {/* Display the key as "Keywords" and the inline keywords */}
            <Typography variant="h6" style={{ marginBottom: "2%" }}>
              Keywords
            </Typography>
            <Typography variant="body1">{boldKeywords}</Typography>
          </div>
        );
      }

      if (typeof sectionData === "object") {
        // Recursively handle nested content
        return (
          <div key={sectionKey} style={{ marginBottom: "20px" }}>
            {/* Display the key only if it's not 'paragraph' */}
            <Typography variant="h6" style={{ marginBottom: "2%" }}>
              {capitalizeFirstLetter(cleanedSectionKey)}
            </Typography>
            {renderContentInOrder(sectionData)}
          </div>
        );
      } else {
        // Handle string content and apply boldTerm
        const textContent =
          typeof sectionData === "string"
            ? sectionData
            : JSON.stringify(sectionData);
        const boldtextContent = boldTerm(textContent);
        return (
          <div key={sectionKey} style={{ marginBottom: "10px" }}>
            {/* Display the key and its associated value */}
            <Typography variant="h6" style={{ marginBottom: "2%" }}>
              {capitalizeFirstLetter(cleanedSectionKey)}
            </Typography>
            <MyMarkdownComponent markdownContent={boldtextContent} />
          </div>
        );
      }
    });
  };

  const getHistoryTitles = () => {
    let storedHistory = JSON.parse(localStorage.getItem("history")) || {};
    // Return the stored history as an array of {pmid, title} objects
    return storedHistory;
  };

  // const getHistoryTitles = () => {
  //   let storedHistory = JSON.parse(localStorage.getItem("history")) || [];
  //   return storedHistory; // No need to reverse, latest items are already at the top
  // };

  return (
    <>
      <div className="container">
        <header className="header">
          <div className="logo" style={{ margin: "20px 0" }}>
            <a href="/">
              <img
                href="/"
                src="https://www.infersol.com/wp-content/uploads/2020/02/logo.png"
                alt="Infer Logo"
              />
            </a>
          </div>
          <div className="auth-buttons" style={{ margin: "20px 26px 20px 0" }}>
            <button className="signup">Sign up</button>
            <button className="login">Login</button>
          </div>
        </header>
        <div className="content">
          <div className="history-pagination">
            <h5>Recent Interactions</h5>
            <ul>
              {localStorage.getItem("history")
                ? getHistoryTitles().map((item) => (
                    <li key={item.pmid}>
                      <a href="#history">
                        {capitalize(item.title.slice(0, 35))}
                        {item.title.length > 35 ? "..." : ""}
                      </a>
                    </li>
                  ))
                : ""}
            </ul>
          </div>

          {articleData ? (
            <div className="article-content" ref={contentRef}>
              <div className="article-title">
                <div
                  style={{
                    display: "flex",
                    cursor: "pointer",
                    marginTop: "1%",
                  }}
                  onClick={handleBackClick}
                >
                  <img
                    src={Arrow}
                    style={{ width: "1.5%" }}
                    alt="Back-logo"
                  ></img>
                  <button className="back-button">Back</button>
                </div>

                <p style={{ marginTop: "0", marginBottom: "0" }}>
                  {articleData.article_title}
                </p>
              </div>
              <div className="meta" onMouseUp={handleMouseUp}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: "14px",
                    color: "grey",
                    marginBottom: "5px",
                    gap: "10px",
                    position: "relative",
                  }}
                >
                  <span>
                    Publication Type :
                    <strong style={{ color: "black" }}>
                      {articleData.publication_type.join(", ")}
                    </strong>
                  </span>
                  <span style={{ color: "#2b9247" }}>
                    PMID : {articleData.pmid}
                  </span>
                </div>

                {articleData.abstract_content && (
                  <>
                    <Typography
                      variant="h4"
                      gutterBottom
                      style={{
                        fontSize: "20px",
                        marginBottom: "2% ",
                        marginTop: "2%",
                      }}
                    >
                      Abstract
                    </Typography>
                    {renderContentInOrder(articleData.abstract_content, true)}
                  </>
                )}
                {/* <div className="content-brake"></div>  */}
                {articleData.body_content &&
                  renderContentInOrder(articleData.body_content)}

                {showStreamingSection && (
                  <div className="streaming-section">
                    <div className="streaming-content">
                      {chatHistory.map((chat, index) => (
                        <div key={index}>
                          <div className="query-asked">
                            <span>{chat.query}</span>
                          </div>

                          <div
                            className="response"
                            style={{ textAlign: "left" }}
                          >
                            <ReactMarkdown>{chat.response}</ReactMarkdown>
                            <div ref={endOfMessagesRef} />
                          </div>
                        </div>
                      ))}
                      {/* This div will act as the reference for scrolling */}
                    </div>
                  </div>
                )}
                {showPopup && (
                  <div
                    className="Popup"
                    style={{
                      position: "absolute",
                      top: popupPosition.y + 10,
                      left: popupPosition.x + 10,
                      backgroundColor: "#f1f1f1",
                      gridTemplateColumns: "1fr",
                    }}
                  >
                    <button
                      onClick={() => setShowPopup(false)}
                      className="Popup-buttons"
                    >
                      <IoSaveOutline fontSize={"20px"} color="#1A82ff" />
                      <span style={{ color: "#1A82FF" }}>Save to notes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="data-not-found">
              <p>Data not found for the given PMID</p>
            </div>
          )}

          <div className="right-aside">
            {openAnnotate && (
              <div className="search-annotate">
                <Annotation
                  openAnnotate={openAnnotate}
                  annotateData={annotateData}
                />
              </div>
            )}
            {openNotes && (
              <div className="notes notes--container">
                <NotesManager />
              </div>
            )}
            <div className="icons-group">
              <div
                className={`search-annotate-icon ${
                  openAnnotate ? "open" : "closed"
                } ${annotateData && annotateData.length > 0 ? "" : "disabled"}`}
                onClick={
                  annotateData && annotateData.length > 0
                    ? handleAnnotate
                    : null
                }
                style={{
                  cursor:
                    annotateData && annotateData.length > 0
                      ? "pointer"
                      : "not-allowed",
                  opacity: annotateData && annotateData.length > 0 ? 1 : 1, // Adjust visibility when disabled
                }}
              >
                <img src={annotate} alt="annotate-icon" />
              </div>
              <div
                className={`notes-icon ${openNotes ? "open" : "closed"}`}
                onClick={() => {
                  handleNotes();
                  // handleResize();
                }}
              >
                <img src={notesicon} alt="notes-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="stream-input" style={{ width: contentWidth }}>
        <img src={flag} alt="flag-logo" className="stream-flag-logo" />
        <input
          type="text"
          placeholder="Ask anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleAskClick} style={{ width: "6%" }}>
          {loading ? (
            <CircularProgress size={24} color="white" />
          ) : (
            <FontAwesomeIcon icon={faTelegram} size={"xl"} />
          )}
        </button>
      </div>
    </>
  );
};

export default ArticlePage;

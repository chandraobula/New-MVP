import React, { useState } from "react";

// Sample color data
const colorData = [
  {
    id: "color-yellow",
    colorBody: "#FFEA00",
  },
  {
    id: "color-green",
    colorHeader: "#AFDA9F",
    colorBody: "#BCDEAF",
  },
  {
    id: "color-blue",
    colorHeader: "#9BD1DE",
    colorBody: "#A6DCE9",
  },
  {
    id: "color-purple",
    colorBody: "#D6C1E5",
  },
  {
    id: "color-orange",
    colorBody: "#FFB74D",
  },
  {
    id: "color-pink",
    colorBody: "#D6C1E5",
  },
];

const Colors = () => {
  const [color, setColor] = useState("");
  const handleColor = () => {
    setColor(color);
  };
  return (
    <div
      className="colors-container"
      style={{ display: "flex", flexWrap: "wrap" }}
    >
      {colorData.map((color) => (
        <div
          key={color.id}
          className="color-box"
          onClick={handleColor}
          style={{
            backgroundColor: color.colorBody,
            border: `2px solid ${color.colorHeader || "transparent"}`, // Default border if no header color
            borderRadius: "1px",
            height: "55px", // Sticky note size
            width: "53px", // Sticky note size
            margin: "1px",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          <h4
            style={{
              margin: "0",
              position: "absolute",
              color: "#18181A", // Default text color
              opacity: "0",
              transition: "opacity 0.3s",
            }}
          >
            {color.id}
          </h4>
        </div>
      ))}
    </div>
  );
};

export default Colors;

import React from "react";
import "../styles/Row.scss";

const Row = ({ word }) => {
  return (
    <div className="row">
      {word.split("").map((letter, index) => {
        return (
          <div key={index} className="letter">
            {letter}
            <div className="back">{letter}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Row;

import React from "react";
import "../styles/Row.scss";

const Row = ({
  word,
  markAsSolution,
  markPresentAndAbsentLetters,
  solution,
  bounceOnError,
}) => {
  return (
    <div className={`row ${bounceOnError && "row--bounce"}`}>
      {word.split("").map((letter, index) => {
        let bgClass = "";

        if (markAsSolution) {
          bgClass = "correct";
        } else if (markPresentAndAbsentLetters) {
          if (solution[index] === letter) {
            bgClass = "correct";
          } else if (solution.includes(letter)) {
            bgClass = "present";
          } else {
            bgClass = "absent";
          }
        }

        return (
          <div
            key={index}
            className={`letter ${
              markAsSolution && `correct rotate--${index + 1}00`
            } ${
              markPresentAndAbsentLetters && `${bgClass} rotate--${index + 1}00`
            } ${letter !== " " && "letter--active"}`}
          >
            {letter}
            <div className="back">{letter}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Row;

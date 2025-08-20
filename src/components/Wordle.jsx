import React from "react";
import { useState, useRef, useEffect } from "react";
import "../styles/Wordle.scss";
import Row from "./Row";
import Keyboard from "./Keyboard";

const SOLUTION = "react";

const Wordle = () => {
  const [guesses, setGuesses] = useState([
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
  ]);

  const wordleRef = useRef();

  useEffect(() => {
    wordleRef.current.focus();
  }, []);

  const handleKeyDown = () => {};

  return (
    <div
      className="wordle"
      ref={wordleRef}
      tabIndex="0"
      onBlur={(e) => {
        e.target.focus();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="title">Wordle</div>
      <div className="notifications"></div>
      {guesses.map((guess, index) => {
        return <Row key={index} word={guess} />;
      })}
    </div>
  );
};

export default Wordle;

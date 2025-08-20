import React from "react";
import { useState, useRef, useEffect } from "react";
import "../styles/Wordle.scss";
import Row from "./Row";
import Keyboard from "./Keyboard";
import { LETTERS, potentialWords } from "../data/LettersWords";

const SOLUTION = potentialWords[Math.floor(Math.random() * potentialWords.length)];

const Wordle = () => {
  const [guesses, setGuesses] = useState([
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
    "     ",
  ]);

  const [solutionFound, setSolutionFound] = useState(false);
  const [activeLetterIndex, setActiveLetterIndex] = useState(0);
  const [notification, setNotification] = useState("");
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [failedGuesses, setFailedGuesses] = useState([]);
  const [correctLetters, setCorrectLetters] = useState([]);
  const [presentLetters, setPresentLetters] = useState([]);
  const [absentLetters, setAbsentLetters] = useState([]);

  const wordleRef = useRef();

  useEffect(() => {
    wordleRef.current.focus();
  }, []);

  const typeLetter = (letter) => {
    if (activeLetterIndex < 5) {
      setNotification("");

      let newGuesses = [...guesses];
      newGuesses[activeRowIndex] = replaceCharacter(
        newGuesses[activeRowIndex],
        activeLetterIndex,
        letter
      );

      setGuesses(newGuesses);
      setActiveLetterIndex((index) => index + 1);
    }
  };

  const replaceCharacter = (string, index, replacement) => {
    return (
      string.slice(0, index) +
      replacement +
      string.slice(index + replacement.length)
    );
  };

  const hitEnter = () => {
    if (activeLetterIndex === 5) {
      const currentGuess = guesses[activeRowIndex];

      if (!potentialWords.includes(currentGuess)) {
        setNotification("Not a valid word");
        return;
      } else if (failedGuesses.includes(currentGuess)) {
        setNotification("You already tried this word");
        return;
      } else if (currentGuess === SOLUTION) {
        setSolutionFound(true);
        setNotification("WELL DONE");
        setCorrectLetters([...SOLUTION]);
      } else {
        let correctLetters = [];

        [...currentGuess].forEach((letter, index) => {
          if (SOLUTION[index] === letter) correctLetters.push(letter);
        });

        setCorrectLetters([...new Set(correctLetters)]);

        setPresentLetters([
          ...new Set([
            ...presentLetters,
            ...[...currentGuess].filter((letter) => {
              SOLUTION.includes(letter);
            }),
          ]),
        ]);

        setAbsentLetters([
          ...new Set([
            ...absentLetters,
            ...[...currentGuess].filter((letter) => {
              !SOLUTION.includes(letter);
            }),
          ]),
        ]);

        setFailedGuesses([...failedGuesses, currentGuess]);
        setActiveRowIndex((index) => index + 1);
        setActiveLetterIndex(0);
      }
    } else {
      setNotification("You need to type 5 letters");
    }
  };

  const hitBackspace = () => {
    setNotification("");

    if (guesses[activeRowIndex][0] !== " ") {
      const newGuesses = [...guesses];

      newGuesses[activeRowIndex] = replaceCharacter(
        newGuesses[activeRowIndex],
        activeLetterIndex - 1,
        " "
      );
      setGuesses(newGuesses);
      setActiveLetterIndex((index) => index - 1 );
    }
  };

  const handleKeyDown = (event) => {
    if (solutionFound) return;
    if (LETTERS.includes(event.key)) {
      typeLetter(event.key);
    }

    if (event.key === "Enter") {
      hitEnter();
      return;
    }

    if (event.key === "Backspace") {
      hitBackspace();
    }
  };

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
      <div
        className={`notifications ${solutionFound && "notification--green"}`}
      >
        {notification}
      </div>
      {guesses.map((guess, index) => {
        return (
          <Row
            key={index}
            word={guess}
            applyRotation={activeRowIndex> index||(solutionFound&&activeRowIndex === index)}
            solution={SOLUTION}
            bounceOnError={
              notification !== "WELL DONE" &&
              notification !== "" &&
              activeRowIndex === index
            }
          />
        );
      })}
      <Keyboard
        typeLetter={typeLetter}
        hitEnter={hitEnter}
        hitBackspace={hitBackspace}
        activeLetterIndex={activeLetterIndex}
        correctLetters={correctLetters}
        presentLetters={presentLetters}
        absentLetters={absentLetters}
      />
    </div>
  );
};

export default Wordle;

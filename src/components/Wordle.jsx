import React from "react";
import { useState, useRef, useEffect } from "react";
import "../styles/Wordle.scss";
import Row from "./Row";
import Keyboard from "./Keyboard";
import { LETTERS, potentialWords } from "../data/LettersWords";

const Wordle = () => {
  // Check for saved game first
  const getSavedGame = () => {
    const saved = localStorage.getItem("wordleGame");
    return saved ? JSON.parse(saved) : null;
  };

  const savedGame = getSavedGame();

  const [solution] = useState(
    () =>
      savedGame?.solution ||
      potentialWords[Math.floor(Math.random() * potentialWords.length)]
  );

  const [guesses, setGuesses] = useState(
    savedGame?.guesses || ["     ", "     ", "     ", "     ", "     ", "     "]
  );

  const [solutionFound, setSolutionFound] = useState(false);
  const [gameOver, setGameOver] = useState(false);
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
      } else if (currentGuess === solution) {
        setSolutionFound(true);
        setNotification("WELL DONE");
        setCorrectLetters([...solution]);
      } else {
        let newCorrectLetters = [];
        let newPresentLetters = [];
        let newAbsentLetters = [];

        [...currentGuess].forEach((letter, index) => {
          if (solution[index] === letter) {
            // Letter is in correct position
            newCorrectLetters.push(letter);
          } else if (solution.includes(letter)) {
            // Letter is in solution but wrong position
            newPresentLetters.push(letter);
          } else {
            // Letter is not in solution
            newAbsentLetters.push(letter);
          }
        });

        setCorrectLetters([
          ...new Set([...correctLetters, ...newCorrectLetters]),
        ]);
        setPresentLetters([
          ...new Set([...presentLetters, ...newPresentLetters]),
        ]);
        setAbsentLetters([...new Set([...absentLetters, ...newAbsentLetters])]);

        setFailedGuesses([...failedGuesses, currentGuess]);
        setActiveRowIndex((index) => index + 1);
        setActiveLetterIndex(0);

        // Check if this was the last attempt
        if (activeRowIndex === 5) {
          setGameOver(true);
          setNotification(`The answer was: ${solution.toUpperCase()}`);
        }
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
      setActiveLetterIndex((index) => index - 1);
    }
  };

  const handleKeyDown = (event) => {
    if (solutionFound || gameOver) return;
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

  useEffect(() => {
    if (!solutionFound && !gameOver) {
      const gameData = {
        solution,
        guesses,
        solutionFound,
        gameOver,
        activeLetterIndex,
        notification,
        activeRowIndex,
        failedGuesses,
        correctLetters,
        presentLetters,
        absentLetters,
      };
      localStorage.setItem("wordleGame", JSON.stringify(gameData));
    }
  }, [
    solution,
    guesses,
    solutionFound,
    gameOver,
    activeLetterIndex,
    notification,
    activeRowIndex,
    failedGuesses,
    correctLetters,
    presentLetters,
    absentLetters,
  ]);

  const startNewGame = () => {
    localStorage.removeItem("wordleGame");
    window.location.reload();
  };
  const resetGame = () => {
    localStorage.removeItem("wordleGame");
    window.location.reload();
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
            applyRotation={
              activeRowIndex > index ||
              (solutionFound && activeRowIndex === index)
            }
            solution={solution}
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
      {solutionFound || gameOver ? (
        <button className="next-game-btn" onClick={startNewGame}>
          Next Game
        </button>
      ) : (
        <button className="next-game-btn" onClick={resetGame}>
          Reset
        </button>
      )}
    </div>
  );
};

export default Wordle;

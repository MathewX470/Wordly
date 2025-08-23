import React from "react";
import { useState, useRef, useEffect } from "react";
import "../styles/Wordle.scss";
import Row from "./Row";
import Keyboard from "./Keyboard";
import { LETTERS, potentialWords } from "../data/LettersWords";

// Simple hash function to obfuscate the solution
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// Simple unhash function (reverse the process)
const unhashString = (hashedStr) => {
  // This is a simplified approach - in a real app you'd use proper encryption
  const hash = parseInt(hashedStr, 36);
  let result = "";
  let tempHash = hash;

  // Try to find matching words from our word list
  for (const word of potentialWords) {
    if (hashString(word) === hashedStr) {
      return word;
    }
  }
  return null;
};

// Stats Modal Component
const StatsModal = ({
  isOpen,
  stats,
  onPlayAgain,
  onResetStats,
  solution,
  isWin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="stats-modal">
        <div className="modal-header">
          <h2>Statistics</h2>
          <div className="solution-display">
            <div className="solution-label">The word was:</div>
            <div className="solution-word">{solution.toUpperCase()}</div>
          </div>
        </div>{" "}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{stats.gamesPlayed}</div>
            <div className="stat-label">Played</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.winPercentage}</div>
            <div className="stat-label">Win %</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.currentStreak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.maxStreak}</div>
            <div className="stat-label">Max Streak</div>
          </div>
        </div>
        <div className="guess-distribution">
          <h3>Guess Distribution</h3>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="distribution-row">
              <div className="guess-number">{num}</div>
              <div className="distribution-bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${
                      stats.gamesWon > 0
                        ? (stats.distribution[num] / stats.gamesWon) * 100
                        : 0
                    }%`,
                  }}
                >
                  {stats.distribution[num]}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-buttons">
          <button className="reset-stats-btn" onClick={onResetStats}>
            Reset Stats
          </button>
          <button className="play-again-btn" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

const Wordle = () => {
  // Helper function to initialize guesses from saved completed guesses
  const initializeGuesses = () => {
    const emptyGuesses = ["     ", "     ", "     ", "     ", "     ", "     "];
    const saved = localStorage.getItem("wordleGame");
    if (saved) {
      const savedGame = JSON.parse(saved);
      if (savedGame.completedGuesses) {
        for (let i = 0; i < savedGame.completedGuesses.length && i < 6; i++) {
          emptyGuesses[i] = savedGame.completedGuesses[i];
        }
      }
    }
    return emptyGuesses;
  };

  // Check for saved game first
  const getSavedGame = () => {
    const saved = localStorage.getItem("wordleGame");
    if (saved) {
      const savedGame = JSON.parse(saved);
      // If we have a hashed solution, unhash it
      if (savedGame.hashedSolution) {
        savedGame.solution = unhashString(savedGame.hashedSolution);
        delete savedGame.hashedSolution; // Remove the hashed version from memory
      }
      return savedGame;
    }
    return null;
  };

  const savedGame = getSavedGame();

  // Initialize stats
  const getInitialStats = () => {
    const savedStats = localStorage.getItem("wordleStats");
    return savedStats
      ? JSON.parse(savedStats)
      : {
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0,
          currentStreak: 0,
          maxStreak: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        };
  };

  const [solution] = useState(
    () =>
      savedGame?.solution ||
      potentialWords[Math.floor(Math.random() * potentialWords.length)]
  );

  const [guesses, setGuesses] = useState(initializeGuesses());

  const [solutionFound, setSolutionFound] = useState(
    savedGame?.solutionFound || false
  );
  const [gameOver, setGameOver] = useState(savedGame?.gameOver || false);
  const [activeLetterIndex, setActiveLetterIndex] = useState(0);
  const [notification, setNotification] = useState(
    savedGame?.notification || ""
  );
  const [activeRowIndex, setActiveRowIndex] = useState(
    savedGame?.activeRowIndex || 0
  );
  const [failedGuesses, setFailedGuesses] = useState(
    savedGame?.failedGuesses || []
  );
  const [correctLetters, setCorrectLetters] = useState(
    savedGame?.correctLetters || []
  );
  const [presentLetters, setPresentLetters] = useState(
    savedGame?.presentLetters || []
  );
  const [absentLetters, setAbsentLetters] = useState(
    savedGame?.absentLetters || []
  );

  // Stats and Modal states
  const [gameStats, setGameStats] = useState(getInitialStats());
  const [showStatsModal, setShowStatsModal] = useState(
    savedGame?.showStatsModal || false
  );

  const wordleRef = useRef();

  useEffect(() => {
    wordleRef.current.focus();
  }, []);

  // Save game state function - only saves completed guesses with hashed solution
  const saveGameState = (showModal = false) => {
    const completedGuesses = guesses.filter((guess) => !guess.includes(" "));
    const gameData = {
      hashedSolution: hashString(solution), // Store hashed version instead of plain text
      completedGuesses,
      activeRowIndex: completedGuesses.length,
      solutionFound,
      gameOver,
      correctLetters,
      presentLetters,
      absentLetters,
      failedGuesses,
      notification,
      showStatsModal: showModal,
    };
    localStorage.setItem("wordleGame", JSON.stringify(gameData));
  };

  // Update stats when game is won
  const updateStatsOnWin = (currentStats, guessNumber) => {
    const newStats = { ...currentStats };
    newStats.gamesPlayed += 1;
    newStats.gamesWon += 1;
    newStats.currentStreak += 1;
    newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
    newStats.winPercentage = Math.round(
      (newStats.gamesWon / newStats.gamesPlayed) * 100
    );
    newStats.distribution[guessNumber] += 1;
    return newStats;
  };

  // Update stats when game is lost
  const updateStatsOnLoss = (currentStats) => {
    const newStats = { ...currentStats };
    newStats.gamesPlayed += 1;
    newStats.currentStreak = 0;
    newStats.winPercentage = Math.round(
      (newStats.gamesWon / newStats.gamesPlayed) * 100
    );
    return newStats;
  };

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
        setNotification(""); // Clear notification
        setCorrectLetters([...solution]);

        // Update stats and show modal
        const newStats = updateStatsOnWin(gameStats, activeRowIndex + 1);
        setGameStats(newStats);
        localStorage.setItem("wordleStats", JSON.stringify(newStats));
        setShowStatsModal(true);
        saveGameState(true);
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
        saveGameState();

        // Check if this was the last attempt
        if (activeRowIndex === 5) {
          setGameOver(true);
          setNotification(""); // Clear notification

          // Update stats for loss and show modal
          const newStats = updateStatsOnLoss(gameStats);
          setGameStats(newStats);
          localStorage.setItem("wordleStats", JSON.stringify(newStats));
          setShowStatsModal(true);
          saveGameState(true);
        }
      }
    } else {
      setNotification("You need to type 5 letters");
    }
  };

  const hitBackspace = () => {
    setNotification("");

    if (activeLetterIndex > 0) {
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

  const handlePlayAgain = () => {
    localStorage.removeItem("wordleGame");
    window.location.reload();
  };

  const handleResetStats = () => {
    const resetStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      winPercentage: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };
    setGameStats(resetStats);
    localStorage.setItem("wordleStats", JSON.stringify(resetStats));
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
      <div className="title">Wordly</div>
      {!showStatsModal && (
        <div
          className={`notifications ${solutionFound && "notification--green"}`}
        >
          {notification}
        </div>
      )}
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

      <StatsModal
        isOpen={showStatsModal}
        stats={gameStats}
        onPlayAgain={handlePlayAgain}
        onResetStats={handleResetStats}
        solution={solution}
        isWin={solutionFound}
      />
    </div>
  );
};

export default Wordle;

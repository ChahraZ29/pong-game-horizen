(() => {
  const STATE = { gameWallet: null, game: null };

  const UI = (() => {
    function hideElement(selector) {
      const el = document.getElementById(selector);
      el.classList.add("hidden");
    }

    function displayElement(selector) {
      const el = document.getElementById(selector);
      el.classList.remove("hidden");
    }

    function updateResult(result) {
      document.getElementById("result").textContent = result;
    }

    return {
      hideGameForm() {
        hideElement("game-form-container");
      },
      displayGameForm() {
        displayElement("game-form-container");
      },

      hideGameContainer() {
        hideElement("game-container");
      },
      displayGameContainer() {
        displayElement("game-container");
      },

      hidePaymentContainer() {
        hideElement("payment-container");
      },
      displayPaymentContainer() {
        displayElement("payment-container");
      },

      hideResultsContainer() {
        hideElement("results-container");
      },
      displayResultsContainer() {
        displayElement("results-container");
      },

      displayResultsContainer() {
        displayElement("results-container");
      },

      displayWin() {
        updateResult("Congratulations!!!");
        displayElement("prize-form");
      },
      displayLoss() {
        updateResult("Sorry, you lost!");
        hideElement("prize-form");
      },

      start() {
        const startGameButton = document.getElementById("start-game-button");
        const checkPaymentButton = document.getElementById(
          "check-payment-button"
        );
        const redeemPrizeButton = document.getElementById(
          "redeem-prize-button"
        );

        startGameButton.addEventListener("click", async event => {
          event.preventDefault();

          const gameWallet = await API.createWallet();
          const paymentInstructionsEl = document.getElementById(
            "payment-instructions"
          );
          const paymentStatusEl = document.getElementById("payment-status");

          UI.displayPaymentContainer();
          UI.hideResultsContainer();
          UI.hideGameContainer();
          UI.hideGameForm();

          const registeredGame = await API.createGame(gameWallet);
          STATE.game = registeredGame;

          paymentInstructionsEl.textContent = `Please transfer X Zens to ${gameWallet} and provide your wallet address!`;
        });

        checkPaymentButton.addEventListener("click", async event => {
          event.preventDefault();
          const playerWalletInputEl = document.getElementById(
            "player-wallet-input"
          );
          const playerWallet = playerWalletInputEl.value;
          const gameWallet = await API.createWallet();
          const paymentStatusEl = document.getElementById("payment-status");

          await API.updateGamePlayerWallet(STATE.game.id, playerWallet);

          const watchForPayment = async gameWallet => {
            const transactions = await API.listTransactions(
              gameWallet,
              STATE.game.id
            );
            console.log({ transactions });
            const hasPaid = !!transactions.length; // TODO: THIS IS NOT SAFE! Check if there is a more reliable way to check this

            if (hasPaid) {
              paymentStatusEl.textContent = "We will start the game soon.";

              setTimeout(() => {
                UI.displayGameContainer();
                UI.hidePaymentContainer();
                startGame(gameWallet);
              }, 1000);
              return hasPaid;
            } else {
              paymentStatusEl.textContent = "Waiting for payment";
              setTimeout(() => watchForPayment(gameWallet), 5000);
            }
          };

          watchForPayment(playerWallet);
        });

        redeemPrizeButton.addEventListener("click", async event => {
          event.preventDefault();
          const playerWalletInputEl = document.getElementById(
            "prize-wallet-input"
          );
          const playerWallet = playerWalletInputEl.value;

          API.updateGamePlayerWallet(STATE.game.id, playerWallet);
        });
      }
    };
  })();

  async function finishGame() {
    UI.hideGameContainer();

    const hasWon = STATE.game.result === 0;
    if (hasWon) {
      UI.displayWin();
    } else {
      UI.displayLoss();
    }

    UI.displayResultsContainer();
  }

  async function startGame(gameWallet) {
    var size = document.getElementById("size");
    var sound = document.getElementById("sound");

    var pong = Game.start("game", Pong, {
      sound: sound && sound.checked,
      eventHandlers: {
        end: async (message, { winner }) => {
          const updatedGame = await API.updateGameResult(
            STATE.game.id,
            gameWallet,
            winner
          );

          STATE.game = updatedGame;

          finishGame();
        }
      }
    });

    Game.addEvent(sound, "change", function() {
      pong.enableSound(sound.checked);
    });
  }

  function ready(fn) {
    if (document.readyState != "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(() => {
    UI.start();
  });
})();

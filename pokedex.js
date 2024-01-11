/**
 * Jun Nguyen
 * November 7, 2020
 * CSE 154 AB AU20 - Austin Jenchi
 *
 * This is the script for the pokedex.
 * It records the Pokemon that the player has defeated in the Pokedex, and allows the player to
 * use those Pokemon in battle. Shows the player each Pokemon's stats when they want to use it.
 */

"use strict";
(function() {
  const BASE_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const POKEDEX = "pokedex.php";
  const GAME = "game.php";
  const SPRITE = "sprites/";

  let selectedPokemon;
  let guid;
  let pid;
  let hp;

  window.addEventListener("load", init);

  /**
   * Runs on page load. Allows the player to initialize the game, end the game, or run away.
   */
  function init() {
    getPokemonImage();
    id("start-btn").addEventListener("click", showGame);
    id("start-btn").addEventListener("click", startGame);
    id("endgame").addEventListener("click", endgame);
    id("flee-btn").addEventListener("click", flee);
  }

  /**
   * Gets the sprite image of each pokemon in the pokedex.
   */
  function getPokemonImage() {
    let pokemonURL = BASE_URL + POKEDEX + "?pokedex=all";
    fetchText(pokemonURL, pokedex);
  }

  /**
   * Populates the pokedex with pokemon. Shows which pokemon is found and allows player to use
   * the three starter pokemon at the beginning.
   * @param {object} pokemon - The text containing all the pokemon in the region.
   */
  function pokedex(pokemon) {
    pokemon = pokemon.trim().split("\n");
    for (let i = 0; i < pokemon.length; i++) {
      pokemon[i] = pokemon[i].split(":")[1];
      let imageURL = BASE_URL + SPRITE + pokemon[i] + ".png";
      let image = gen("img");
      image.classList.add("sprite");
      image.src = imageURL;
      image.alt = pokemon[i];
      image.id = pokemon[i];
      id("pokedex-view").appendChild(image);
      if (pokemon[i] === "bulbasaur" || pokemon[i] === "charmander" || pokemon[i] === "squirtle") {
        image.classList.add("found");
      }
    }
    qsa(".found").forEach(element => {
      element.addEventListener("click", getPokemonData);
    });
  }

  /**
   * If a pokemon is clicked on, it gets the data for that pokemon.
   */
  function getPokemonData() {
    selectedPokemon = this.id;
    let dataURL = BASE_URL + POKEDEX + "?pokemon=" + selectedPokemon;
    fetchJSON(dataURL, showData);
  }

  /**
   * Shows the data and stats of the pokemon that is selected.
   * @param {object} pokeData - The data of the individual pokemon that was clicked on.
   */
  function showData(pokeData) {
    addDetails(pokeData, 0);
    hp = qs(".hp").textContent;
    pokemonCard(pokeData, Number("-7"), 0, 0);
    show(id("start-btn"));
  }

  /**
   * Adds the stats and details to the pokemon card. Shows image of the pokemon on the card.
   * @param {object} pokemon - The pokemon that was selected.
   * @param {number} player - The player that the pokemon was selected for.
   */
  function addDetails(pokemon, player) {
    qsa(".name")[player].textContent = pokemon.name;
    qsa(".pokepic")[player].src = BASE_URL + pokemon.images.photo;
    qsa(".type")[player].src = BASE_URL + pokemon.images.typeIcon;
    qsa(".weakness")[player].src = BASE_URL + pokemon.images.weaknessIcon;
    qsa(".hp")[player].textContent = pokemon.hp + "HP";
    qsa(".info")[player].textContent = pokemon.info.description;
  }

  /**
   * Adds the pokemon's moves to each move button with the type and damage points. Hides extra
   * move buttons if the pokemon does not have 4 moves.
   * @param {object} pokeData - The pokemon that was selected.
   * @param {number} start - The starting point in the loop.
   * @param {number} moveStart - The starting point in a nodelist for all images.
   * @param {number} dpCounter - The starting point in a nodelist for all DP values.
   */
  function pokemonCard(pokeData, start, moveStart, dpCounter) {
    let allMoves = qsa(".move");
    let allDP = qsa(".dp");
    let allTypes = qsa("img");
    let moveCount = 0;
    let moveButtons = qsa("button");
    let length = allMoves.length;

    for (let i = start; i < length - 4; i++) {
      if (moveCount === pokeData.moves.length) {
        hide(moveButtons[i + 7]);
      } else {
        show(moveButtons[i + 7]);
        allMoves[dpCounter].textContent = pokeData.moves[moveCount].name;
        if (!pokeData.moves[moveCount].dp) {
          allDP[dpCounter].textContent = "";
        } else {
          allDP[dpCounter].textContent = pokeData.moves[moveCount].dp + " DP";
        }
        allTypes[moveStart + 2].src = BASE_URL + "icons/" + pokeData.moves[moveCount].type + ".jpg";
        moveButtons[moveCount].addEventListener("click", playMove);
        moveCount++;
        moveStart++;
        dpCounter++;
      }
    }
  }

  /**
   * Shows the game once the player has selected their pokemon and clicks the start button.
   * Enables the player to use move buttons.
   */
  function showGame() {
    hide(id("p1-turn-results"));
    hide(id("pokedex-view"));
    show(id("p2"));
    show(qs(".hp-info"));
    show(id("results-container"));
    hide(id("start-btn"));
    show(id("flee-btn"));
    qs("h1").textContent = "Pokemon Battle!";

    buttonState(false);
  }

  /**
   * Starts the game. Gets a random opponent.
   */
  function startGame() {
    let params = new FormData();
    params.append("startgame", "true");
    params.append("mypokemon", selectedPokemon);
    fetchPOST(getOpponent, params);
  }

  /**
   * Gets data of the opponent that was randomly generated.
   * @param {object} initializeGame - The data for the battle.
   */
  function getOpponent(initializeGame) {
    let opponent = initializeGame.p2;
    addDetails(opponent, 1);
    pokemonCard(opponent, 0, 159, 4);
    guid = initializeGame.guid;
    pid = initializeGame.pid;
  }

  /**
   * When the player chooses a move to play, it gets information on what move the opponent plays.
   */
  function playMove() {
    let move = this.children[0].textContent;
    move = move.split(" ").join("");
    move = move.toLowerCase();
    fetchMove(guid, pid, move, getResults);
  }

  /**
   * Gets the results of the round after each player has chosen a move.
   * @param {object} game - The results of the round.
   */
  function getResults(game) {
    playerResults(game, "p1", 0);
    playerResults(game, "p2", 1);
  }

  /**
   * Creates the results of the round and displays it on the screen. Updates the health bar
   * depending on the player.
   * @param {object} game - The game's results of the round.
   * @param {string} player - The player ID, p1 or p2.
   * @param {number} playerNumber - The number of the player in an nodelist.
   */
  function playerResults(game, player, playerNumber) {
    let playerData = game[player];
    let totalHP = playerData["hp"];
    let currentHP = playerData["current-hp"];
    let move = game.results[player + "-move"];
    let result = game.results[player + "-result"];

    show(id(player + "-turn-results"));
    if (player === "p1") {
      id(player + "-turn-results").textContent = "Player 1 played ";
      updateHealth(totalHP, currentHP, playerNumber);
    }
    if (player === "p2") {
      id(player + "-turn-results").textContent = "Player 2 played ";
      updateHealth(totalHP, currentHP, playerNumber);
      hideResult(move, result);
    }
    id(player + "-turn-results").textContent += move + " and " + result + "!";
  }

  /**
   * If the opponent is defeated, it hides the result of the opponent.
   * @param {string} move - The move the opponent played.
   * @param {string} result - The result of the opponent's move.
   */
  function hideResult(move, result) {
    if (move === null || result === null) {
      hide(id("p2-turn-results"));
    }
  }

  /**
   * Updates the health bar according to the current HP. When one of the players' pokemon's health
   * bars reaches 0, it declares a winner and stops the game.
   * @param {number} totalHP - The total HP of the pokemon.
   * @param {number} currentHP - The current HP of the pokemon.
   * @param {number} player - The player number, player 1 or player 2.
   */
  function updateHealth(totalHP, currentHP, player) {
    playerHealth(player, currentHP, totalHP);

    if (currentHP <= 0) {
      declareWinner(player, currentHP);
      show(id("endgame"));
      hide(id("flee-btn"));
      buttonState(true);
    }
  }

  /**
   * Updates the health bar and HP value of the player's pokemon.
   * @param {number} player - Player 1 or player 2.
   * @param {number} playerHP - The current HP of the player.
   * @param {number} totalHP - The total HP of the player.
   */
  function playerHealth(player, playerHP, totalHP) {
    let number = player + 1;
    let currentHP = playerHP / totalHP;
    if (currentHP < 0.2) {
      qs("#p" + number + " .health-bar").classList.add("low-health");
    }

    qsa(".hp")[player].textContent = playerHP + "HP";
    qs("#p" + number + " .health-bar").style.width = currentHP * 100 + "%";
  }

  /**
   * Declares the winner when one pokemon's health bar hits 0 and changes the message
   * accordingly. If the player wins, it checks if the defeated pokemon is part of the pokedex or
   * not.
   * @param {number} player - The player's number in a nodelist.
   * @param {number} currentHP - The HP of the pokemon.
   */
  function declareWinner(player, currentHP) {
    if (player === 0 && currentHP <= 0) {
      qs("h1").textContent = "You Lost!";
    } else if (player === 1 && currentHP <= 0) {
      qs("h1").textContent = "You Won!";
      let p2Name = qs("#p2 .name").textContent.toLowerCase();
      p2Name = p2Name.split(" ").join("");
      checkFound(p2Name);
    }
  }

  /**
   * Checks if the player already has the pokemon in their pokedex. If not, then adds it to the
   * pokedex.
   * @param {string} p2 - The name of the opponent's pokemon.
   */
  function checkFound(p2) {
    let dex = qsa("img");
    let p2Pokemon = p2;
    for (let i = 7; i < dex.length - 8; i++) {
      if (dex[i].id === p2Pokemon && !dex[i].classList.contains("hidden")) {
        dex[i].classList.add("found");
        qsa(".found").forEach(element => {
          element.addEventListener("click", getPokemonData);
        });
      }
    }
  }

  /**
   * Shows the endgame when the player goes back to the pokedex. Resets the game for the next
   * match.
   */
  function endgame() {
    hide(id("endgame"));
    hide(id("results-container"));
    hide(id("p2"));
    hide(qs(".hp-info"));
    show(id("pokedex-view"));
    show(id("start-btn"));
    qs("h1").textContent = "Your Pokedex";

    resetHealthBars(0);
    resetHealthBars(1);

    qs(".hp").textContent = hp;
  }

  /**
   * Resets the health bars for the next game.
   * @param {number} player - The player's number in a nodelist.
   */
  function resetHealthBars(player) {
    qsa(".health-bar")[player].classList.remove("low-health");
    qsa(".health-bar")[player].style.width = "100%";
  }

  /**
   * If a player chooses to flee, then they automatically lose.
   */
  function flee() {
    let move = "flee";
    fetchMove(guid, pid, move, lose);
    hide(id("flee-btn"));
    show(id("endgame"));
  }

  /**
   * Displays what happens when the player flees and ends the game.
   */
  function lose() {
    id("p1-turn-results").textContent = "Player 1 played flee and lost!";
    show(id("p1-turn-results"));
    qs(".hp").textContent = 0 + "HP";
    qs(".health-bar").style.width = "0%";
    qs(".health-bar").classList.add("low-health");
    qs("h1").textContent = "You Lost!";
    buttonState(true);
    id("p2-turn-results").textContent = "";
  }

  /**
   * Disables/enables the move buttons.
   * @param {boolean} tf - True or false.
   */
  function buttonState(tf) {
    let moveButtons = qsa("button");
    for (let i = 0; i < 4; i++) {
      moveButtons[i].disabled = tf;
    }
  }

  /**
   * Helper function to hide parts of the game.
   * @param {object} object - The object to be hidden.
   */
  function hide(object) {
    object.classList.add("hidden");
  }

  /**
   * Helper function to show parts of the game.
   * @param {object} object - The object to be shown.
   */
  function show(object) {
    object.classList.remove("hidden");
  }

  /**
   * Gets the data for what happens when the player chooses a move. It shows whether the move is
   * successful or not, and how much damage it does to the opponent.
   * @param {string} uniqueID - The unique game ID.
   * @param {string} playerID - The player ID.
   * @param {string} move - The move that the player chose.
   * @param {function} process - The function that shows what happens when they chose that move.
   */
  async function fetchMove(uniqueID, playerID, move, process) {
    let params = new FormData();
    params.append("guid", uniqueID);
    params.append("pid", playerID);
    params.append("movename", move);
    let url = BASE_URL + GAME;
    show(id("loading"));

    try {
      let res = await fetch(url, {method: "POST", body: params});
      await checkStatus(res);
      res = await res.json();
      hide(id("loading"));
      process(res);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Helper function to fetch data for a POST method.
   * @param {function} process - Uses the response data.
   * @param {object} params - The key and value pairs sent to request response data.
   */
  function fetchPOST(process, params) {
    let url = BASE_URL + GAME;
    fetch(url, {method: "POST", body: params})
      .then(checkStatus)
      .then(res => res.json())
      .then(process)
      .catch(console.error);
  }

  /**
   * Helper function to fetch data and return it in text format.
   * @param {string} url - The url to fetch data from.
   * @param {function} process - Uses the response data.
   */
  function fetchText(url, process) {
    fetch(url)
      .then(checkStatus)
      .then(res => res.text())
      .then(process)
      .catch(console.error);
  }

  /**
   * Helper function to fetch data and return it in json format.
   * @param {string} url - The url to fetch data from.
   * @param {function} process - Uses the response data.
   */
  function fetchJSON(url, process) {
    fetch(url)
      .then(checkStatus)
      .then(res => res.json())
      .then(process)
      .catch(console.error);
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function checkStatus(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the DOM element with the given ID.
   * @param {string} idName - The ID to find.
   * @returns {object} DOM object associated with id (null if not found).
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {HTMLElement} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Returns a new element that is generated from the given element type.
   * @param {string} elType - HTML element type for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(elType) {
    return document.createElement(elType);
  }
})();
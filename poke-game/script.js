const gameStates = {
  turns: {
    pokemons: [],
    pokemonHP: [],
    score: { firstWins: 0, secondWins: 0, draws: 0 },
    selectedCards: [],
    turnNumber: 1,
  },
  vsIA: {
    pokemons: [],
    pokemonHP: [],
    score: { firstWins: 0, secondWins: 0, draws: 0 },
    selectedCards: [],
    turnNumber: 1,
  },
  team: {
    pokemons: [],
    pokemonHP: [],
    score: { firstWins: 0, secondWins: 0, draws: 0 },
    selectedCards: [],
    turnNumber: 1,
    player1Team: [],
    player2Team: [],
    player1HP: [],
    player2HP: [],
    currentPlayer1Index: 0,
    currentPlayer2Index: 0,
    battleStarted: false,
  },
}

let gameMode = "turns"
let currentState = gameStates[gameMode]
const revealedPokemons = new Set() // Pokémons revelats per al cercador

// DOM Elements
const getPokemonsBtn = document.getElementById("getPokemons")
const pokemonCountInput = document.getElementById("pokemonCount")
const cardsContainer = document.getElementById("cardsContainer")
const battleResult = document.getElementById("battleResult")
const loading = document.getElementById("loading")
const battleInfo = document.getElementById("battleInfo")
const attackerName = document.getElementById("attackerName")
const attackerValue = document.getElementById("attackerValue")
const defenderName = document.getElementById("defenderName")
const defenderValue = document.getElementById("defenderValue")
const scoreBoard = document.getElementById("scoreBoard")
const firstWinsEl = document.getElementById("firstWins")
const secondWinsEl = document.getElementById("secondWins")
const drawsEl = document.getElementById("draws")
const filterInput = document.getElementById("filterInput")
const cardTemplate = document.getElementById("card-template")
const attackerImg = document.getElementById("attackerImg")
const defenderImg = document.getElementById("defenderImg")
const attackerHp = document.getElementById("attackerHp")
const defenderHp = document.getElementById("defenderHp")
const attackerHpBar = document.getElementById("attackerHpBar")
const defenderHpBar = document.getElementById("defenderHpBar")
const turnNumberEl = document.getElementById("turnNumber")
const modeBtns = document.querySelectorAll(".mode-btn")
const resetScoreBtn = document.getElementById("resetScore")
const saveScoreBtn = document.getElementById("saveScore")
const loadScoreBtn = document.getElementById("loadScore")

const teamBattleContainer = document.getElementById("teamBattle")
const player1CardsEl = document.getElementById("player1Cards")
const player2CardsEl = document.getElementById("player2Cards")
const startTeamBattleBtn = document.getElementById("startTeamBattle")
const descTurns = document.getElementById("desc-turns")
const descVsIA = document.getElementById("desc-vsIA")
const descTeam = document.getElementById("desc-team")

// Event Listeners
getPokemonsBtn.addEventListener("click", fetchPokemons)
filterInput.addEventListener("input", filterPokemons)
resetScoreBtn.addEventListener("click", resetScoreOnly)
saveScoreBtn.addEventListener("click", saveScore)
loadScoreBtn.addEventListener("click", loadScore)

startTeamBattleBtn.addEventListener("click", startTeamBattle)

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    gameMode = btn.dataset.mode
    currentState = gameStates[gameMode]
    updateModeDescription()
    switchMode()
  })
})

function switchMode() {
  resetSelection()
  battleResult.classList.add("hidden")
  battleInfo.classList.add("hidden")
  teamBattleContainer.classList.add("hidden")

  if (currentState.pokemons.length > 0) {
    displayPokemons()
    updateScoreBoard()
    scoreBoard.classList.remove("hidden")
  } else {
    cardsContainer.innerHTML = ""
    scoreBoard.classList.add("hidden")
  }

  updatePokemonCountLabel()
}

function updateModeDescription() {
  descTurns.classList.add("hidden")
  descVsIA.classList.add("hidden")
  descTeam.classList.add("hidden")

  if (gameMode === "turns") {
    descTurns.classList.remove("hidden")
  } else if (gameMode === "vsIA") {
    descVsIA.classList.remove("hidden")
  } else if (gameMode === "team") {
    descTeam.classList.remove("hidden")
  }
}

function updatePokemonCountLabel() {
  const label = document.querySelector('label[for="pokemonCount"]')
  if (gameMode === "team") {
    label.textContent = "Pokémon per jugador:"
  } else {
    label.textContent = "Nombre de Pokémon:"
  }
}

function filterPokemons() {
  const searchTerm = filterInput.value.toLowerCase().trim()

  document.querySelectorAll(".pokemon-card").forEach((card, index) => {
    const pokemon = currentState.pokemons[index]
    if (!pokemon) return

    const cardIndex = Number.parseInt(card.dataset.index)
    const isRevealed = revealedPokemons.has(`${gameMode}-${cardIndex}`)

    if (!isRevealed) {
      return // No filtrar cartes no revelades
    }

    const name = pokemon.name.toLowerCase()
    const types = pokemon.types.map((t) => t.type.name.toLowerCase())

    const matchesSearch = name.includes(searchTerm) || types.some((type) => type.includes(searchTerm))

    if (matchesSearch) {
      card.classList.remove("hidden-card")
    } else {
      card.classList.add("hidden-card")
    }
  })
}

async function fetchPokemons() {
  const count = Number.parseInt(pokemonCountInput.value) || 10

  loading.classList.remove("hidden")
  cardsContainer.innerHTML = ""
  battleResult.classList.add("hidden")
  battleInfo.classList.add("hidden")
  filterInput.value = ""
  getPokemonsBtn.disabled = true
  teamBattleContainer.classList.add("hidden")

  // Reiniciar estat de la modalitat actual
  currentState.selectedCards = []
  currentState.pokemons = []
  currentState.pokemonHP = []
  currentState.turnNumber = 1

  if (gameMode === "team") {
    currentState.player1Team = []
    currentState.player2Team = []
    currentState.player1HP = []
    currentState.player2HP = []
    currentState.currentPlayer1Index = 0
    currentState.currentPlayer2Index = 0
    currentState.battleStarted = false
  }

  try {
    const totalPokemons = gameMode === "team" ? count * 2 : count

    const usedIds = new Set()
    const randomIds = []

    while (randomIds.length < totalPokemons) {
      const id = Math.floor(Math.random() * 898) + 1
      if (!usedIds.has(id)) {
        usedIds.add(id)
        randomIds.push(id)
      }
    }

    const promises = randomIds.map((id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.json()))

    currentState.pokemons = await Promise.all(promises)
    currentState.pokemonHP = currentState.pokemons.map((p) => {
      const hp = p.stats.find((s) => s.stat.name === "hp")?.base_stat || 100
      return { current: hp, max: hp }
    })

    if (gameMode === "team") {
      const halfCount = count
      currentState.player1Team = currentState.pokemons.slice(0, halfCount)
      currentState.player2Team = currentState.pokemons.slice(halfCount)
      currentState.player1HP = currentState.pokemonHP.slice(0, halfCount)
      currentState.player2HP = currentState.pokemonHP.slice(halfCount)
      displayTeams()
    } else {
      displayPokemons()
    }
  } catch (error) {
    console.error("Error en obtenir Pokémon:", error)
    cardsContainer.innerHTML =
      '<p style="color: white; text-align: center;">Error en carregar Pokémon. Torna-ho a intentar.</p>'
  } finally {
    loading.classList.add("hidden")
    getPokemonsBtn.disabled = false
  }
}

function displayTeams() {
  teamBattleContainer.classList.remove("hidden")
  player1CardsEl.innerHTML = ""
  player2CardsEl.innerHTML = ""

  currentState.player1Team.forEach((pokemon, index) => {
    const card = createTeamPokemonCard(pokemon, index, currentState.player1HP[index])
    player1CardsEl.appendChild(card)
  })

  currentState.player2Team.forEach((pokemon, index) => {
    const card = createTeamPokemonCard(pokemon, index, currentState.player2HP[index])
    player2CardsEl.appendChild(card)
  })

  startTeamBattleBtn.classList.remove("hidden")
  scoreBoard.classList.remove("hidden")
  updateScoreBoard()
}

function createTeamPokemonCard(pokemon, index, hp) {
  const card = document.createElement("div")
  card.className = "team-pokemon-card"
  card.dataset.index = index

  const img = document.createElement("img")
  img.className = "pokemon-mini-img"
  img.src = pokemon.sprites.front_default
  img.alt = pokemon.name

  const info = document.createElement("div")
  info.className = "pokemon-mini-info"

  const name = document.createElement("div")
  name.className = "pokemon-mini-name"
  name.textContent = pokemon.name

  const hpText = document.createElement("div")
  hpText.className = "pokemon-mini-hp"
  hpText.textContent = `HP: ${hp.current} / ${hp.max}`

  const hpBarContainer = document.createElement("div")
  hpBarContainer.className = "hp-bar-mini"

  const hpBar = document.createElement("div")
  hpBar.className = "hp-fill-mini"
  hpBar.style.width = "100%"

  hpBarContainer.appendChild(hpBar)
  info.appendChild(name)
  info.appendChild(hpText)
  info.appendChild(hpBarContainer)

  card.appendChild(img)
  card.appendChild(info)

  return card
}

function startTeamBattle() {
  if (currentState.battleStarted) return

  currentState.battleStarted = true
  startTeamBattleBtn.classList.add("hidden")
  currentState.currentPlayer1Index = 0
  currentState.currentPlayer2Index = 0
  currentState.turnNumber = 1

  highlightCurrentPokemons()
  setTimeout(() => executeTeamBattle(), 1000)
}

function highlightCurrentPokemons() {
  document.querySelectorAll(".team-pokemon-card").forEach((card) => card.classList.remove("active"))

  const p1Card = player1CardsEl.querySelector(`[data-index="${currentState.currentPlayer1Index}"]`)
  const p2Card = player2CardsEl.querySelector(`[data-index="${currentState.currentPlayer2Index}"]`)

  if (p1Card) p1Card.classList.add("active")
  if (p2Card) p2Card.classList.add("active")
}

function executeTeamBattle() {
  const p1Index = currentState.currentPlayer1Index
  const p2Index = currentState.currentPlayer2Index

  if (p1Index >= currentState.player1Team.length || p2Index >= currentState.player2Team.length) {
    endTeamBattle()
    return
  }

  const attacker = currentState.player1Team[p1Index]
  const defender = currentState.player2Team[p2Index]

  const attackerAttack = attacker.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
  const defenderDefense = defender.stats.find((s) => s.stat.name === "defense")?.base_stat || 0

  const damage = Math.max(0, attackerAttack - defenderDefense)

  currentState.player2HP[p2Index].current = Math.max(0, currentState.player2HP[p2Index].current - damage)

  battleInfo.classList.remove("hidden")
  attackerName.textContent = attacker.name
  attackerValue.textContent = attackerAttack
  attackerImg.src = attacker.sprites.front_default
  defenderName.textContent = defender.name
  defenderValue.textContent = defenderDefense
  defenderImg.src = defender.sprites.front_default

  const attackerHP = currentState.player1HP[p1Index]
  const defenderHP = currentState.player2HP[p2Index]

  attackerHp.textContent = `${attackerHP.current} / ${attackerHP.max}`
  attackerHpBar.style.width = `${(attackerHP.current / attackerHP.max) * 100}%`

  defenderHp.textContent = `${defenderHP.current} / ${defenderHP.max}`
  const defenderPercentage = (defenderHP.current / defenderHP.max) * 100
  defenderHpBar.style.width = `${defenderPercentage}%`

  defenderHpBar.classList.remove("low", "medium")
  if (defenderPercentage <= 20) defenderHpBar.classList.add("low")
  else if (defenderPercentage <= 50) defenderHpBar.classList.add("medium")

  turnNumberEl.textContent = `Turn ${currentState.turnNumber}`

  battleResult.textContent = `${attacker.name} fa ${damage} de dany a ${defender.name}!`
  battleResult.classList.remove("hidden", "winner", "draw")
  battleResult.classList.add("winner")

  updateTeamCard(p2Index, false)

  if (defenderHP.current <= 0) {
    battleResult.textContent = `${attacker.name} ha derrotat ${defender.name}!`
    markAsDefeated(p2Index, false)
    currentState.currentPlayer2Index++
    currentState.score.firstWins++
    updateScoreBoard()

    setTimeout(() => {
      if (currentState.currentPlayer2Index >= currentState.player2Team.length) {
        endTeamBattle()
      } else {
        highlightCurrentPokemons()
        currentState.turnNumber++
        setTimeout(() => executeTeamBattle(), 2000)
      }
    }, 3000)
  } else {
    setTimeout(() => {
      executeTeamBattleReverse()
    }, 3000)
  }
}

function executeTeamBattleReverse() {
  const p1Index = currentState.currentPlayer1Index
  const p2Index = currentState.currentPlayer2Index

  const attacker = currentState.player2Team[p2Index]
  const defender = currentState.player1Team[p1Index]

  const attackerAttack = attacker.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
  const defenderDefense = defender.stats.find((s) => s.stat.name === "defense")?.base_stat || 0

  const damage = Math.max(0, attackerAttack - defenderDefense)

  currentState.player1HP[p1Index].current = Math.max(0, currentState.player1HP[p1Index].current - damage)

  attackerName.textContent = attacker.name
  attackerValue.textContent = attackerAttack
  attackerImg.src = attacker.sprites.front_default
  defenderName.textContent = defender.name
  defenderValue.textContent = defenderDefense
  defenderImg.src = defender.sprites.front_default

  const attackerHP = currentState.player2HP[p2Index]
  const defenderHP = currentState.player1HP[p1Index]

  attackerHp.textContent = `${attackerHP.current} / ${attackerHP.max}`
  attackerHpBar.style.width = `${(attackerHP.current / attackerHP.max) * 100}%`

  defenderHp.textContent = `${defenderHP.current} / ${defenderHP.max}`
  const defenderPercentage = (defenderHP.current / defenderHP.max) * 100
  defenderHpBar.style.width = `${defenderPercentage}%`

  defenderHpBar.classList.remove("low", "medium")
  if (defenderPercentage <= 20) defenderHpBar.classList.add("low")
  else if (defenderPercentage <= 50) defenderHpBar.classList.add("medium")

  currentState.turnNumber++
  turnNumberEl.textContent = `Turn ${currentState.turnNumber}`

  battleResult.textContent = `${attacker.name} fa ${damage} de dany a ${defender.name}!`

  updateTeamCard(p1Index, true)

  if (defenderHP.current <= 0) {
    battleResult.textContent = `${attacker.name} ha derrotat ${defender.name}!`
    markAsDefeated(p1Index, true)
    currentState.currentPlayer1Index++
    currentState.score.secondWins++
    updateScoreBoard()

    setTimeout(() => {
      if (currentState.currentPlayer1Index >= currentState.player1Team.length) {
        endTeamBattle()
      } else {
        highlightCurrentPokemons()
        currentState.turnNumber++
        setTimeout(() => executeTeamBattle(), 2000)
      }
    }, 3000)
  } else {
    setTimeout(() => {
      currentState.turnNumber++
      executeTeamBattle()
    }, 3000)
  }
}

function updateTeamCard(index, isPlayer1) {
  const container = isPlayer1 ? player1CardsEl : player2CardsEl
  const hp = isPlayer1 ? currentState.player1HP[index] : currentState.player2HP[index]
  const card = container.querySelector(`[data-index="${index}"]`)

  if (!card) return

  const hpText = card.querySelector(".pokemon-mini-hp")
  const hpBar = card.querySelector(".hp-fill-mini")

  hpText.textContent = `HP: ${hp.current} / ${hp.max}`
  const percentage = (hp.current / hp.max) * 100
  hpBar.style.width = `${percentage}%`

  hpBar.classList.remove("low", "medium")
  if (percentage <= 20) hpBar.classList.add("low")
  else if (percentage <= 50) hpBar.classList.add("medium")
}

function markAsDefeated(index, isPlayer1) {
  const container = isPlayer1 ? player1CardsEl : player2CardsEl
  const card = container.querySelector(`[data-index="${index}"]`)
  if (card) {
    card.classList.add("defeated")
    card.classList.remove("active")
  }
}

function endTeamBattle() {
  battleInfo.classList.add("hidden")

  let winner = ""
  if (currentState.currentPlayer2Index >= currentState.player2Team.length) {
    winner = "Jugador 1 ha guanyat la batalla!"
  } else if (currentState.currentPlayer1Index >= currentState.player1Team.length) {
    winner = "Jugador 2 ha guanyat la batalla!"
  }

  battleResult.textContent = winner
  battleResult.classList.add("winner")

  setTimeout(() => {
    resetTeamBattle()
  }, 5000)
}

function resetTeamBattle() {
  currentState.battleStarted = false
  currentState.currentPlayer1Index = 0
  currentState.currentPlayer2Index = 0
  currentState.turnNumber = 1

  currentState.player1HP.forEach((hp) => (hp.current = hp.max))
  currentState.player2HP.forEach((hp) => (hp.current = hp.max))

  displayTeams()
  battleResult.classList.add("hidden")
  battleInfo.classList.add("hidden")
}

function displayPokemons() {
  cardsContainer.innerHTML = ""

  currentState.pokemons.forEach((pokemon, index) => {
    const card = createPokemonCard(pokemon, index)
    cardsContainer.appendChild(card)
  })

  scoreBoard.classList.remove("hidden")
  updateScoreBoard()
}

function createPokemonCard(pokemon, index) {
  const cardClone = cardTemplate.content.cloneNode(true)
  const card = cardClone.querySelector(".pokemon-card")

  card.dataset.index = index

  const attack = pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
  const defense = pokemon.stats.find((s) => s.stat.name === "defense")?.base_stat || 0
  const speed = pokemon.stats.find((s) => s.stat.name === "speed")?.base_stat || 0
  const hp = pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100

  const types = pokemon.types.map((t) => t.type.name)

  const img = card.querySelector(".pokemon-image")
  img.src = pokemon.sprites.front_default
  img.alt = pokemon.name

  card.querySelector(".pokemon-name").textContent = pokemon.name
  card.querySelector(".hp-value").textContent = hp

  const typesContainer = card.querySelector(".pokemon-types")
  typesContainer.innerHTML = types.map((type) => `<span class="type-badge type-${type}">${type}</span>`).join("")

  card.querySelector(".stat-attack").textContent = attack
  card.querySelector(".stat-defense").textContent = defense
  card.querySelector(".stat-speed").textContent = speed

  card.addEventListener("click", () => handleCardClick(index))

  return cardClone
}

function handleCardClick(index) {
  const card = document.querySelector(`[data-index="${index}"]`)

  if (currentState.pokemonHP[index].current <= 0) return

  // Revelar carta
  if (!card.classList.contains("flipped")) {
    revealedPokemons.add(`${gameMode}-${index}`)
  }

  card.classList.toggle("flipped")

  if (currentState.selectedCards.includes(index)) {
    currentState.selectedCards = currentState.selectedCards.filter((i) => i !== index)
    card.classList.remove("selected")
    battleResult.classList.add("hidden")
    battleInfo.classList.add("hidden")
    return
  }

  if (currentState.selectedCards.length < 2) {
    currentState.selectedCards.push(index)
    card.classList.add("selected")

    if (gameMode === "vsIA" && currentState.selectedCards.length === 1) {
      setTimeout(() => {
        const availableCards = currentState.pokemons
          .map((_, i) => i)
          .filter((i) => i !== index && currentState.pokemonHP[i].current > 0)

        if (availableCards.length > 0) {
          const randomIndex = availableCards[Math.floor(Math.random() * availableCards.length)]
          const iaCard = document.querySelector(`[data-index="${randomIndex}"]`)
          revealedPokemons.add(`${gameMode}-${randomIndex}`)
          iaCard.classList.add("flipped")
          currentState.selectedCards.push(randomIndex)
          iaCard.classList.add("selected")
          setTimeout(() => startBattle(), 500)
        }
      }, 500)
    }

    if (currentState.selectedCards.length === 2 && gameMode !== "vsIA") {
      setTimeout(() => startBattle(), 500)
    }
  }
}

function startBattle() {
  const attackerIndex = currentState.selectedCards[0]
  const defenderIndex = currentState.selectedCards[1]
  const attacker = currentState.pokemons[attackerIndex]
  const defender = currentState.pokemons[defenderIndex]

  const attackerAttack = attacker.stats.find((s) => s.stat.name === "attack")?.base_stat || 0
  const defenderDefense = defender.stats.find((s) => s.stat.name === "defense")?.base_stat || 0

  const damage = Math.max(0, attackerAttack - defenderDefense)

  currentState.pokemonHP[defenderIndex].current = Math.max(0, currentState.pokemonHP[defenderIndex].current - damage)

  battleInfo.classList.remove("hidden")
  attackerName.textContent = attacker.name
  attackerValue.textContent = attackerAttack
  attackerImg.src = attacker.sprites.front_default
  defenderName.textContent = defender.name
  defenderValue.textContent = defenderDefense
  defenderImg.src = defender.sprites.front_default

  updateHPBar(attackerIndex, attackerHp, attackerHpBar)
  updateHPBar(defenderIndex, defenderHp, defenderHpBar)

  turnNumberEl.textContent = `Turn ${currentState.turnNumber}`

  let result = ""

  if (damage > 0) {
    result = `${attacker.name} fa ${damage} de dany a ${defender.name}!`
  } else {
    result = `${defender.name} bloqueja l'atac!`
  }

  battleResult.textContent = result
  battleResult.classList.remove("hidden", "winner", "draw")
  battleResult.classList.add("winner")

  if (currentState.pokemonHP[defenderIndex].current <= 0) {
    const defenderCard = document.querySelector(`[data-index="${defenderIndex}"]`)
    defenderCard.classList.add("fainted")

    currentState.score.firstWins++
    updateScoreBoard()

    battleResult.textContent = `${attacker.name} ha derrotat ${defender.name}!`

    if (gameMode === "turns" || gameMode === "vsIA") {
      setTimeout(() => {
        resetSelection()
        currentState.turnNumber = 1
      }, 3000)
    }
  } else {
    currentState.turnNumber++

    setTimeout(() => {
      if (gameMode === "turns") {
        currentState.selectedCards.reverse()
        startBattle()
      } else if (gameMode === "vsIA") {
        currentState.selectedCards.reverse()
        startBattle()
      }
    }, 3000)
  }
}

function updateHPBar(index, hpTextEl, hpBarEl) {
  const hp = currentState.pokemonHP[index]
  const percentage = (hp.current / hp.max) * 100

  hpTextEl.textContent = `${hp.current} / ${hp.max}`
  hpBarEl.style.width = `${percentage}%`

  hpBarEl.classList.remove("low", "medium")
  if (percentage <= 20) {
    hpBarEl.classList.add("low")
  } else if (percentage <= 50) {
    hpBarEl.classList.add("medium")
  }
}

function updateScoreBoard() {
  firstWinsEl.textContent = currentState.score.firstWins
  secondWinsEl.textContent = currentState.score.secondWins
  drawsEl.textContent = currentState.score.draws
}

function resetSelection() {
  currentState.selectedCards.forEach((index) => {
    const card = document.querySelector(`[data-index="${index}"]`)
    if (card) {
      card.classList.remove("selected")
    }
  })
  currentState.selectedCards = []
  battleResult.classList.add("hidden")
  battleInfo.classList.add("hidden")
}

function resetGameFull() {
  resetSelection()
  currentState.turnNumber = 1

  currentState.pokemonHP.forEach((hp, index) => {
    hp.current = hp.max
    const card = document.querySelector(`[data-index="${index}"]`)
    if (card) {
      card.classList.remove("fainted")
    }
  })
}

function resetScoreOnly() {
  currentState.score = { firstWins: 0, secondWins: 0, draws: 0 }
  updateScoreBoard()
}

function saveScore() {
  localStorage.setItem(`pokemonScore_${gameMode}`, JSON.stringify(currentState.score))
  alert("Marcador guardat!")
}

function loadScore() {
  const saved = localStorage.getItem(`pokemonScore_${gameMode}`)
  if (saved) {
    currentState.score = JSON.parse(saved)
    updateScoreBoard()
    alert("Marcador carregat!")
  } else {
    alert("No hi ha cap marcador guardat per aquesta modalitat.")
  }
}

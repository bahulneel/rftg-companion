import type { Expansions, GameScreen, PhaseId, Player } from '~/types/game'
import type { GameTransport } from '~/composables/gameTransport'
import { LOCAL_HOST_ID } from '~/composables/gameTransport'
import type { CostModifier } from '~/types/game'
import {
  canControlSession,
  canEditVp,
  canReorder,
  canSetTutorial,
  ownedPlayers,
} from '~/utils/permissions'
import { isPlayerTutorialEnabled } from '~/utils/tutorial'
import {
  getVpTiedPlayerIds,
  needsTiebreakInput,
  rankPlayers,
  shouldEndGameAfterRound,
} from '~/utils/scoring'
import { getPhaseLimit } from '~/utils/phases'
import {
  loadSavedLocalPlayers,
  maxLocalPlayerCounter,
  saveLocalPlayers,
} from '~/utils/localPlayers'

export interface PeerGameControllerOptions {
  transport: GameTransport
  peerId: Ref<string>
  isLocal?: boolean
}

function expansionsEqual(a: Expansions, b: Expansions): boolean {
  return (
    a.gatheringStorm === b.gatheringStorm
    && a.rebelVsImperium === b.rebelVsImperium
    && a.prestige === b.prestige
    && a.goals === b.goals
  )
}

export function usePeerGameController(options: PeerGameControllerOptions) {
  const store = useGameStore()
  const {
    passStep,
    activePlayerId,
    resetForPlayers,
    handDeviceToPlayer,
    finishPlayerTurn,
  } = usePassAndPlay()

  const draftExpansions = ref<Expansions>({
    gatheringStorm: false,
    rebelVsImperium: false,
    prestige: false,
    goals: false,
  })
  const draftSelections = ref<PhaseId[]>([])
  const newPlayerName = ref('')
  /** Host-only: unset until they explicitly choose game master or player seats on this device. */
  const hostJoinMode = ref<'unset' | 'gamemaster' | 'player'>('unset')
  let playerCounter = 0
  let restoringLocalPlayers = false
  let syncingExpansionsFromStore = false

  const screen = computed<GameScreen | null>(() => store.state?.screen ?? null)

  const myOwnedPlayers = computed(() => {
    if (!store.state || !options.peerId.value) return [] as Player[]
    return ownedPlayers(store.state, options.peerId.value)
  })

  const usesPassAndPlay = computed(() => myOwnedPlayers.value.length > 1)

  const actingPlayerId = computed(() => {
    if (myOwnedPlayers.value.length === 0) return null
    if (myOwnedPlayers.value.length === 1) return myOwnedPlayers.value[0]!.id
    return activePlayerId.value
  })

  const actingPlayer = computed(() =>
    actingPlayerId.value
      ? store.state?.players.find((player) => player.id === actingPlayerId.value) ?? null
      : null,
  )

  const highlightPlayerId = computed(() => actingPlayerId.value ?? '')

  function canEditPlayer(playerId: string): boolean {
    if (!store.state) return false
    return canEditVp(options.peerId.value, store.isHost, playerId, store.state.players)
  }

  function dispatch(action: Parameters<GameTransport['dispatch']>[0]) {
    options.transport.dispatch(action)
  }

  function nextPlayerId(): string {
    playerCounter += 1
    const peerKey = options.peerId.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'peer'
    if (options.isLocal) return `local-player-${playerCounter}`
    return `player-${peerKey}-${playerCounter}`
  }

  function addPlayer(name?: string) {
    const trimmed = (name ?? newPlayerName.value).trim()
    if (!trimmed || !options.peerId.value) return
    if (store.isHost && !options.isLocal && hostJoinMode.value !== 'player') return
    const playerId = nextPlayerId()
    dispatch({
      type: 'ADD_PLAYER',
      playerId,
      ownerPeerId: options.peerId.value,
      name: trimmed,
    })
    newPlayerName.value = ''
    if (store.isHost) hostJoinMode.value = 'player'
  }

  function registerPeer() {
    if (!options.peerId.value || !store.state) return
    if (store.state.registeredPeerIds.includes(options.peerId.value)) return
    dispatch({ type: 'REGISTER_PEER', peerId: options.peerId.value })
  }

  function registerAsGameMaster() {
    if (!options.peerId.value) return
    hostJoinMode.value = 'gamemaster'
    registerPeer()
  }

  function registerAsPlayerPeer() {
    if (!options.peerId.value) return
    hostJoinMode.value = 'player'
    registerPeer()
  }

  function registerAsSpectator() {
    registerPeer()
  }

  function reorderPlayers(playerIds: string[]) {
    dispatch({ type: 'REORDER_PLAYERS', playerIds })
  }

  function startGame() {
    dispatch({ type: 'START_GAME' })
  }

  function updateExpansions(expansions: Expansions) {
    draftExpansions.value = { ...expansions }
  }

  function syncExpansionsToStore() {
    if (syncingExpansionsFromStore || !store.state) return
    if (!canControlSession(store.isHost) && !options.isLocal) return
    if (expansionsEqual(draftExpansions.value, store.state.expansions)) return
    dispatch({ type: 'SET_EXPANSIONS', expansions: { ...draftExpansions.value } })
  }

  function selectPhases(phases: PhaseId[]) {
    draftSelections.value = phases
    const playerId = actingPlayerId.value
    if (!playerId) return
    dispatch({ type: 'SELECT_PHASES', playerId, phases })
  }

  function confirmSelection() {
    const playerId = actingPlayerId.value
    if (!playerId) return
    dispatch({ type: 'CONFIRM', playerId })
    if (usesPassAndPlay.value && store.state?.screen === 'select') {
      finishPlayerTurn(myOwnedPlayers.value, (id) => store.state!.confirmed[id])
      draftSelections.value = []
    }
  }

  function adjustVp(playerId: string, delta: number) {
    dispatch({ type: 'ADJUST_VP', playerId, delta })
  }

  function setVp(playerId: string, value: number) {
    dispatch({ type: 'SET_VP', playerId, vpChips: value })
  }

  function adjustEmpire(playerId: string, delta: number) {
    dispatch({ type: 'ADJUST_EMPIRE', playerId, delta })
  }

  function setEmpire(playerId: string, value: number) {
    dispatch({ type: 'SET_EMPIRE', playerId, empireSize: value })
  }

  function setRevealIndex(index: number) {
    dispatch({ type: 'SET_REVEAL_INDEX', index })
  }

  function finishRevealRound() {
    if (!store.state) return
    if (shouldEndGameAfterRound(store.state.players, store.state.vpPoolInitial)) {
      dispatch({ type: 'END_GAME' })
    } else {
      dispatch({ type: 'NEXT_ROUND' })
    }
  }

  function endGame() {
    dispatch({ type: 'END_GAME' })
  }

  function setTutorialEnabled(playerId: string, enabled: boolean) {
    dispatch({ type: 'SET_TUTORIAL_ENABLED', playerId, enabled })
  }

  function setCostModifiers(playerId: string, modifiers: CostModifier[]) {
    dispatch({ type: 'SET_COST_MODIFIERS', playerId, modifiers })
  }

  function submitTiebreak(goodsOnWorlds: number, cardsInHand: number) {
    const playerId = actingPlayerId.value
    if (!playerId || !store.state) return
    dispatch({ type: 'SUBMIT_TIEBREAK', playerId, goodsOnWorlds, cardsInHand })
    if (usesPassAndPlay.value) {
      const tiedIds = getVpTiedPlayerIds(
        store.state.players,
        store.state.scores,
        store.state.expansions,
      )
      finishPlayerTurn(
        myOwnedPlayers.value.filter((player) => tiedIds.includes(player.id)),
        (id) => store.state!.scores[id]?.tiebreakSubmitted ?? false,
      )
    }
  }

  function syncPassAndPlay() {
    if (!store.state) return

    if (store.state.screen === 'select' && usesPassAndPlay.value) {
      resetForPlayers(myOwnedPlayers.value, (id) => store.state!.confirmed[id])
      draftSelections.value = []
    } else if (store.state.screen === 'scoring' && usesPassAndPlay.value) {
      if (needsTiebreakInput(store.state.players, store.state.scores, store.state.expansions)) {
        const tiedIds = getVpTiedPlayerIds(
          store.state.players,
          store.state.scores,
          store.state.expansions,
        )
        resetForPlayers(
          myOwnedPlayers.value.filter((player) => tiedIds.includes(player.id)),
          (id) => store.state!.scores[id]?.tiebreakSubmitted ?? false,
        )
      }
    }
  }

  function persistLocalPlayers() {
    if (!options.isLocal || !store.state || restoringLocalPlayers) return
    const players = ownedPlayers(store.state, LOCAL_HOST_ID)
    if (players.length === 0) return
    saveLocalPlayers(players.map((player) => ({ id: player.id, name: player.name })))
  }

  function restoreLocalPlayersFromStorage() {
    const saved = loadSavedLocalPlayers()
    hostJoinMode.value = 'player'
    if (saved.length === 0) return

    restoringLocalPlayers = true
    try {
      dispatch({ type: 'REGISTER_PEER', peerId: LOCAL_HOST_ID })
      for (const player of saved) {
        dispatch({
          type: 'ADD_PLAYER',
          playerId: player.id,
          ownerPeerId: LOCAL_HOST_ID,
          name: player.name,
        })
      }
      playerCounter = maxLocalPlayerCounter(saved)
    } finally {
      restoringLocalPlayers = false
    }
  }

  function initLocalSession(code: string) {
    store.initAsHost(code, LOCAL_HOST_ID)
    store.connected = true
    restoreLocalPlayersFromStorage()
  }

  watch(
    () => (store.state ? `${store.state.screen}:${store.state.round}` : null),
    () => syncPassAndPlay(),
  )

  watch(
    () => (options.isLocal ? store.state?.players : null),
    () => persistLocalPlayers(),
    { deep: true },
  )

  watch(
    () => store.state?.expansions,
    (expansions) => {
      if (!expansions || expansionsEqual(draftExpansions.value, expansions)) return
      syncingExpansionsFromStore = true
      draftExpansions.value = { ...expansions }
      syncingExpansionsFromStore = false
    },
    { deep: true },
  )

  watch(draftExpansions, syncExpansionsToStore, { deep: true })

  watch(
    actingPlayerId,
    (id) => {
      if (!id) {
        draftSelections.value = []
        return
      }
      const sel = store.state?.selections[id]
      draftSelections.value = sel ? [...sel] : []
    },
  )

  const passProgress = computed(() => {
    if (!store.state) return ''
    const total = store.state.players.length
    if (store.state.screen === 'select') {
      const done = store.state.players.filter((player) => store.state!.confirmed[player.id]).length
      return `${done} of ${total} players locked in`
    }
    if (store.state.screen === 'scoring') {
      const tiedIds = getVpTiedPlayerIds(
        store.state.players,
        store.state.scores,
        store.state.expansions,
      )
      const done = tiedIds.filter((id) => store.state!.scores[id]?.tiebreakSubmitted).length
      return `${done} of ${tiedIds.length} tie-breakers collected`
    }
    return ''
  })

  const mySelections = computed(() => {
    if (usesPassAndPlay.value && passStep.value === 'handoff') return [] as PhaseId[]
    const id = actingPlayerId.value
    if (!id) return draftSelections.value
    return store.state?.selections[id] ?? draftSelections.value
  })

  const isConfirmed = computed(() => {
    const id = actingPlayerId.value
    if (!id) return false
    return store.state?.confirmed[id] ?? false
  })

  const ranked = computed(() => {
    if (!store.state) return []
    return rankPlayers(store.state.players, store.state.scores, store.state.expansions)
  })

  const needsTiebreak = computed(() => {
    if (!store.state) return false
    return needsTiebreakInput(store.state.players, store.state.scores, store.state.expansions)
  })

  const activeTiebreakPlayer = computed(() => {
    if (!actingPlayerId.value || !store.state || !usesPassAndPlay.value) return null
    const tiedIds = getVpTiedPlayerIds(
      store.state.players,
      store.state.scores,
      store.state.expansions,
    )
    if (!tiedIds.includes(actingPlayerId.value)) return null
    if (store.state.scores[actingPlayerId.value]?.tiebreakSubmitted) return null
    return store.state.players.find((player) => player.id === actingPlayerId.value) ?? null
  })

  const pendingTiebreakPlayer = computed(() => {
    if (!store.state || !needsTiebreak.value || store.isSpectator) return null
    const tiedIds = getVpTiedPlayerIds(
      store.state.players,
      store.state.scores,
      store.state.expansions,
    )
    if (usesPassAndPlay.value) return activeTiebreakPlayer.value
    const ownedTied = myOwnedPlayers.value.find(
      (player) =>
        tiedIds.includes(player.id)
        && !store.state!.scores[player.id]?.tiebreakSubmitted,
    )
    return ownedTied ?? null
  })

  watch(
    () => [store.isRegistered, myOwnedPlayers.value.length] as const,
    ([registered, ownedCount]) => {
      if (!store.isHost || options.isLocal) return
      if (ownedCount > 0) {
        hostJoinMode.value = 'player'
      } else if (registered && hostJoinMode.value === 'unset') {
        hostJoinMode.value = 'gamemaster'
      }
    },
  )

  const lobby = computed(() => ({
    players: store.state?.players ?? [],
    hostId: store.state?.hostId ?? '',
    peerId: options.peerId.value,
    isHost: store.isHost,
    isRegistered: store.isRegistered,
    isSpectator: store.isSpectator,
    showHostJoinChoice: store.isHost && !options.isLocal && !store.isRegistered,
    showGameMasterStatus: store.isHost && !options.isLocal && store.isRegistered && store.isSpectator && hostJoinMode.value === 'gamemaster',
    canSwitchToPlayerPeer: store.isHost && !options.isLocal && store.isRegistered && store.isSpectator && hostJoinMode.value === 'gamemaster',
    canReorder: canReorder(store.isHost) || !!options.isLocal,
    canStartGame: store.isHost || !!options.isLocal,
    canManageRoster: (() => {
      if (store.state?.screen !== 'lobby') return false
      if (options.isLocal) return true
      if (store.isHost) return hostJoinMode.value === 'player' || myOwnedPlayers.value.length > 0
      return true
    })(),
    playerCount: store.playerCount,
    expansions: draftExpansions.value,
    expansionsEditable: store.isHost || !!options.isLocal,
    hint: options.isLocal
      ? 'Add every player at the table, drag to set turn order, then start the game.'
      : store.isHost
        ? 'Choose how you want to join this session.'
        : 'Add players on this device, or continue as a spectator.',
    canSetTutorialForPlayer: (playerId: string) => {
      if (!store.state || store.state.screen !== 'lobby') return false
      const player = store.state.players.find((entry) => entry.id === playerId)
      if (!player) return false
      return canSetTutorial(options.peerId.value, store.isHost, player)
    },
  }))

  const select = computed(() => ({
    round: store.state?.round ?? 0,
    allPlayers: store.state?.players ?? [],
    actingPlayer: actingPlayer.value,
    showHandoff: usesPassAndPlay.value && passStep.value === 'handoff' && !!actingPlayer.value,
    handoffPlayerName: actingPlayer.value?.name ?? '',
    progress: passProgress.value,
    showSpectatorWait: store.isSpectator,
    showPhasePicker:
      !store.isSpectator
      && (!usesPassAndPlay.value || passStep.value === 'playing'),
    selections: mySelections.value,
    confirmed: isConfirmed.value,
    expansions: store.state?.expansions ?? draftExpansions.value,
    playerCount: store.playerCount,
    actionPickLimit: store.state?.actionPickLimit ?? getPhaseLimit(store.playerCount),
    highlightPlayerId: highlightPlayerId.value,
    vp: {
      pool: store.state?.vpPool ?? 0,
      poolInitial: store.state?.vpPoolInitial ?? 0,
      lastRound: store.state?.lastRound ?? false,
      gameEnded: store.state?.gameEnded ?? false,
    },
    showVpTracker: !store.isSpectator,
    showEndGame: canControlSession(store.isHost),
    canEditPlayer,
    primaryScorePlayerId: actingPlayerId.value ?? '',
    costModifiers:
      actingPlayerId.value && store.state?.costPlanning?.[actingPlayerId.value]
        ? store.state.costPlanning[actingPlayerId.value]!.modifiers
        : [],
    showTutorialBlurbs: isPlayerTutorialEnabled(
      store.state?.players ?? [],
      actingPlayerId.value,
    ),
    canEditCostPlanning: !!actingPlayerId.value && !store.isSpectator,
  }))

  const reveal = computed(() => ({
    phases: store.state?.revealedPhases ?? [],
    round: store.state?.round ?? 0,
    currentIndex: store.state?.revealPhaseIndex ?? 0,
    players: store.state?.players ?? [],
    vpPool: store.state?.vpPool ?? 0,
    vpPoolInitial: store.state?.vpPoolInitial ?? 0,
    lastRound: store.state?.lastRound ?? false,
    highlightPlayerId: highlightPlayerId.value,
    canNavigate: canControlSession(store.isHost) || !!options.isLocal,
    canEditPlayer,
  }))

  const scoring = computed(() => ({
    needsTiebreak: needsTiebreak.value,
    ranked: ranked.value,
    expansions: store.state?.expansions ?? draftExpansions.value,
    showHandoff:
      usesPassAndPlay.value
      && passStep.value === 'handoff'
      && !!actingPlayer.value
      && !!activeTiebreakPlayer.value,
    handoffPlayerName: actingPlayer.value?.name ?? '',
    progress: passProgress.value,
    showTiebreakForm:
      !!pendingTiebreakPlayer.value
      && (!usesPassAndPlay.value || passStep.value === 'playing'),
    tiebreakPlayerName: pendingTiebreakPlayer.value?.name ?? '',
    showSpectatorWait: store.isSpectator && needsTiebreak.value,
    showWaitingForOthers:
      !store.isSpectator
      && needsTiebreak.value
      && !pendingTiebreakPlayer.value
      && !usesPassAndPlay.value,
  }))

  return {
    screen,
    lobby,
    select,
    reveal,
    scoring,
    newPlayerName,
    addPlayer,
    registerAsSpectator,
    registerAsGameMaster,
    registerAsPlayerPeer,
    reorderPlayers,
    startGame,
    updateExpansions,
    selectPhases,
    confirmSelection,
    handDeviceToPlayer,
    adjustVp,
    setVp,
    adjustEmpire,
    setEmpire,
    setRevealIndex,
    finishRevealRound,
    endGame,
    submitTiebreak,
    setTutorialEnabled,
    setCostModifiers,
    initLocalSession,
  }
}

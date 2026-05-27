# Product scope

## Purpose

The companion supports **one physical table** playing Race for the Galaxy by digitizing only the parts that are awkward with cards alone:

- Secret simultaneous **action selection**
- **Ordered phase reveal** with correct develop/settle stacking
- **VP chip** tracking against a shared supply
- **Tableau size** tracking for the 12-card end-game condition
- **End-game scoring** and tie-breakers

Players still use the real game for everything else.

## In scope

- Multi-device sessions (host + guests over WebRTC)
- Single-device pass-and-play (multiple seats, handoff prompt)
- Host-as-spectator / game master
- Expansion toggles that affect phases and score fields
- Lightweight **rules reminders** (not a full rulebook)
- **Tutorial mode** as coaching copy on top of existing screens (see [tutorial-mode.md](./tutorial-mode.md))

## Out of scope (by design)

| Topic | Rationale |
|-------|-----------|
| Hand management | Privacy and complexity; hands stay physical |
| Deck / discard / shuffling | Same; app is not a card engine |
| Automated phase resolution | Bonuses and powers are table-managed |
| Card database or iconography | No OCR or card art licensing in v1 |
| Persistent accounts / cloud saves | Static app, ephemeral P2P state |
| AI opponents | Multiplayer companion only |
| Full rule enforcement | Hints and counters only; table adjudicates disputes |

## User modes

### Multi-device (default)

- One device per peer (or one peer owning multiple player seats).
- Host authoritative state; guests send `GameAction`s.
- QR / invite encodes room code + host peer id.

### Local / pass-and-play

- `?local=CODE` — all players on one device.
- `usePassAndPlay` cycles `handoff` → `playing` per seat.
- During handoff, hide information that would leak the next player’s secrets (status list, score FAB on select).

### Spectator / game master

- Registered peer with zero owned players.
- Can start game, navigate reveal, edit any player’s VP/tableau (host permission model).

## Success criteria

- A group can complete a full game using only phones for phases + chips + tableau count.
- End game triggers correctly for **VP pool** and **12+ tableau**.
- New players can enable tutorial on their seat without affecting others’ UI (phase A).

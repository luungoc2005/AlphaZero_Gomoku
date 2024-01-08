import { LitElement, css, html } from 'lit';
import _ from 'lodash';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import { axiosObject } from './api';

const CELL_SIZE = 24;

export class Board extends LitElement {
  static get properties() {
    return {
      savedFile: { type: Object },
      width: { type: Number },
      height: { type: Number },
      moves: { type: Array },
      turn: { type: Number },
      winner: { type: Number },
      nInARow: { type: Number },
      replayMode: { type: Boolean },
      gameId: { type: String },
    }
  }

  static get styles() {
    return css`
      .container {
        display: flex;
        flex-direction: column;
        padding: 8px;
      }

      .container sl-card {
        margin-bottom: 16px;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .cell {
        width: ${CELL_SIZE}px;
        height: ${CELL_SIZE}px;
        border: 1px solid rgba(0, 0, 0, 0.8);
        text-align: center;
        padding: 4px;
      }
    `
  }

  constructor() {
    super()
    this.savedFile = {}
    this.width = 15
    this.height = 15
    this.moves = []
    this.state = {}
    this.winner = -1
    this.nInARow = 5
    this.replayMode = false
  }

  loadFile(savedFile) {
    this.savedFile = savedFile
    this.width = savedFile.width
    this.height = savedFile.height
    this.moves = savedFile.moves
    this.winner = savedFile.winner
    this.nInARow = savedFile.n_in_a_row
    this.replayMode = true
    this.state = {}
    this.turn = 0
  }

  getMovePosition(index) {
    return {
      x: Math.floor(index / this.width),
      y: index % this.width,
    }
  }

  _onKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      this.prevTurn()
    } else if (event.key === 'ArrowRight') {
      this.nextTurn()
    }
  }

  nextTurn() {
    if (this.turn >= this.moves.length) { return }
    const currentMove = this.moves[this.turn]
    const { x, y } = this.getMovePosition(currentMove)
    if (!this.state[x]) { this.state[x] = {} }
    this.state[x][y] = this.turn % 2 == 0 ? 'X' : 'O'
    this.turn += 1
  }

  prevTurn() {
    if (this.turn <= 0) { return }
    const prevMove = this.moves[this.turn - 1]
    const { x, y } = this.getMovePosition(prevMove)
    delete this.state[x][y]
    this.turn -= 1
  }

  async onCellClick(x, y) {
    if (this.replayMode) { return }
    if (!this.gameId) {
      const response = await axiosObject.post('/play/new_game')
      this.gameId = response.data.game_id
    }
    console.log('move', x, y)
    const move = y * this.width + x
    const response = await axiosObject.post(`/play/${this.gameId}/${move}`)
    if (!this.state[x]) { this.state[x] = {} }
    this.state[x][y] = this.turn % 2 == 0 ? 'X' : 'O'
    this.turn += 1
    this.moves.push(move)
    if (response.data.winner != -1) {
      alert('has a winner')
    }
  }

  async newGame() {
    this.replayMode = false
    this.gameId = ''
    this.moves = []
    this.state = {}
    this.turn = 0

    const response = await axiosObject.post('/play/new_game')
    this.gameId = response.data.game_id
  }

  render() {
    return html`<div class="container" @keydown="${this._onKeyDown}" tabindex="0">
      <sl-card>
      Turn: ${this.turn}/${this.moves.length}
      ${_.range(0, this.height).map(y => {
        return html`<div class="row">
          ${_.range(0, this.width).map(x => {
            return html`<div class="cell" @click=${() => this.onCellClick(x, y)}>${_.get(this.state, `${x}.${y}`)}</div>`
          })}
        </div>`
      })}
      </sl-card>
      <div style="display: flex; flex-direction: row;">
        <sl-button-group ?visible=${this.replayMode} style="margin-right: 8px;">
          <sl-button ?disabled=${this.turn <= 0} pill @click="${this.prevTurn}"><sl-icon name="chevron-left"></sl-icon>Prev</sl-button>
          <sl-button ?disabled=${this.turn >= this.moves.length} pill @click="${this.nextTurn}">Next<sl-icon name="chevron-right"></sl-icon></sl-button>
        </sl-button-group>
        <sl-button pill @click="${this.newGame}">New Game</sl-button>
      </div>
    </div>`
  }
}

customElements.define('x-board', Board)
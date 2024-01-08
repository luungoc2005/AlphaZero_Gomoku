import { LitElement, css, html } from 'lit';
import './board.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

import { axiosObject } from './api.js';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/');

export class App extends LitElement {
  static get properties() {
    return {
      files: { type: Array },
      currentFile : { type: String },
    }
  }

  constructor() {
    super()
    this.count = 0
    this.files = []
    this.currentFile = ''
    this.fileDate = ''

    this.fetchFiles()
  }

  fetchFiles() {
    axiosObject.get('/items/').then((response) => {
      this.files = response.data?.items
      this.selectFile(this.files[this.files.length - 1])
    })
  }

  selectFile(file) {
    this.currentFile = file
    const fileParts = file.split(".")
    const fileDate = new Date(fileParts[0] * 1000)

    this.fileDate = fileDate.toLocaleString()
    axiosObject.get(`/items/${file}`).then((response) => {
      this.shadowRoot.querySelector('x-board').loadFile(response.data)
    })
  }

  render() {
    return html`
      <div class="row">
        <div class="card">
          <p>${this.fileDate}</p>
          <x-board></x-board>
        </div>
        <div class="card">
          <p>Number of games: ${this.files.length}</p>
          <sl-dropdown hoist>
            <sl-button slot="trigger" caret>${this.currentFile}</sl-button>
            <sl-menu>
              ${this.files.slice(Math.max(0, this.files.length - 20)).map((file) => {
                return html`
                  <sl-menu-item @click=${() => this.selectFile(file)}>
                    ${file}
                  </sl-menu-item>
                `
              })}
            </sl-menu>
          </sl-dropdown>
          <sl-button variant="default" @click=${this.fetchFiles}><sl-icon name="arrow-repeat"></sl-icon></sl-button>
        </div>
      </div>
    `
  }

  static get styles() {
    return css`
      :host {
        max-width: 1280px;
        margin: 0 auto;
      }

      .row {
        display: flex;
        flex-direction: row;
      }
    `
  }
}

window.customElements.define('x-app', App)

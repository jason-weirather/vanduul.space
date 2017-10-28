import React from 'react';
import './game.css';
import './main.css';
import VS from './game.js';

class VanduulSpace extends React.Component {
  render() {
    return (
      <div>
        <canvas id="game_board">
        </canvas>
        <input id="user_input" type="text"></input>
      </div>
    );
  }
  componentDidMount() {
    VS.init();
    VS.stretch_canvas();
  }
}

export default VanduulSpace;
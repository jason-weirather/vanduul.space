import React from 'react';
import './main.css';
import VanduulSpace from './game.js';
import uuidv4 from 'uuid/v4';


class VanduulSpaceComponent extends React.Component {
    constructor(props) {
    super(props);
        this.state = {id:uuidv4()};
    }
  render() {
    return (
      <div id={this.state.id}></div>
    );
  }
  componentDidMount() {
    var that = this;
    document.getElementById(this.state.id).style.width = window.innerWidth+'px';
    document.getElementById(this.state.id).style.height = window.innerHeight+'px';
    window.addEventListener("resize", function(){
       document.getElementById(that.state.id).style.width = window.innerWidth+'px';
       document.getElementById(that.state.id).style.height = window.innerHeight+'px';
       console.log('change size')
    });
    VanduulSpace(document.getElementById(this.state.id));
    // Now resize body to the document size
  }
}

export default VanduulSpaceComponent;
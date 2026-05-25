import './index.css';
import './main.css';
import VanduulSpace from './game.js';

const app = document.getElementById('app');
const game = VanduulSpace(app);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (game && typeof game.destroy === 'function') {
      game.destroy();
    }
  });
}

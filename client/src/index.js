import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import './index.css';
import App from './App';
import { CookiesProvider } from 'react-cookie';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <CookiesProvider>
    <Provider store={ store }>
      <App />
    </Provider>
  </CookiesProvider>, document.getElementById('app'));
registerServiceWorker();

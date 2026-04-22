import ReactDOM from 'react-dom/client';
import { createStore, applyMiddleware, compose } from 'redux';
import ReduxThunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { routerMiddleware } from 'connected-react-router';
import { ThemeProvider as ThemeProviderV5 } from '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import { LayoutProvider } from './context/LayoutContext';
import { UserProvider } from './context/UserContext';
import { ManagementProvider } from './context/ManagementContext';
import createRootReducer from './reducers';
import {
  ThemeProvider as ThemeChangeProvider,
  ThemeStateContext,
} from './context/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import setupAxiosInterceptors from './utils/axiosInterceptor';

import { createHashHistory, createMemoryHistory } from 'history';

const history =
  typeof window !== 'undefined'
    ? createHashHistory()
    : createMemoryHistory({
        initialEntries: [],
      });

export function getHistory() {
  return history;
}

export const store = createStore(
  createRootReducer(history),
  compose(applyMiddleware(routerMiddleware(history), ReduxThunk)),
);

setupAxiosInterceptors(store);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <LayoutProvider>
      <UserProvider>
        <StyledEngineProvider injectFirst>
          <ThemeChangeProvider>
            <ThemeStateContext.Consumer>
              {(theme) => (
                <ThemeProviderV5 theme={theme}>
                  <ManagementProvider>
                    <CssBaseline />
                    <App />
                  </ManagementProvider>
                </ThemeProviderV5>
              )}
            </ThemeStateContext.Consumer>
          </ThemeChangeProvider>
        </StyledEngineProvider>
      </UserProvider>
    </LayoutProvider>
  </Provider>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

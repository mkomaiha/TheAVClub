import {GET_SESSION} from './constants';

export const getSession = (username) => dispatch => {
  return fetch('/api/sessions/' + username)
    .then(res => res.json())
    .then(session => dispatch({type: GET_SESSION, payload: session}))
}

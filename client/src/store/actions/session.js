import {GET_SESSION, GET_SESSION_DATA} from './constants';

export const getSession = (username) => dispatch => {
  console.log(username)
  return fetch('/api/sessions/' + username)
    .then(res => res.json())
    .then(session => {
      if (!("sessionid" in session)) {
        session = {
          sessionDuration: 0.0,
          squeezeCount: 0.0
        }
      }
      dispatch({type: GET_SESSION, payload: session})
    })
}

export const getSessionData = (username) => dispatch => {
  return fetch('/api/sessionsData/' + username)
    .then(res => res.json())
    .then(session => {
      dispatch({type: GET_SESSION_DATA, payload: session})
    })
}

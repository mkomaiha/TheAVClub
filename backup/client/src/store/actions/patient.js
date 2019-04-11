import {GET_PATIENTS} from './constants';

export const getPatients = () => dispatch => {
  return fetch('/api/patients/')
    .then(res => res.json())
    .then(patients => dispatch({type: GET_PATIENTS, payload: patients}))
}

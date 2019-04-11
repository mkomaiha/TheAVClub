import {combineReducers} from 'redux';
import patientReducer from './patient';
import sessionReducer from './session';

export default combineReducers({
  patients: patientReducer,
  session: sessionReducer
})

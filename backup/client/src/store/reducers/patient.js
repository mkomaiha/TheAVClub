import {GET_PATIENTS} from '../actions/constants'

const patientReducer = (state = [], {type, payload}) => {
    switch (type) {
      case GET_PATIENTS:
        return payload
      default:
        return state
    }
}

export default patientReducer;

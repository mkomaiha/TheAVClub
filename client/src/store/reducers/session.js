import {GET_SESSION, GET_SESSION_DATA} from '../actions/constants'

const sessionReducer = (state = [], {type, payload}) => {
    switch (type) {
      case GET_SESSION:
        return payload
      case GET_SESSION_DATA:
        return payload
      default:
        return state
    }
}

export default sessionReducer;

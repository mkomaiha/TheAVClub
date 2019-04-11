import {GET_SESSION} from '../actions/constants'

const sessionReducer = (state = [], {type, payload}) => {
    switch (type) {
      case GET_SESSION:
        return payload
      default:
        return state
    }
}

export default sessionReducer;

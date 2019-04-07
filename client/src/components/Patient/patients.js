import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {connect } from 'react-redux';
import {getPatients} from '../../store/actions/patient'
import {getSession} from '../../store/actions/session'
import './patients.css';

class Patients extends Component {

  static propTypes = {
    getPatients: PropTypes.func.isRequired,
    patients: PropTypes.array.isRequired,
    getSession: PropTypes.func.isRequired
  }

  static defaultProps = {
    patients: [],
    session: {}
  }
  constructor(props) {
    super(props)

    this.state = {
      value: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.value === "") {
      alert('Please enter data')
      return
    }
    this.props.getSession(this.state.value).then((x) => {
      if ("sessionid" in x["payload"]) {
        return
      }
      else {
        this.props.session['error'] = 'No session for this date'
      }
    }).then(() => this.setState({ value: '' }));
  }

  componentWillMount() {
    this.props.getPatients();
    this.props.getSession();
  }

  render() {
    // var objects =
    return (
      <div>
        <div style={{display: "flex"}}>
          <div style={{float: "left", width: 30 + "%"}}>
            <h2>Patients</h2>
            <ul style={{width: 90 + "%"}}>
            {this.props.patients.map(patient =>
              <li key={patient.username}>{patient.username}</li>
            )}
            </ul>
          </div>
          <div style={{flexGrow: 1}}>
            <div style={{display: "flex"}}>
              <div style={{float: "left"}}>
                <h2>Sessions</h2>
              </div>
              <div style={{flexGrow: 1}}>
                <form id="send-form" style={{height: 100 + "%"}} className="send-form" onSubmit={this.handleSubmit}>
                  <input id="input" type="text" aria-label="Input" autoComplete="off" value={this.state.value} onChange={this.handleChange} placeholder="Type something to send..."/>
                </form>
              </div>
            </div>
            <ul style={{width: 90 + "%"}}>
            {Object.keys(this.props.session).map(key =>
              <div key={key} >
                <li style={{float: "left", width: 35 + "%"}}>{key}</li>
                <li style={{flexGrow: 1}}>{"|"} {this.props.session[key]}</li>
              </div>
            )}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  patients: state.patients,
  session: state.session
})

const dispatchToProps = (dispatch) => ({
   getPatients: () => dispatch(getPatients()),
   getSession: (user) => dispatch(getSession(user))
})

export default connect(mapStateToProps, dispatchToProps)(Patients);

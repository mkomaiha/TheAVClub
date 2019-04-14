import React, { Component } from 'react'
import { PropTypes, instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import { Link, withRouter } from 'react-router-dom'
import { connect } from 'react-redux';
import { getPatients } from './store/actions/patient'

class Physician extends Component {
  static propTypes = {
    getPatients: PropTypes.func.isRequired,
    patients: PropTypes.array.isRequired,
    cookies: instanceOf(Cookies).isRequired
  };

  static defaultProps = {
    patients: [],
  }

  constructor(props) {
    super(props)
    this.handleClick= this.handleClick.bind(this);
    this.handleLogout = this.handleLogout.bind(this)
  }

  componentWillMount() {
    this.props.getPatients();
  }

  handleClick(event) {
    event.preventDefault();
  }

  handleLogout(event) {
    // console.log(this.props.cookies.remove)
    const { cookies } = this.props;
    cookies.remove('pname');
    this.props.history.push('/physicianLog')
  }

  render () {
    return (
      <div>
        <div>
          <div style={{width: 10 + '%', float: 'left'}}><br/></div>
          <div style={{textAlign: 'center', fontSize: 30 + 'px', width: 80 + '%', float: 'left'}}>
            <h1 style={{textAlign: 'center'}}>Please select a patient to access their data</h1>
          </div>
          <div style={{width: 10 + '%', float: 'right', textAlign: 'right', padding: [10 + 'px ' + 10 + 'px']}}>
            <button type="button" className="btn btn-danger" onClick={this.handleLogout} style={{alignItems: 'center', display: 'flex', float: 'right'}}>Logout</button>
          </div>
        </div>
        <div className="btn-group-vertical" style={{margin: [0 + 'px ' + 30 + 'px'], width: '-webkit-fill-available'}}>
          {this.props.patients.map(patient =>
          <Link style={{color: 'white'}} className="btn" to={`/patient/${patient.username}`} key={patient.username}>
            <button className="btn btn-primary btnTest" value='1'>{patient.username}</button>
          </Link>
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  patients: state.patients,
})

const dispatchToProps = (dispatch) => ({
   getPatients: () => dispatch(getPatients()),
})

export default withCookies(withRouter(connect(mapStateToProps, dispatchToProps)(Physician)))

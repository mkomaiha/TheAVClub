import React, { Component } from 'react'
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import { withRouter } from 'react-router-dom'

class PhysicianLogin extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super(props)
    this.state = {
      value: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }
  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const {cookies} = this.props;
    cookies.set('pname', this.state.value, {'path':'/'});
    this.props.history.push('/main')
  }

  handleLogin(event) {
    event.preventDefault();
    this.props.history.push('/physician')
  }

  render () {
    return (
      <div style={{marginTop: 30 + 'px'}}>
        <h1 style={{textAlign: 'center'}}>Physician Data Access Portal</h1>
        <p style={{textAlign: 'center', fontSize: 20 + 'px'}}>Please login using your username</p>
        <form id="send-form" style={{margin: [0 + "px " + 80 + "px"]}} onSubmit={this.handleSubmit}>
          <div className="form-group row">
            <label htmlFor="inputUsername" className="col-sm-2 col-form-label">Username</label>
            <div className="col-sm-10">
              <input className="form-control" id="inputUsername" type="text" aria-label="Input" autoComplete="off" value={this.state.value} onChange={this.handleChange} placeholder="Username" required/>
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-2 col-form-label"></label>
            <div className="col-sm-10">
              <button type="submit" className="btn btn-primary">Login</button>
            </div>
          </div>
        </form>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label"></label>
          <div className="col-sm-10">
            <button type="submit" className="btn btn-default" onClick={this.handleLogin}>Not a physician?</button>
          </div>
        </div>
      </div>
    )
  }
}

export default withCookies(withRouter(PhysicianLogin))

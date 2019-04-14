import React, { Component } from 'react'
import './App.css'
import '../node_modules/react-vis/dist/style.css';
import Login from './login'
import Main from './main'
import Physician from './physician'
import Patient from './components/Patient/patient.js'
import PhysicianLogin from './physicianLogin'
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch
} from 'react-router-dom'

const PublicRoute = ({ component: Component, req, ...rest }) => (
  <Route {...rest} render={(props) => (
    rest.cookies.get('name')
    ? <Redirect to='/main' />
    : rest.cookies.get('pname')
    ? <Redirect to='/physician' />
    : <Component {...props} />
  )} />
)

const PrivateRoute = ({ component: Component, req, ...rest }) => {
  return <Route {...rest} render={(props) => (
    rest.cookies.get(req)
    ? <Component {...props} />
    : <Redirect to='/' />
  )} />
}

class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  render () {
    const { cookies } = this.props;
    return (
      <Router>
        <Switch>
          <PublicRoute exact path='/' component={Login} cookies={cookies} />
          <PrivateRoute path='/main' component={Main} req='name' cookies={cookies} />
          <PrivateRoute path='/physician' component={Physician} req='pname' cookies={cookies} />
          <PrivateRoute path='/patient/:id' component={Patient} req='pname' cookies={cookies} />
          <PublicRoute path='/physicianLog' component={PhysicianLogin} cookies={cookies} />
          <PublicRoute component={Login} cookies={cookies} />
        </Switch>
      </Router>
    )
  }
}

export default withCookies(App)

import React, { Component } from 'react'
import { Provider } from 'react-redux'
import './App.css'
import store from './store'
import BluetoothTerminal from './BluetoothTerminal'
import { PropTypes, instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';
import { getSession } from './store/actions/session';

class Main extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
    getSession: PropTypes.func.isRequired
  };

  static defaultProps = {
    session: {
      sessionDuration: 0.0,
      squeezeCount: 0.0
    }
  }

  constructor(props) {
    super(props)
    let terminal = new BluetoothTerminal();
    const name = props.cookies.get('name')
    // console.log(.name)
    terminal.receive = (data) => {
      try {
        var dataJSON = JSON.parse(data);
        if ("event" in dataJSON) {
          if (dataJSON["event"] === "ardUpdate") {
            this.setState(prevState => ({
              forceVal: dataJSON["force"]
            }));
            return
          }
          else if (dataJSON["event"] === "ardData") {
            console.log(dataJSON["fDS"])
            fetch("/api/newSession/" + name, {
              credentials: 'include',
              method: 'POST',
              body: JSON.stringify({
                squeezeCount: dataJSON["sCnt"],      // squeezeCount
                sessionDuration: dataJSON["sDur"],   // squeezeDuration
                forcePerSqueeze: dataJSON["fPS"],    // forcePerSqueeze
                forceDuringSqueeze: dataJSON["fDS"], // forceDuringSqueeze
                data: dataJSON["data"]               // dataArray
              }),
              headers: { 'Content-Type': 'application/json' },
            })
              .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            }).then(props.getSession(name)).then(() => {
                this.state.terminal.send(JSON.stringify({
                  "event": "light",
                  "value": Math.floor(this.props.session.sessionDuration / 60) // / 10
                })).catch(err => err);
              }).catch(err => err);
          }
          else if (dataJSON["event"] === "ardThresh") {
            this.setState(prevState => ({
              thresholdValue: dataJSON["thresh"],
              thresholdPercent: dataJSON["percent"]
            }));
            return
          }
          else if (dataJSON["event"] === "alert") {
            this.handleAlert(dataJSON["message"])
            return
          }
        }
      }
      catch(error) { console.log(error) }
      this.logToTerminal(data, 'in');
    };

    terminal._log = (...messages) => {
      messages.forEach((message) => {
        this.logToTerminal(String(message));
        console.log(message); // eslint-disable-line no-console
      }) ;
    };

    this.state = {
      sessionStatus: false,
      forceVal: 0,
      commands: [],
      value: '',
      terminal: terminal,
      connected: false,
      thresholdValue: 100,
      thresholdPercent: 0.2,
      forceMin: 20,
      forceMax: 180,
      voltageMax: 1.54,
      voltageMin: 1.46,
      displayAdvanced: false
    }

    this.handleAlert = this.handleAlert.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleConnect = this.handleConnect.bind(this)
    this.handleSession = this.handleSession.bind(this);
    this.handleSettings = this.handleSettings.bind(this);
    this.handleLogout = this.handleLogout.bind(this)
    this.handleDeviceCalibrate = this.handleDeviceCalibrate.bind(this);
    this.handleCalibrate = this.handleCalibrate.bind(this);
    this.openCloseModal = this.openCloseModal.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.logToTerminal = this.logToTerminal.bind(this);
    this.send = this.send.bind(this);
  }

  componentWillMount() {
    const name = this.props.cookies.get('name');
    this.props.getSession(name);
  }

  handleAlert(message) {
    alert(message)
    this.send('.'); // Continue message to bluetooth
  }

  toggleSettings(event) {
    event.preventDefault();
    this.setState(prevState => ({
      displayAdvanced: !prevState.displayAdvanced
    }));
  }
  // Implement own send function to log outcoming data to the terminal.
  send(data) {
    this.state.terminal.send(data).then(() => {
      this.logToTerminal(data, 'out')
    }).catch((error) => this.logToTerminal(String(error)));
  }

  logToTerminal(message, type = '') {
    this.setState(prevState => ({
      commands: prevState.commands.concat({
        type: type,
        message: message
      })
    }));
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    fetch(this.state.url, {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ text: this.state.value }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .then((res) => {
        this.setState(prevState => ({
          value: '',
          comments: prevState.comments.concat(res),
        }));
      }).catch(err => err);
    event.preventDefault();
  }

  handleConnect(event, disconnect=false) {
    if (!this.state.connected && !disconnect) {
      this.state.terminal.connect().then((dev) => {
        this.setState(prevState => ({
          connected: true})
        );
      }).catch((err) => {
        this.setState(prevState => ({
          connected: false
        }));
      });
    }
    else {
      this.state.terminal.disconnect();
      this.setState(prevState => ({
        connected: false
      }));
    }
  }

  handleSession(event) {
    event.preventDefault();
    if (this.state.connected) {
      if (!this.state.sessionStatus) {
        this.state.terminal.send(JSON.stringify({
          "event": "start"
        }))
      }
      else {
        this.state.terminal.send(JSON.stringify({
          "event": "stop"
        }))
      }
      this.setState(prevState => ({
        sessionStatus: !prevState.sessionStatus
      }));
    }
    else {
      alert('Please connect your device before beginning a session!')
    }
  }

  openCloseModal(event) {
    event.preventDefault();
    this.setState(prevState => ({
      modalState: !prevState.modalState
    }));
  }

  handleLogout(event) {
    event.preventDefault();
    const { cookies } = this.props;
    cookies.remove('name');
    if (this.state.connected) {
      this.state.terminal.send(JSON.stringify({
        "event": "stop"
      }))
    }
  }

  handleSettings(event) {
    event.preventDefault();
    if (this.state.connected) {
      this.state.terminal.send(JSON.stringify({
        "event": "ardThresh",
        "value": parseFloat(this.state.thresholdValue),
        "percent": parseFloat(this.state.thresholdPercent)
      }))
    }
    else {
      alert('Please connect your device before beginning a session!')
    }
  }

  handleDeviceCalibrate(event) {
    event.preventDefault()
    if (this.state.connected) {
      var message = {
        "event": "ardCalibrationBoth",
        "minPres": this.state.forceMin,
        "maxPres": this.state.forceMax
      }
      if (this.state.displayAdvanced) {
        message["maxVolt"] = this.state.voltageMax;
        message["minVolt"] = this.state.voltageMin;
      }
      this.send(JSON.stringify(message))
    }
    else {
      alert('Please connect your device before beginning a session!')
    }
  }

  handleCalibrate(event) {
    event.preventDefault()
    if (this.state.connected) {
      this.state.terminal.send(JSON.stringify({
        "event": "ardCalibration"
      }))
    }
    else {
      alert('Please connect your device before beginning a session!')
    }
  }

  render () {
    const force = this.state.forceVal > 100
      ? {color: "mediumseagreen",
         text: <span>Keep going! You are applying a good amount of force.</span>}
      : this.state.forceVal > 60
        ? {color: "orange",
           text: <span>Try to squeeze a little harder!</span>}
        : {color: "red",
           text: <span>Your force readings are low! <br/> Make sure you squeeze harder for a proper work out.</span>}
    const name = this.props.cookies.get('name')
    return (
      <Provider store={ store }>
        <div className="app" style={{backgroundColor:'#76C7FF'}}>
          <div>
            <div style={{width: 30 + '%', float: 'left'}}><br/></div>
            <div style={{textAlign: 'center', fontSize: 30 + 'px', width: 40 + '%', float: 'left'}}>Welcome, {name}!
            </div>
            <div style={{width: 30 + '%', float: 'right', 'textAlign': 'right'}}>
              <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#exampleModalCenter" style={{alignItems: 'center', display: 'flex', float: 'right'}}>
                <span><i className="material-icons">settings</i></span>
              </button>
            </div>
          </div>
          <div className="modal fade" id="exampleModalCenter" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLongTitle" style={{alignItems: 'center', display: 'flex'}}>
                    <span>Settings</span>
                  </h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <form id="send-form" onSubmit={this.handleSettings}>
                  <div className="modal-body container">
                    <div className="form-group row">
                      <label htmlFor="inputThresholdValue" className="col-sm-5 col-form-label">Threshold Value</label>
                      <div className="col-sm-7">
                        <input className="form-control" id="inputThresholdValue" type="text" aria-label="Input" autoComplete="off" name="thresholdValue" value={this.state.thresholdValue} onChange={this.handleChange} placeholder="Value" required/>
                      </div>
                    </div>
                    <div className="form-group row">
                      <label htmlFor="inputThresholdPercent" className="col-sm-5 col-form-label">Threshold Percent</label>
                      <div className="col-sm-7">
                        <input className="form-control" id="inputThresholdPercent" type="text" aria-label="Input" autoComplete="off" name="thresholdPercent" value={this.state.thresholdPercent} onChange={this.handleChange} placeholder="Percent" required/>
                      </div>
                    </div>
                    <div className="form-group row">
                      <div className="col-sm-12">
                        <button type="button" style={{width: 100 + '%'}} className="btn btn-info" onClick={this.handleCalibrate}>Calibrate Threshold</button>
                      </div>
                    </div>
                    <div className="form-group row" style={{marginBottom: 0 + 'px'}}>
                      <div className="col-sm-12">
                        <button type="button" style={{width: 100 + '%'}} className="btn btn-warning" data-dismiss="modal" data-toggle="modal" data-target="#deviceModal">Calibrate Device</button>
                      </div>
                    </div>
                    {this.state.commands.length ?
                      <div className="form-group row" style={{marginBottom: 0 + 'px'}}>
                        <div id="terminal" className="terminal">
                          {this.state.commands.map((command, i) =>
                          (<div className={command.type} key={i}>
                              {command.message}
                            </div>
                          ))}
                          <div style={{ float:"left", clear: "both" }}
                            ref={(el) => { this.messagesEnd = el; }}>
                          </div>
                        </div>
                      </div>
                      : null
                    }
                  </div>
                  <div className="modal-footer">
                    <div style={{float: 'left', width: 100 + '%'}}>
                    <button type="button" className="btn btn-danger" data-dismiss="modal" onClick={this.handleLogout}>Logout</button>
                    <div className="buttons" style={{float: 'right'}}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        id="connect-disconnect-button"
                        onClick={this.handleConnect}
                      >
                        <i className="material-icons">{!this.state.connected ? 'bluetooth_connected' : 'bluetooth_disabled'}</i>
                      </button>
                    </div>
                    </div>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-primary">Update Settings</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal fade" id="deviceModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLongTitle" style={{alignItems: 'center', display: 'flex'}}>
                    <span>Device Calibration</span>
                  </h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <form id="send-form" onSubmit={this.handleDeviceCalibrate}>
                  <div className="modal-body container">
                    <div className="form-group row">
                      <label htmlFor="inputForceMin" className="col-sm-5 col-form-label">Force minimum</label>
                      <div className="col-sm-7">
                        <input className="form-control" id="inputForceMin" type="text" aria-label="Input" autoComplete="off" name="forceMin" value={this.state.forceMin} onChange={this.handleChange} placeholder="Min Force" required/>
                      </div>
                    </div>
                    <div className="form-group row">
                      <label htmlFor="inputForceMin" className="col-sm-5 col-form-label">Force maximum</label>
                      <div className="col-sm-7">
                        <input className="form-control" id="inputForceMin" type="text" aria-label="Input" autoComplete="off" name="forceMax" value={this.state.forceMax} onChange={this.handleChange} placeholder="Max Force" required/>
                      </div>
                    </div>
                    <div className="form-group row">
                      <div className="col-sm-12">
                        <button type="button" className="btn btn-primary" style={{width: 100 + '%'}} onClick={this.toggleSettings}>{this.state.displayAdvanced ? 'Hide': 'Show'} Advanced Settings</button>
                      </div>
                    </div>
                    {this.state.displayAdvanced ?
                      <div>
                        <div className="form-group row">
                          <label htmlFor="inputVoltageMin" className="col-sm-5 col-form-label">Voltage minimum</label>
                          <div className="col-sm-7">
                            <input className="form-control" id="inputVoltageMin" type="text" aria-label="Input" autoComplete="off" name="voltageMin" value={this.state.voltageMin} onChange={this.handleChange} placeholder="Min Voltage" required/>
                          </div>
                        </div>
                        <div className="form-group row">
                          <label htmlFor="inputVoltageMax" className="col-sm-5 col-form-label">Voltage maximum</label>
                          <div className="col-sm-7">
                            <input className="form-control" id="inputVoltageMax" type="text" aria-label="Input" autoComplete="off" name="voltageMax" value={this.state.voltageMax} onChange={this.handleChange} placeholder="Max Voltage" required/>
                          </div>
                        </div>
                      </div>
                      : null
                    }

                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-dismiss="modal" data-toggle="modal" data-target="#exampleModalCenter">Back</button>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-primary">Update Settings</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div style={{textAlign: 'center', fontSize: 30 + 'px', margin: ['auto']}}>
            Device {this.state.sessionStatus ? '' : 'not'} collecting data
          </div>
          <div style={{backgroundColor: 'white', textAlign: 'center', margin: ['auto'], width: 50 + '%'}}>
            <p style={{padding: [1 + 'rem ' + 1 + 'rem ' + 0 + 'px'], fontSize: 25 + 'px', fontWeight: 'bold'}}>Session Info:</p>
            <p style={{padding: [0 + 'px ' + 1 + 'rem'], marginTop: 1 + 'rem', fontSize: 30 + 'px'}}>
              { Math.round(this.props.session.sessionDuration / 60 * 10) / 10 }  / 60 Minutes
            </p>
            <p style={{padding: [0 + 'px ' + 1 + 'rem'], marginTop: 1 + 'rem'}}>
              of daily exercise completed
            </p>
            <p style={{padding: [0 + 'px ' + 1 + 'rem'], marginTop: 1 + 'rem', fontSize: 30 + 'px'}}>
              { this.props.session.squeezeCount } squeezes
            </p>
          </div>
          <div style={{backgroundColor: force.color, textAlign: 'center', margin: ['auto'], width: 50 + '%'}}>
            <p style={{padding: [0 + 'px ' + 1 + 'rem'], marginTop: 1 + 'rem', fontSize: 30 + 'px'}}>{this.state.forceVal < 0 ? 0 : this.state.forceVal} N</p>
            <p style={{padding: [0 + 'px ' + 1 + 'rem']}}>{force.text}</p>
          </div>
          <div style={{width: 60 + '%', textAlign: 'center', margin: ['auto']}}>
            {this.state.connected ?
              <button style={{backgroundColor: 'white'}} onClick={this.handleSession}>
                {this.state.sessionStatus ? 'End' : 'Begin'} Session
              </button>
              :
              <div>
                <p style={{fontSize: 30 + 'px'}}>Please connect a device to continue!</p>
                <div className="buttons">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    id="connect-disconnect-button"
                    onClick={this.handleConnect}
                  >
                    <i className="material-icons">{!this.state.connected ? 'bluetooth_connected' : 'bluetooth_disabled'}</i>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </Provider>
    )
  }
}

const mapStateToProps = (state) => ({
  session: state.session
})

const dispatchToProps = (dispatch) => ({
  getSession: (user) => dispatch(getSession(user))
})

export default withCookies(connect(mapStateToProps, dispatchToProps)(Main))

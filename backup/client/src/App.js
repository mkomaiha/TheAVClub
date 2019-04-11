import React, { Component } from 'react'
import { Provider } from 'react-redux'
import './App.css'
import store from './store'
import Patients from './components/Patient/patients'
import BluetoothTerminal from './BluetoothTerminal'
import Time from 'react-time'

class App extends Component {
  constructor(props) {
    super(props)
    let terminal = new BluetoothTerminal();
    let timeElaps = -1;
    terminal.receive = (data) => {
      try {
        var dataJSON = JSON.parse(data);
        // console.log(dataJSON);
        if ("event" in dataJSON) {
          if (dataJSON["event"] === "ardUpdate") {
            this.setState(prevState => ({
              forceVal: dataJSON["force"]
            }));
            return
          }
          else if (dataJSON["event"] === "ardData") {
            console.log(dataJSON["fDS"])
            fetch("/api/newSession/" + dataJSON["user"], {
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
              }).then(() => {
                fetch("/api/sessions/" + dataJSON["user"], {
                  credentials: 'include',
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                }).then((response) => {
                  return response.json()
                }).then((data) => {
                  // console.log(Math.floor(data["sessionDuration"] / 60 / 10));
                  this.state.terminal.send(JSON.stringify({
                    "event": "light",
                    "value": Math.floor(data["sessionDuration"] / 60 / 10)
                  }))
                }).catch(err => err);
              }).catch(err => err);

            // this.state.terminal.send(data)
              // .then((res) => {
              //   this.setState(prevState => ({
              //     value: '',
              //     comments: prevState.comments.concat(res),
              //   }));
              // })
          }
          else if (dataJSON["event"] === "whatsTheTime") {
            if (dataJSON["end"]) {
              let temp = new Date()
              let message = JSON.stringify({
                "event": "ardSetTime",
                "time": temp.getTime() - timeElaps.getTime()
              })
              console.log(message)
              this.state.terminal.send(message)
            }
            else {
              timeElaps = new Date()
            }
          }
          // console.log(dataJSON)
        }
      }
      catch(error) {
        console.log(error)
      }
      this.logToTerminal(data, 'in');

    };

    terminal._log = (...messages) => {
      messages.forEach((message) => {
        this.logToTerminal(String(message));
        console.log(message); // eslint-disable-line no-console
      }) ;
    };
    // console.log(terminal);

    this.state = {
      value: '',
      forceVal: 0,
      terminal: terminal,
      deviceName: terminal.getDeviceName() ? terminal.getDeviceName() : "Terminal",
      cursor: 1,
      commands: [],
      connected: false
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.logToTerminal = this.logToTerminal.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.send = this.send.bind(this);
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  handleKeyDown(e) {
    if (e.keyCode === 38 && this.state.cursor > 1) {
      this.setState( prevState => ({
        cursor: prevState.cursor - 1,
        value: prevState.commands[prevState.cursor - 2].message
      }))
    } else if (e.keyCode === 40) {
      if (this.state.cursor < this.state.commands.length) {
        this.setState( prevState => ({
          cursor: prevState.cursor + 1,
          value: prevState.commands[prevState.cursor].message
        }))
      }
      else if (this.state.cursor === this.state.commands.length){
        this.setState( prevState => ({
          cursor: prevState.cursor + 1,
          value: ""
        }))
      }
    }
    if (e.keyCode === 67 && e.ctrlKey) {
      this.setState( prevState => ({
        cursor: prevState.commands.length + 1,
        value: ""
      }))
    }
  }

  // Implement own send function to log outcoming data to the terminal.
  send(data) {
    this.state.terminal.send(data).then(() => {
      this.logToTerminal(data, 'out')
      this.setState(prevState => ({
        cursor: prevState.commands.length + 1,
        value: '',
      }));
    }).catch((error) => this.logToTerminal(String(error)));
  }

  logToTerminal(message, type = '') {
    this.setState(prevState => ({
      commands: prevState.commands.concat({
        type: type,
        message: message
      }),
      cursor: prevState.cursor + 1
    }));
  }

  handleClick() {
    console.log(this.state.commands)
    if (!this.state.connected) {
      this.state.terminal.connect().then((dev) => {
        this.setState(prevState => ({
          deviceName: prevState.terminal.getDeviceName(),
          connected: true})
        );
        this.logToTerminal(this.state.terminal.getDeviceName() + ' is connected!')
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

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.send(this.state.value);
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  render () {
    return (
      <Provider store={ store }>
        <div className="app">
          <Patients/>
          <div className="toolbar">
            <div id="device-name" className="name">{this.state.deviceName}</div>
              <div>
                <span>Force {this.state.forceVal}</span>
              </div>
              <div className="buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="connect-disconnect-button"
                  onClick={this.handleClick}
                >
                  <i className="material-icons">{!this.state.connected ? 'bluetooth_connected' : 'bluetooth_disabled'}</i>
                </button>
              </div>
            </div>
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
          <form id="send-form" className="send-form" onSubmit={this.handleSubmit}>
            <input id="input" type="text" aria-label="Input" autoComplete="off" value={this.state.value} onKeyDown={ this.handleKeyDown } onChange={this.handleChange} placeholder="Type something to send..."/>
            <button type="submit" aria-label="Send">
                <i className="material-icons">send</i>
            </button>
          </form>
        </div>
      </Provider>
    )
  }
}
//


// FETCH USER TODAY'S STUFF. IF EXISTS GET THE TIME AND STORE IT. Else make a new entry

export default App

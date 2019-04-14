import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {connect } from 'react-redux';
import {getSessionData} from '../../store/actions/session'
import moment from 'moment'
import {
  ChartLabel,
  FlexibleXYPlot,
  HorizontalGridLines,
  XAxis,
  YAxis,
  LineSeries,
  VerticalRectSeries as RectSeries,
} from 'react-vis'
import './patient.css';

class Patient extends Component {

  static propTypes = {
    getSessionData: PropTypes.func.isRequired
  }

  static defaultProps = {
    session: {
      force: [],
      squeeze: [],
      data: []
    }
  }

  componentWillMount() {
    this.props.getSessionData(this.props.match.params.id);
  }

  render() {
    const {squeeze, force, data} = this.props.session
    var squeezeData = squeeze && squeeze.length
    ? squeeze.map(val => {
      return {
        x0: new Date(val.date.split(' ')[0]).getTime() - 8.64e+7 / 8,
        x:  new Date(val.date.split(' ')[0]).getTime() + 4 * 8.64e+7 / 9,
        y: val.value
      }
    })
    : null
    var forceData = force && force.length
    ? force.map(val => {
      return {
        x0: new Date(val.date.split(' ')[0]).getTime() - 8.64e+7 / 8,
        x:  new Date(val.date.split(' ')[0]).getTime() + 4 * 8.64e+7 / 9,
        y: val.value
      }
    })
    : null
    var rawData = data && data.length
    ? data.map(val => {
      return {
        x: new Date(val.date),
        y: val.value
      }
    })
    : null

    var dataFile = data && data.length
    ? data.map(val => {
      return [val.date, val.value.toString() + '\n']
    })
    : null
    var temp = null
    var csvURL = null
    if (dataFile) {
      temp = new Blob(dataFile, {type: 'text/csv', endings: 'native'})
      csvURL = window.URL.createObjectURL(temp);
    }

    var noData = !(forceData || squeezeData || rawData)
    ? <h1 style={{textAlign: 'center'}}>No data</h1>
    : null

    const name = this.props.match.params.id

    return (
      <div>
        <div>
          <div style={{width: 30 + '%', float: 'left'}}><br/></div>
          <div style={{textAlign: 'center', width: 40 + '%', float: 'left'}}>
            <h1 style={{textAlign: 'center'}}>{name}</h1>
          </div>
          <div style={{width: 30 + '%', float: 'right', 'textAlign': 'right'}}>
            {noData
            ? null
            :
            <a
            href={csvURL}
            download={name + '-' + moment().format('MM-DD-YYYY') + '.csv'}
            className="btn btn-outline-info"
            style={{margin: 5 + 'px'}}>
                <i
                className="material-icons align-middle"
                style={{top: -1 + 'px', position: 'relative'}}>cloud_download</i>
                <span className="ml-2">
                  Download Data
                </span>
            </a>
            }
          </div>
        </div>
        <div style={{width: 200 + 'px',margin:'auto'}}>
          {noData
          ? noData
          : null
          }
        </div>
        <div>
          <div>
          {squeezeData
            ?
            <div style={{width: 800 + 'px', height: 500 + 'px', margin: [10 + 'px auto']}}>
              <h2 style={{textAlign: 'center'}}>Squeeze Data</h2>
              <FlexibleXYPlot
                xType="time"
              >
              <HorizontalGridLines />
              <XAxis
                hideLine
                tickFormat={(d: Date, i) => {
                  return i % 2 === 0
                  ? moment(d).format('ddd DD')
                  : null
                }}
                tickSizeInner={0}
                tickLabelAngle={-22.5}
              />
              <YAxis />
              <RectSeries data={squeezeData} color="red"
              />
              <ChartLabel
                text="Day"
                className="alt-x-label"
                includeMargin={false}
                xPercent={0.5}
                yPercent={1 + 1/8}
                style={{fontWeight:'bold'}}
                />

              <ChartLabel
                text="Squeeze Count"
                className="alt-y-label"
                includeMargin={false}
                xPercent={0.02}
                yPercent={0.06}
                style={{
                  transform: 'rotate(-90)',
                  textAnchor: 'end'
                }}
                />
            </FlexibleXYPlot>
          </div>
          : null
          }
          </div>
          <div>
          {forceData
            ?
            <div style={{width: 800 + 'px', height: 400 + 'px', margin: [100 + 'px auto']}}>
              <h2 style={{textAlign: 'center'}}>Force Data</h2>
              <FlexibleXYPlot
                xType="time"
              >
              <HorizontalGridLines />
              <XAxis
                hideLine
                tickFormat={(d: Date, i) => {
                  return i % 2 === 0
                  ? moment(d).format('ddd DD')
                  : null
                }}
                tickSizeInner={0}
                tickLabelAngle={-22.5}
              />
              <YAxis />
              <RectSeries data={forceData} color="red"
              />
              <ChartLabel
                text="Day"
                className="alt-x-label"
                includeMargin={false}
                xPercent={0.5}
                yPercent={1 + 1/8}
                style={{fontWeight:'bold'}}
                />

              <ChartLabel
                text="Average Force Intensity (N)"
                className="alt-y-label"
                includeMargin={false}
                xPercent={0.02}
                yPercent={0.06}
                style={{
                  transform: 'rotate(-90)',
                  textAnchor: 'end'
                }}
                />
            </FlexibleXYPlot>
          </div>
          : null
          }
          </div>
          <div>
          {rawData
            ?
            <div style={{width: 800 + 'px', height: 500 + 'px', margin: [10 + 'px auto']}}>
              <h2 style={{textAlign: 'center'}}>Raw Data</h2>
              <FlexibleXYPlot
                yDomain={[0, 200]}
                xType="time"
              >
              <HorizontalGridLines />
              <XAxis
                hideLine
                tickFormat={(d: Date, i) => {
                  return i % 2 === 0
                  ? moment(d).format('ddd DD hh:mm')
                  : null
                }}
                tickSizeInner={0}
                tickLabelAngle={-22.5}
              />
              <YAxis
              />
              <LineSeries data={rawData} color="red"
              />
              <ChartLabel
                text="Day"
                className="alt-x-label"
                includeMargin={false}
                xPercent={0.5}
                yPercent={1 + 1/8}
                style={{fontWeight:'bold'}}
                />

              <ChartLabel
                text="Force (N)"
                className="alt-y-label"
                includeMargin={false}
                xPercent={0.02}
                yPercent={0.06}
                style={{
                  transform: 'rotate(-90)',
                  textAnchor: 'end'
                }}
                />
            </FlexibleXYPlot>
          </div>
          : null
          }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  session: state.session
})

const dispatchToProps = (dispatch) => ({
   getSessionData: (user) => dispatch(getSessionData(user))
})

export default connect(mapStateToProps, dispatchToProps)(Patient);

import { h, Component } from 'preact'
import { translate, date } from '../js/lib/translator'
import { Map, CourierVote, Prediction } from './actionBox'
import { ShopInfos, MobileShopInfos } from './shopInfos'
import { Checkpoint } from './checkpoint'
import { Tracking } from './tracking'
import Api from '../js/lib/api'
import statics from '../js/lib/static'

class Layout extends Component {

  constructor() {
    super()

    this.state = {
      loading: true,
      currentTrackingIndex: 0,
      showMore: false,
      trackings: null,
    }

  }

  componentWillMount() {
    this.fetchTrackings()
    if (this.props.opts && this.props.opts.showShopInfos)
      this.fetchShopInfos()
  }

  currentTracking() {
    let { currentTrackingIndex, trackings } = this.state
    let ct = null
    if (trackings && trackings.header && trackings.header.length > 0) {
      ct = { header: null, body: null }
      ct.header = trackings.header[currentTrackingIndex]
      if (ct.header) ct.body = trackings.body[ct.header.id]
    }
    return ct
  }

  addPredictions(predictions=[]) {
    let { trackings } = this.state
    predictions.forEach((p)=> {
      trackings.header = trackings.header.map((h)=> {
        if (h.id === p._ref) {
          h.actionBox.prediction = p.prediction
        }
        return h
      })
    })

    this.setState({ trackings })
  }

  handleError(err) {
    if (this.props.handleError) {
      this.props.handleError(err)
    } else {
      console.error(err)
    }
  }

  ///////////////
  // DATA SHIT //
  ///////////////

  _apiProps() {
    let { opts, handleError, ...others } = this.props
    return others
  }

  fetchTrackings() {
    Api.getCheckpoints(this._apiProps(), (err, res)=> {
      this.setState({ loading: false, })
      if (err) return this.handleError(err)
      else if (res && res.header && res.body) {
        this.setState({ trackings: res, })
        this.fetchActionBoxes()
      } else {
        this.showError()
      }
    })
  }

  fetchShopInfos() {
    Api.getShopInfos(this._apiProps(), (err, res)=> {
      if (err) return this.handleError(err)
      if (res && res.name && res.address) {
        this.setState({
          shopInfos: res,
        })
      }
    })
  }

  fetchActionBoxes() {
    let { trackings } = this.state
    if (trackings && trackings.header && trackings.header.length > 0) {
      trackings.header.forEach((th)=> {
        if (th.actionBox && th.actionBox.type && th.actionBox.type === 'prediction') {
          Api.getPrediction(this._apiProps(), (err, res) => {
            if (err) this.handleError(err)
            if (res) this.addPredictions(res)
          })
        }
      })
    }
  }

  handleVote(vote) {
    Api.voteCourier(vote, this._apiProps(), (err)=> {
      if (err) {
        this.handleError(err)
        this.setState({ voteError: true })
      } else {
        this.setState({ voteSuccess: true })
      }
    });
  }

  /////////////////////
  // CONTROLLER SHIT //
  /////////////////////

  setCurrentTracking(i) {
    if (i !== this.state.currentTrackingIndex)
      this.setState({ currentTrackingIndex: i, showMore: false, })
  }

  handleShowMore() {
    this.setState({ showMore: true })
  }

  ///////////////
  // VIEW SHIT //
  ///////////////

  renderHeading() {
    let { orderNo, trackingNo, lang } = this.props
    let ct = this.currentTracking()
    if (!ct) return null
    if (orderNo) {
      return `${translate('orderNo', lang.code)} ${orderNo}`
    } else if (trackingNo) {
      var res = ''
      var courier = ct.header.courier.prettyname || courier
      res += `${translate('delivery', lang.code)} ${trackingNo} (${courier})`
      return res
    } else {
      return 'Unknown tracking'
    }
  }

  renderCurrentTracking() {
    let { header, body } = this.currentTracking()
    let { lang } = this.props
    return(
      <Tracking
        header={header}
        body={body}
        lang={lang}
        handleShowMore={this.handleShowMore.bind(this)}
        showMore={this.state.showMore} />
    )
  }

  renderTabs() {
    var { header } = this.state.trackings
    var { lang } = this.props
    var colSize = header.length === 3 ? 4 : 6
    var tabs = []
    header.forEach(function (tracking, index) {
      var template = { size: colSize }
      var info = {
        trackingNo: tracking.tracking_number,
        courier: tracking.courier,
        lang: lang.code,
      }
      template.signalColourGreen = !tracking.delayed && !tracking.exception ? '#679A34' : '#AAA'
      template.signalColourOrange = tracking.delayed ? '#F68423' : '#AAA'
      template.signalColourRed = tracking.exception ? '#CE0711' : '#AAA'
      template.transitStatus = statics.transitStates[tracking.last_delivery_status.code]
      template.href = tracking.id
      template.object = JSON.stringify(info)
      if (typeof template.transitStatus === 'undefined')
        template.transitStatus = statics.transitStates.default
      template.transitStatusColor = template.transitStatus.color

      tracking.template = template
      tabs.push(tracking)
    })

    var res = ''
    if (tabs.length > 1) {
      return tabs.map((t, i)=> this.renderTab(t, i))
    } else return null
  }

  renderTab(t, i) {
    let { template : tab, courier, tracking_number } = t
    let { currentTrackingIndex } = this.state
    let active = (currentTrackingIndex === i ) ? 'active' : ''
    return(
      <div className={"pl-col pl-col-" + tab.size} onClick={this.setCurrentTracking.bind(this, i)} key={i}>
        <div className={"pl-tab pl-btn pl-btn-default pl-" + active} href={"pl-t-" + tab.href}>
          <input type="hidden" className="objectHolder" value={tab.object} />
          <div className="pl-icon">
            <span className="fa-stack fa-lg" style={{ color: tab.transitStatusColor }}>
              <i className="fa fa-circle fa-stack-2x" style={{opacity: '.4'}}></i>
              <i className={"fa fa-" + tab.transitStatus.icon + " fa-stack-1x"}></i>
            </span>
          </div>
          <div>
            <span>{courier.prettyname}</span>
            <span className="pl-status">
              <i style={ `color: ${tab.signalColourGreen};` } className="fa fa-circle"></i>
              <i style={ `color: ${tab.signalColourOrange};` } className="fa fa-circle"></i>
              <i style={ `color: ${tab.signalColourRed};` } className="fa fa-circle"></i>
            </span>
            <br />
            <span>{tracking_number}</span>
          </div>
        </div>
      </div>
    )
  }

  renderActionBox() {
    let ct = this.currentTracking()
    let result = null
    if (ct && ct.header && ct.header.actionBox) {
      let { actionBox } = ct.header
      switch (actionBox.type) {
        case 'vote-courier':
          result = <CourierVote actionBox={actionBox} handleVote={this.handleVote.bind(this)} voteSuccess={this.state.voteSuccess} voteError={this.state.voteError} />
          break
        case 'maps':
          if (actionBox.address)
            result = <Map actionBox={actionBox} />
          break
        case 'prediction':
          if (actionBox.prediction && actionBox.prediction.dateOfMonth)
            result = <Prediction actionBox={actionBox} />
          break
      }
    }


    return result
  }

  renderAlert(text) {
    return (
      <div class="pl-alert pl-alert-danger">{ text }</div>
    )
  }

  render() {
    // loading...
    if (this.state.loading) return <div style={{ textAlign: 'center' }}>Loading ...</div>
    if (!this.state.trackings) return this.renderAlert("Can't find this tracking...")

    let layout = ['12', '12']
    let actionBox = this.renderActionBox()

    let shopInfos = null
    let mobileShopInfos = null

    if (this.state.shopInfos || actionBox)
      layout = ['4' , '8']
      if (this.state.shopInfos) {
        shopInfos = <ShopInfos {...this.state.shopInfos}></ShopInfos>
        mobileShopInfos = <MobileShopInfos {...this.state.shopInfos}></MobileShopInfos>
      }

    return (
      <div>
        <div className="pl-col-row">
          <aside  style={{display: 'none'}} className={"pl-box-aside pl-col pl-col-" + layout[0]}>
            <div id="pl-shop-info-container">{ shopInfos }</div>
            <div id="pl-action-box-container">{ actionBox }</div>
          </aside>


          <main className={"pl-main pl-box pl-col pl-col-" + layout[1]}>

              <div className="pl-box-heading" style={ 'margin-bottom:15px;' }>
                { this.renderHeading() }
              </div>

              {/* Tabs */}
              <div className="pl-container" style={ 'padding:0 25px;' }>
                { this.renderTabs() }
              </div>

              { this.renderCurrentTracking() }

          </main>

        </div>

        <div id="pl-mobile-shop-info-container" className="hide-on-desktop">
          { mobileShopInfos }
        </div>
      </div>
    )
  }
}

export { Layout }

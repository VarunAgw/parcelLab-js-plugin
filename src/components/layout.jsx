const { h, Component } = require('preact')
const { translate, date } = require('../js/lib/translator')
const Api = require('../js/lib/api')
const statics = require('../js/lib/static')

class Layout extends Component {

  constructor() {
    super()

    this.state = {
      loading: true,
      currentTrackingIndex: 0,
      showMore: false,
      trackings: null,
      error: null,
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

  handleError(err) {
    console.error(err)
  }

  ///////////////
  // DATA SHIT //
  ///////////////

  fetchTrackings() {
    Api.getCheckpoints(this.props, (err, res)=> {
      this.setState({ loading: false, })
      if (err) return this.handleError(err)
      else if (res && res.header && res.body) {
        this.setState({ trackings: res, })
        this.fetchActionBox()
      } else {
        this.showError()
      }
    })
  }

  fetchShopInfos() {
    Api.getShopInfos(this.props, (err, res)=> {
      if (err) return this.handleError(err)
      if (res && res.name && res.address) {
        this.setState({
          shopInfos: res,
        })
      }
    })
  }

  fetchActionBox() {
    let ct = this.currentTracking()
    var actionBox = ct.header.actionBox
    if (!actionBox || !actionBox.type) return
    switch (actionBox.type) {
      case 'maps':
        this.setState({ actionBox })
        break
      case 'vote-courier':
        this.setState({ actionBox })
        break
      case 'prediction':
        Api.getPrediction(this.props(), (err, res) => {
          if (err) this.handleError(err)
          this.setState({
            actionBox : res,
          })
        })
        break
    }
  }

  /////////////////////
  // CONTROLLER SHIT //
  /////////////////////

  setCurrentTracking(i) {
    if (i !== this.state.currentTrackingIndex)
      this.setState({ currentTrackingIndex: i, showMore: false, })
  }

  showMore() {
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

  renderFurtherInfosLink() {
    let currentTracking = this.currentTracking()
    let courier = currentTracking.header.courier
    if (courier && courier.trackingurl)
      return <a href={courier.trackingurl} target="_blank">
        <i class="fa fa-lightbulb-o"></i> {courier.trackingurl_label}
      </a>
    else
      return <span style={{ opacity: '.6' }}>
        <i class="fa fa-lightbulb-o"></i> ${courier.trackingurl_label}
      </span>
  }

  renderCurrentTracking() {
    let { header, body } = this.currentTracking()
    let { lang } = this.props
    let checkpoints = []
    let acceptedStatusses = 'OutForDelivery DestinationDeliveryCenter'
    let furtherInfosText = ''

    let tracking = {
      id: header.id,
      checkpoints: [],
    }

    tracking.subHeading = true
    checkpoints = body.filter(function (elem) {
      return elem.shown
    })

    checkpoints.forEach((checkpoint, i)=> {
      var cp = {
        button: (i + 3) === checkpoints.length && checkpoints.length > 4,
        checkpoint: checkpoint,
        more: translate('more', lang.code),
      }

      var ts = new Date(checkpoint.timestamp)
      if (acceptedStatusses.indexOf(checkpoint.status) >= 0 && i === (checkpoints.length - 1))
        tracking.prediction = {
          text: translate('predictions', lang.code)[checkpoint.status],
          status: checkpoint.status,
        }
      cp.dateText = date(ts, i !== 0, lang.code)

      cp.transitStatus = statics.transitStates[checkpoint.status]

      if (typeof cp.transitStatus === 'undefined')
        cp.transitStatus = statics.transitStates.default

      cp.transitStatusColor = cp.transitStatus.color
      cp.locationText = checkpoint.location ? ' (' + checkpoint.location + ')' : ''
      cp.alert = i === checkpoints.length - 1 ?
        'alert-' + (cp.transitStatus.alert ?
          cp.transitStatus.alert : 'info') : ''

      tracking.checkpoints.push(cp)
    })

    tracking.checkpoints.reverse()

    let showMoreBtn = null
    // hide checkpoints if more than 3
    if (tracking.checkpoints.length > 3 && !this.state.showMore) {
      tracking.checkpoints = tracking.checkpoints.splice(0, 3)
      // add show more button
      showMoreBtn = this.renderShowmoreButton()
    }
    return(
      <div className="parcel_lab_tracking" id={'pl-t-' + tracking.id}>
        <div className="pl-box-body">

            <div className="pl-padded">
              {tracking.checkpoints.map((cp, i)=> this.renderCheckpoint(cp, i))}
              { showMoreBtn }
            </div>

          </div>
        <div className="pl-box-footer">
          {this.renderFurtherInfosLink()}
        </div>
      </div>
    )
  }

  renderShowmoreButton() {
    let text = translate('more', this.props.lang.code)
    return (
      <div className="pl-row pl-alert pl-action pl-show-more-button" onClick={this.showMore.bind(this)}>
        <div className="pl-icon">
          <span className="fa-stack fa-lg">
            <i className="fa fa-circle fa-stack-2x" style={{color:'#eee'}}></i>
            <i className="fa fa-ellipsis-h fa-stack-1x fa-inverse"></i>
          </span>
        </div>
        <div className="pl-text pl-show-more-text">
          { text }
          <br/>
        </div>
      </div>
    )
  }

  renderCheckpoint(cp, i) {
    let { button, more, alert, checkpoint_hidden, transitStatusColor, transitStatus, dateText, locationText, checkpoint, } = cp
    return(
      <div className={"pl-row pl-alert pl-" + alert} key={i}>
        <div className="pl-icon">
          <span className="fa-stack fa-lg" style={{color: transitStatusColor}}>
            <i className="fa fa-circle fa-stack-2x"
              style={{color: transitStatusColor, opacity:'.2'}}></i>
            <i className={"fa fa-" + transitStatus.icon + " fa-stack-1x fa-inverse"} style={{color : transitStatusColor}}></i>
          </span>
        </div>
        <div className="pl-text">
          <small>{ dateText }  { locationText }</small><br />
          <b>{ checkpoint.status_text }</b>: { checkpoint.status_details }
        </div>
      </div>
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
              <i style={{ color: tab.signalColourGreen }} className="fa fa-circle"></i>
              <i style={{ color: tab.signalColourOrange }} className="fa fa-circle"></i>
              <i style={{ color: tab.signalColourRed }} className="fa fa-circle"></i>
            </span>
            <br />
            <span>{tracking_number}</span>
          </div>
        </div>
      </div>
    )
  }

  generateSocialLinks(socials) {
    let result = []
    let colors = {
      facebook: '#3b5999',
      instagram: '#3f729b',
      pinterest: '#bd081c',
      twitter: '#55acee',
      'google-plus': '#dd4b39',
    }
    for (var social in socials) {
      let url = socials[social]
      let color = colors[social] ? colors[social] : '#ddd'
      result.push(
        <a href={url} target="_blank" alt={social}>
          <span class="fa-stack fa-lg">
              <i class="fa fa-circle fa-stack-2x" style={{color: '#e0e0e0', opacity: '.4'}}></i>
              <i class={"fa fa-" + social + " fa-stack-1x"} style={{ color : color }}></i>
          </span>
        </a>
      )
    }
    return result
  }

  generateContactLink(pemail) {
    var emailTest = /\S+@\S+\.\S+/;
    if (emailTest.test(pemail))
      return <a href={ "mailto:" + pemail }>{ pemail }</a>
    else
      return <a href={ pemail } _target="blank">{ pemail }</a>
  }

  generateAddressBlock(address) {
    return (
      <address>
        { address.street } <br/>
        { address.zip_code } { address.city }
      </address>
    )
  }

  renderShopInfos() {
    let { address, contact, customisation, name, social } = this.state.shopInfos
    let addressBlock = null
    let contactLink = null
    let socialLinks = null

    if (address)
      addressBlock = this.generateAddressBlock(address)

    if (contact.pubEmail)
      contactLink = this.generateContactLink(contact.pubEmail)

    if (social)
      socialLinks = this.generateSocialLinks(social)

    return (
      <div>
        <div class="hide-on-desktop" style="margin-bottom:25px;">
          <a href={ contact.website } target="_blank">
              <img src={ customisation.logoUrl } alt={name.full} class="img-responsive" style="margin-bottom: 6px; max-height:80px;" />
          </a>
        </div>


        <div class="pl-box hide-on-mobile" style="margin-bottom: 25px; padding: 20px 0px;">
          <div class="pl-box-body">
            <a  href={ contact.website } target="_blank">
                <img src={ customisation.logoUrl } alt={ name.full } class="img-responsive" style="margin-bottom: 6px;" />
            </a>


            { name.full }
            { addressBlock }
            { contactLink }

            <br />
            <a href={ contact.website } target="_blank">{ contact.website }</a>
            <br />
            <div style="text-align: center; margin-top:40px;">
              { socialLinks }
            </div>

          </div>
        </div>
      </div>
    )
  }

  renderMobileShopInfos() {
    let { address, contact, customisation, name, social } = this.state.shopInfos
    let addressBlock = null,
        contactLink = null,
        socialLinks = null

    if (address)
      addressBlock = this.generateAddressBlock(address)

    if (contact.pubEmail)
      contactLink = this.generateContactLink(contact.pubEmail)

    if (social)
      socialLinks = this.generateSocialLinks(social)

    return(
      <div class="pl-box hide-on-desktop" style={{margin: '25px 0', padding: '20px 0px'}}>
        <div class="pl-box-body">
          { name.full }
          { addressBlock }
          { contactLink }
          <br />
          <a href={contact.website} target="_blank">{ contact.website }</a>
          <br />
          <div style={{textAlign: 'center', marginTop: 40}}>
            { socialLinks }
          </div>
        </div>
      </div>
    )
  }

  render() {
    // loading...
    if (this.state.loading) return <div style={{ textAlign: 'center' }}>Loading ...</div>

    let layout = ['12', '12']
    let shopInfos = null
    let actionBox = null
    let mobileShopInfos = null

    if (this.state.shopInfos)
      layout = ['4' , '8']
      shopInfos = this.renderShopInfos()
      mobileShopInfos = this.renderMobileShopInfos()

    return (
      <div>
        <div className="pl-col-row">
          <aside  style={{display: 'none'}} className={"pl-box-aside pl-col pl-col-" + layout[0]}>
            <div id="pl-shop-info-container">{ shopInfos }</div>
            <div id="pl-action-box-container">{ actionBox }</div>
          </aside>


          <main className={"pl-main pl-box pl-col pl-col-" + layout[1]}>

              <div className="pl-box-heading" style={{marginBottom: 15}}>
                { this.renderHeading() }
              </div>

              {/* Tabs */}
              <div className="pl-container" style={{padding: "0 25px"}}>
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

module.exports = Layout

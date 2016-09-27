const { h, Component } = require('preact')
const { translate } = require('../js/lib/translator')
const Api = require('../js/lib/api')

class Layout extends Component {

  constructor() {
    super()

    this.state = {
      layout: ['4', '12'],
      currentTracking: null,
      trackings: [],
      error: null,
    }
  }

  ///////////////
  // DATA SHIT //
  ///////////////

  getTrackings() {
    Api.getCheckpoints(this.props, (err, res)=> {
      if (err) return this.handleError(err);
      else if (res && res.header && res.body) {
        this.checkpoints = res;
        this.renderLayout(this.checkpoints);
        this.initActionBox();
        if (this.options.show_shopInfos) this.initShopInfos();
        this.bindEvents();
      } else {
        this.showError();
      }
    });
  }

  getShopInfos() {
    Api.getShopInfos(this.props, (err, res)=> {
      if (err) return this.handleError(err);
      if (res && res.name && res.address) {
        this.setState({
          shopInfos: res,
        })
      }
    });
  }

  getActionBox() {
    if (!this.checkpoints || !this.checkpoints.header) return;
    if (this.checkpoints.header.length > 1 || !this.checkpoints.header[0]) return;
    var actionBox = this.checkpoints.header[0].actionBox;
    if (!actionBox || !actionBox.type) return;
    switch (actionBox.type) {
      case 'maps':
        this.renderActionBox(actionBox);
        break;
      case 'vote-courier':
        this.renderActionBox(actionBox);
        break;
      case 'prediction':
        Api.getPrediction(this.props(), (err, res) => {
          if (err) this.handleError(err);
          this.setState({
            prediction : res,
          })
        });
        break;
    }
  }

  ///////////////
  // VIEW SHIT //
  ///////////////

  heading() {
    let { orderNo, trackingNo, data, lang } = this.props
    if (orderNo) {
      return `${translate('orderNo', lang.code)} ${orderNo}`
    } else if (trackingNo) {
      var res = ''
      var courier = data.header[0].courier.prettyname || courier
      res += `${translate('delivery', lang.code)} ${trackingNo} (${courier})`
      return res;
    } else {
      return 'Unknown tracking';
    }
  }

  currentTracking() {
    let checkpoints = []
    return(
      <div className="parcel_lab_tracking" id={'pl-t-' + this.props.id}>
        <div className="pl-box-body">

            <div className="pl-padded">
              {checkpoints}
            </div>

          </div>
        <div className="pl-box-footer">
          {generateFurtherInfosText}
        </div>
      </div>
    )
  }

  tabs() {
    let tabs = []
    return tabs
  }

  render() {
    return (
      <div>
        <div className="pl-col-row">
          <aside  style={{display: 'none'}} className={"pl-box-aside pl-col pl-col-" + this.state.layout[0]}>
            <div id="pl-shop-info-container"></div>
            <div id="pl-action-box-container"></div>
          </aside>


          <main className={"pl-main pl-box pl-col pl-col-" + this.state.layout[1]}>

              <div className="pl-box-heading" style={{marginBottom: 15}}>
                {this.heading()}
              </div>

              {/* Tabs */}
              <div className="pl-container" style={{padding: "0 25px"}}>
                {this.tabs()}
              </div>



              {/* Trackings-Container */}
              {/*this.currentTracking()*/}

          </main>

        </div>

        <div id="pl-mobile-shop-info-container" className="hide-on-desktop"></div>
      </div>
    )
  }
}

module.exports = Layout

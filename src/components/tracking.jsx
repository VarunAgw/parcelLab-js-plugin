import { h } from 'preact'
import { date, translate } from '../js/lib/translator'
import { Checkpoint } from './checkpoint'
import statics from '../js/lib/static'

const FurtherInfosLink = ({ courier })=> {
  if (courier && courier.trackingurl)
    return(
      <a href={courier.trackingurl} target="_blank">
        <i className="fa fa-lightbulb-o"></i> {courier.trackingurl_label}
      </a>
    )
  else
    return (
      <span style={ `opacity: .6;` }>
        <i className="fa fa-lightbulb-o"></i> { courier.trackingurl_label }
      </span>
    )
}

const ShowmoreButton = ({ lang, handleShowMore })=> {
  let text = translate('more', lang.code)
  return (
    <div className="pl-row pl-alert pl-action pl-show-more-button" onClick={ handleShowMore }>
      <div className="pl-icon">
        <span className="fa-stack fa-lg">
          <i className="fa fa-circle fa-stack-2x" style={ `color:#eee;` }></i>
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

const Tracking = ({ header, body, lang, handleShowMore, showMore, })=> {
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
      checkpoint: checkpoint,
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
  if (tracking.checkpoints.length > 3 && !showMore) {
    tracking.checkpoints = tracking.checkpoints.splice(0, 3)
    // add show more button
    showMoreBtn = <ShowmoreButton lang={lang} handleShowMore={handleShowMore} />
  }


  return(
    <div className="parcel_lab_tracking" id={'pl-t-' + tracking.id}>
      <div className="pl-box-body">

          <div className="pl-padded">
            { tracking.checkpoints.map((cp, i)=> <Checkpoint key={ header.id + '-' + i } data={cp} /> ) }
            { showMoreBtn }
          </div>

        </div>
      <div className="pl-box-footer">
        <FurtherInfosLink courier={ header.courier }/>
      </div>
    </div>
  )
}

export { Tracking }

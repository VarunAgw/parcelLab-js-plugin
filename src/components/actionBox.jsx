import { h } from 'preact'

const Prediction = ({ actionBox: ab })=> {
  if (!ab || !ab.prediction || !ab.prediction.dateOfMonth) return null

  let { prediction } = ab
  console.log(prediction)
  let label = null
  let main = null
  let timeBox = null
  let caption = null

  if (ab.label)
    label = (<div class="pl-box-heading pl-box-cal-heading">
      <h3 style="text-align:center;">{ ab.label }</h3>
    </div>)

  main = (
    <div class="pl-box" style="margin-bottom: 10px;">
      { label }

      <div class="pl-box-body pl-box-cal-body pl-box-prediction">
        <div class="pl-cal-week-day">{ prediction.dayOfWeek }</div>
        <div class="pl-cal-day">{ prediction.dateOfMonth }</div>
        <div class="pl-cal-month">{ prediction.month }</div>
      </div>
    </div>
  )

  if (prediction.startTime) {
    let timeCaption = prediction.timeCaption || null
    timeBox = (
    <div class="pl-box pl-box-time" style="margin-bottom: 10px;">
      <div class="pl-box-body">
        <div class="pl-time-data">
          <i class="fa fa-clock-o"></i> { prediction.startTime } { prediction.endTime ? '- ' + prediction.endTime : null}
        </div>

        { timeCaption ? <small class="pl-time-caption">{ timeCaption }</small> : null }
      </div>
    </div>
    )
  }

  if (prediction.caption) {
    caption = (
      <div class="pl-prediction-caption" style="margin-bottom:25px;">
        <i class="fa fa-info"></i> &nbsp; { prediction.caption }
      </div>
    )
  }

  return (
    <div>
      { main }
      { timeBox }
      { caption }
    </div>
  )
}


const CourierVote = ({ actionBox: ab, voteSuccess, voteError, handleVote })=> {
  let label = null

  if (ab.label) label = <h3 style="text-align:center;">{ab.label}</h3>

  let body = [
    (<div class="pl-courier-vote up" onClick={ handleVote.bind(null, 'up') } key={'1'}>
      <i class="fa fa-thumbs-o-up"></i>
    </div>),
    (<div class="pl-courier-vote down" onClick={ handleVote.bind(null, 'down') } key={'2'}>
      <i class="fa fa-thumbs-o-down"></i>
    </div>)
  ]

  if (voteError) body = (<small style="text-align:center;">
    An Error occurred, we are very sorry 😥
    </small>)
  if (voteSuccess) body = (<i class="fa fa-check fa-2x"></i>)

  return (
    <div class="pl-box" style="margin-bottom:25px;">
      <div class="pl-box-body" style="padding: 15px;">
        { label }
        <div class="rating-body">
          { body }
        </div>
      </div>
    </div>
  )
}


const Map = ({ actionBox: ab })=> {
  if (!ab || !ab.address) return null
  let generateMapsLink = (address)=> {
    var encAdress = encodeURIComponent(address);
    return `https://www.google.com/maps/place/${encAdress}/`;
  }
  let generateMapBG = (address) => {
    const GOOGLE_API_KEY = require('raw!../../GOOGLE_API_KEY').trim();
    var encAdress = encodeURIComponent(address);
    var imgLink = `http://maps.googleapis.com/maps/api/staticmap? \
      center=${encAdress}
      &zoom=17
      &size=300x170
      &format=png
      &visual_refresh=true
      &key=${GOOGLE_API_KEY}
      &markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C${encAdress}`;
    var css = `
      background-image: url(${imgLink});
      background-size: cover;
      background-position: center;
      `;
    return css.replace(/ /g, '').replace(/\n/g, '');
  }
  return (
    <div class="pl-box" style="margin-bottom:25px;">
      <a href={ generateMapsLink(ab.address) } title={ ab.address } target="_blank">
        <div class="pl-box-body pl-box-maps" style={ generateMapBG(ab.address) }>
          <div class="pl-box-action-info">
            <i class="fa fa-road fa-2x" style="margin-bottom: 10px;"></i>
            { ab.address }
          </div>
          <div class="pl-address-info">
            <div>{ ab.address }</div>
          </div>
        </div>
      </a>
    </div>
  )
}

export { Map, CourierVote, Prediction }

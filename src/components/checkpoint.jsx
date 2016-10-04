import { h } from 'preact'

const Checkpoint  = ({ data, })=> {
  let { button, more, alert, checkpoint_hidden, transitStatusColor, transitStatus, dateText, locationText, checkpoint, } = data

  return(
    <div className={"pl-row pl-alert pl-" + alert}>
      <div className="pl-icon">
        <span className="fa-stack fa-lg" style={`color: ${transitStatusColor}`}>
          <i className="fa fa-circle fa-stack-2x"
            style={ `color: ${transitStatusColor}; opacity:.2;` }></i>
          <i className={"fa fa-" + transitStatus.icon + " fa-stack-1x fa-inverse"} style={`color: ${transitStatusColor}`}></i>
        </span>
      </div>
      <div className="pl-text">
        <small>{ dateText }  { locationText }</small><br />
        <b>{ checkpoint.status_text }</b>: <span dangerouslySetInnerHTML={{ __html: checkpoint.status_details }}></span>
      </div>
    </div>
  )
}


export { Checkpoint }

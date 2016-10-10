import { h } from 'preact'

var generateSocialLinks = (socials)=> {
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
    let color = colors[social] ? colors[social] : '#828282'
    result.push(
      <a href={url} target="_blank" alt={social}>
        <span className="fa-stack fa-lg">
            <i className="fa fa-circle fa-stack-2x" style={{color: '#e0e0e0', opacity: '.4'}}></i>
            <i className={"fa fa-" + social + " fa-stack-1x"} style={{ color : color }}></i>
        </span>
      </a>
    )
  }
  return result
}

var generateContactLink = (pemail)=> {
  var emailTest = /\S+@\S+\.\S+/;
  if (emailTest.test(pemail))
    return <a href={ "mailto:" + pemail }> <i className="fa fa-envelope-o"></i> { pemail }</a>
  else
    return <a href={ pemail } _target="blank"> <i className="fa fa-globe"></i> { pemail }</a>
}

var generatePhoneLink = (phone)=> {
  if (phone)
    return <a href={ `tel:${phone}` }><i class="fa fa-fw fa-phone"></i> { phone }</a>
}

var generateAddressBlock = (address)=> {
  return (
    <address>
      { address.street } <br/>
      { address.zip_code } { address.city }
    </address>
  )
}

const ShopInfos = ({ address, contact, customisation, name, social })=> {
  let addressBlock = null,
      contactLink = null,
      phoneLink = null,
      socialLinks = null

  if (address)
    addressBlock = generateAddressBlock(address)

  if (contact.pubEmail)
    contactLink = generateContactLink(contact.pubEmail)

  if (contact.phone)
    phoneLink = generatePhoneLink(contact.phone)

  if (social)
    socialLinks = generateSocialLinks(social)

  return (
    <div>
      <div className="hide-on-desktop" style="margin-bottom:25px;">
        <a href={ contact.website } target="_blank">
            <img src={ customisation.logoUrl } alt={ name.full } className="img-responsive" style="margin-bottom: 6px; max-height:80px;" />
        </a>
      </div>


      <div className="pl-box hide-on-mobile" style="margin-bottom: 25px; padding: 20px 0px;">
        <div className="pl-box-body">
          <a  href={ contact.website } target="_blank">
              <img src={ customisation.logoUrl } alt={ name.full } className="img-responsive" style={{marginBottom: 15}} />
          </a>


          <b dangerouslySetInnerHTML={{ __html: name.full }} ></b>
          { addressBlock }
          { phoneLink } <br/>
          { contactLink } <br/>
          { generateContactLink(contact.website) } <br />
          <div style={{textAlign: 'center', marginTop: 40}}>
            { socialLinks }
          </div>

        </div>
      </div>
    </div>
  )
}

const MobileShopInfos = ({ address, contact, customisation, name, social })=> {
  let addressBlock = null,
      contactLink = null,
      phoneLink = null,
      socialLinks = null

  if (address)
    addressBlock = generateAddressBlock(address)

  if (contact.pubEmail)
    contactLink = generateContactLink(contact.pubEmail)

  if (contact.phone)
    phoneLink = generatePhoneLink(contact.phone)

  if (social)
    socialLinks = generateSocialLinks(social)

  return(
    <div className="pl-box hide-on-desktop" style={{margin: '25px 0', padding: '20px 0px'}}>
      <div className="pl-box-body">
        { name.full }
        { addressBlock }
        { phoneLink } <br />
        { contactLink } <br />
        { generateContactLink(contact.website) } <br />
        <div style={{textAlign: 'center', marginTop: 40}}>
          { socialLinks }
        </div>
      </div>
    </div>
  )
}

export { ShopInfos, MobileShopInfos }

const path = require('path');
const { pathToFileURL } = require('url');

const kioskProtocol = 'kiosk:';

const kioskSites = ['home', 'testapp'].map(siteData);

function siteData(id) {
  const html = pathToFileURL(path.join(__dirname, '../../html/', `${id}.html`));
  const preload = pathToFileURL(
    path.join(__dirname, '../renderer/kiosk-sites/', `${id}.js`)
  );
  return {
    id,
    html,
    preload,
  };
}

function hasKioskProtocol(url) {
  try {
    return new URL(url).protocol === kioskProtocol;
  } catch (e) {
    // invalid URL
    return false;
  }
}

function kioskSiteForKioskUrl(kioskUrl) {
  kioskUrl = new URL(kioskUrl);
  if (hasKioskProtocol(kioskUrl)) {
    const id = kioskUrl.hostname;
    const index = kioskSites.findIndex((site) => site.id === id);
    if (index !== -1) {
      return kioskSites[index];
    } else {
      throw new Error(`Unknown ${kioskProtocol}// site: ${kioskUrl.href}`);
    }
  } else {
    new Error(`Not a ${kioskProtocol}// url: ${kioskUrl.href}`);
  }
}

function kioskSiteForHtmlUrl(htmlUrl) {
  htmlUrl = new URL(htmlUrl);
  const index = kioskSites.findIndex((site) => site.html.href === htmlUrl.href);
  if (index !== -1) {
    return kioskSites[index];
  } else {
    throw new Error(`Unknown ${kioskProtocol}// site: ${htmlUrl.href}`);
  }
}

module.exports = {
  hasKioskProtocol,
  kioskSiteForKioskUrl,
  kioskSiteForHtmlUrl,
};

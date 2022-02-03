const path = require('path');
const { pathToFileURL } = require('url');

const kioskProtocol = 'kiosk:';

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

const kioskSites = ['home', 'testapp'].map(siteData);

function hasKioskProtocol(url) {
  try {
    return new URL(url).protocol === kioskProtocol;
  } catch (e) {
    // invalid URL
    return false;
  }
}

function kioskSiteForKioskUrl(url) {
  const kioskUrl = new URL(url);
  if (hasKioskProtocol(kioskUrl)) {
    const id = kioskUrl.hostname;
    const index = kioskSites.findIndex((site) => site.id === id);
    if (index !== -1) {
      return kioskSites[index];
    }
    throw new Error(`Unknown ${kioskProtocol}// site: ${kioskUrl.href}`);
  } else {
    throw new Error(`Not a ${kioskProtocol}// url: ${kioskUrl.href}`);
  }
}

function kioskSiteForHtmlUrl(url) {
  const htmlUrl = new URL(url);
  const index = kioskSites.findIndex((site) => site.html.href === htmlUrl.href);
  if (index !== -1) {
    return kioskSites[index];
  }
  throw new Error(`Unknown ${kioskProtocol}// site: ${htmlUrl.href}`);
}

module.exports = {
  hasKioskProtocol,
  kioskSiteForKioskUrl,
  kioskSiteForHtmlUrl,
};

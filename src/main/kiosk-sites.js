import path from 'path';
import { pathToFileURL } from 'url';
import { is } from '@electron-toolkit/utils';

const kioskProtocol = 'kiosk:';

function siteData(id) {
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const html =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? new URL(`${id}.html`, process.env['ELECTRON_RENDERER_URL'])
      : pathToFileURL(path.join(__dirname, '../renderer', `${id}.html`));

  const preload = pathToFileURL(
    path.join(__dirname, '../preload/kiosk-sites/', `${id}.js`),
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

export { hasKioskProtocol, kioskSiteForKioskUrl, kioskSiteForHtmlUrl };

const kioskSitesDefaultExport = {
  hasKioskProtocol,
  kioskSiteForKioskUrl,
  kioskSiteForHtmlUrl,
};
export default kioskSitesDefaultExport;

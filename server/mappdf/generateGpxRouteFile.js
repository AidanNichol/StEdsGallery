function generateGpxRouteFile(dat, no, name, wps) {
  let header = `<?xml version="1.0" encoding="ISO-8859-1"?>
<gpx version="1.1" creator="Memory-Map 5.4.2.1089 http://www.memory-map.com" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd">`;
  let rte = `<rte><name>${name} ${no} ${dat}</name>`;
  let rtepts = "";
  for (const wp of wps) {
    const { lat, lon, name } = wp;
    rtepts += `<rtept lat="${lat}" lon="${lon}"><name>${name}</name><sym>Dot</sym><type>Waypoints</type></rtept>`;
  }
  return header + rte + rtepts + `</rte></gpx>`;
}
module.exports = { generateGpxRouteFile };

const {write, exists} = require('fs-jetpack')
const pkg = require('@prisma/client');
const { PrismaClient } = pkg;
// const dateFn = require('date-fns');
// const { format } = dateFn;

const prisma = new PrismaClient();

const isDEv=()=>true;
const WALKDATA = isDev() ? "/Users/aidan/Websites/htdocsC/walkdata" : "/home/ajnichol/public_html/walkdata";
const fileName=(dat,tail, ext)=>`${WALKDATA}/${dat.substr(0, 4)}/${dat}/data-${dat}-walk-${tail}.${ext}`
 function makeAllRoutesGpx(dat)
{
    const jFile = fileName(dat,gpx,'json');
    const gxpJ = [];
    const wd = prisma.walk.findUnique({where:{date:dat},select:{area:true}})
    const area = wd.area;
    for (no = 1; no < 6; no++) {
        gxpJ[no] = makeRouteGpx(dat, no, area);
    }
    gxpJ.area = area;
    write(jFile, JSON.encode(gxpJ));
    return $gxpJ;
}
const Name = require('@/components/Name.vue');


function getRoutesGpxJ($date)
{
    const jFile = fileName(dat,gpx,'json')
    if (!exists(jFile)) {
        return makeAllRoutesGpx(dat);
    }

    $jTime = filemtime($jFile);
    for ($no = 1; $no < 6; $no++) {
        $wFile = fileName(dat,no,'txt')
        if (!file_exists($wFile) || $jTime < filemtime($wFile)) {
            return $this->makeAllRoutesGpx($date);
        }

    }
    return json_decode(file_get_contents($jFile));
}
 function makeRouteGpx(dat, no, area)
{
    const xFile = filename(dat, no, 'gpx');
    const name = `${area} ${no} ${date}`;
    const wFile = filename(dat, no, 'json')
    if (exists(wFile)) {
        const data = JSON.decode(read($wFile));
        $wData = $data['wData'];
        $wp = $data['wp'];
    } else {
        const wFile = fileName(dat,no,'txt')
        if (!exists(wFile)) {
            return null;
        }
        eval(file_get_contents($wFile));
    }

    $res = '<?xml version="1.0" encoding="ISO-8859-1"?>';
    $res .= '<gpx version="1.1" creator="Memory-Map 5.4.2.1089 http://www.memory-map.com" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd">';
    $res .= "<rte><name>{$name}</name>";
    $minLat = 999999;
    $maxLat = -999999;
    $minLng = 999999;
    $maxLng = -999999;
    $start = false;
    foreach ($wp as $i => $p) {
        $pt = OS_Coords::deLetterMapCoords($p['pos']);
        if (!$start) {
            $start = $pt;
        }

        $end = $pt;
        list($lat, $lng) = $pt;
        $minLat = min($minLat, $lat);
        $maxLat = max($maxLat, $lat);
        $minLng = min($minLng, $lng);
        $maxLng = max($maxLng, $lng);
        $pt = OS_Coords::mapOsToLatLong($p['pos']);
        list($lat, $lng) = $pt;

        $res .= '<rtept lat="' . $lat . '" lon="' . $lng . '"><name>' . $p['name'] . '</name><sym>Dot</sym><type>Waypoints</type></rtept>';
    }
    $res .= '</rte></gpx>';
    file_put_contents($xFile, $res);
    $cent = [($minLat + $maxLat) / 2, ($minLng + $maxLng) / 2];
    return compact('minLat', 'maxLat', 'minLng', 'maxLng', 'start', 'end', 'cent');
}
module.exports={makeRouteGpx, makeAllRoutesGpx}
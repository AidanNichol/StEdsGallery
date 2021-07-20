<?
$m=$this->map;
$pdf->StartTransform();
$pdf->Rect(x(0,-.5), y(0,-.5), x($m->rangeX / 100, -4), y($m->rangeY / 100, -4), 'CNZ');

$pdf->SetFont('helvetica', '', 8);
// set alpha to semi-transparency
$pdf->SetAlpha(0.5);

foreach($m->features as $fil)
{
    print "Processing: $fil<br>";
    eval(file_get_contents("$fil"));
    $point = reset($wp);
    while($point !== false)
    {
        $name = $point["name"];
        $pos = $point["pos"];
        print "$name <br>";
        $e = explode(" ",$name,3);
        @list($featType, $class, $rest) = $e;
        setColors($pdf, $class);
        $pt = array();
        $aWP = new WayPoint($point["pos"], "");
        $res = $m->getMapCoords($aWP);
        $pt[] = x($res['x']); $pt[] = y($res['y']);
        switch (strtolower($featType))
        {
            case "area":
                for ($point = next($wp);
                    $point !== false && $point["pos"] != $pos;
                    $point = next($wp))
                {
                    $aWP = new WayPoint($point["pos"], "");
                    $res = $m->getMapCoords($aWP);
                    $pt[] = x($res['x']); $pt[] = y($res['y']);
                }
                $pdf->Polygon($pt, 'DF');
                break;
            case "line":
                while ($point !== false)
                {
                    $point = next($wp);
                    $aWP = new WayPoint($point["pos"], "");
                    $res = $m->getMapCoords($aWP);
                    $pt[] = x($res['x']); $pt[] = y($res['y']);
                    if (strtolower($point["name"]) == "end")break;
                }
                $pdf->PolyLine($pt);
                break;
            case "point":
                $pdf->Circle($pt[0], $pt[1],.6, 0, 360,'F',null, array(0,0,0));
            case "name":
                 //$pdf->Circle($pt[0], $pt[1],.6, 0, 360,'F',null, array(0,0,0));
               //list($class, $rest) = explode(" ",$rest,2);
                $point = next($wp);
                $aWP = new WayPoint($point["pos"], "");
                $p2 = $m->getMapCoords($aWP);
                //$pdf->Circle(x($p2['x']), y($p2['y']),.6, 0, 360,'F',null, array(0,0,0));
                $dX = x($p2['x']) - $pt[0];
                $dY = y($p2['y']) - $pt[1];
                $len = sqrt($dX*$dX+$dY*$dY);
                $rad = atan2($dX,$dY);
                $angle = rad2deg($rad);
                $angle = ($angle-90)%360;
                print "x1: {$pt[0]} y1: {$pt[1]} x2: ".x($p2['x'])." y2: ".y($p2['y']).
                        " rad: $rad deg: $angle <br>";
                $pdf->StartTransform();
                $pdf->Rotate($angle, $pt[0], $pt[1]);
                //$pdf->Text($pt[0], $pt[1], $rest);
                $pdf->MultiCell($len, 0, $rest, 0, 'C', 0, 0, $pt[0], $pt[1]-4, true, 0, true);
                $pdf->StopTransform();
            break ;
            default:
                    //print("skiping $name $pos\n");
            break;
        }
        if ($point!==false)$point = next($wp);
    }

}
$pdf->SetAlpha(1);
$pdf->StopTransform();
// restore full opacity
$pdf->SetTextColorArray(array(0,0,0));

function setColors($pdf, $mode)
{
    $stroke = null;
    $text = null;
    $fill = null;
    print "<br>Mode:$mode ";
    switch (strtolower($mode)) {
      case "aroad": // Red;
            $stroke = array(255,0,0);
            $text =  array(255,0,0);
      break;
      case "broad": // Brown;
            $stroke = array(165,42,42);
      break;
      case "hill": //  stroke: Peru; fill:none;
            $stroke = array(205,133,63);
      break;
      case "place": //    stroke: Indigo; fill:none;
            $stroke= array(75,0,130);
      break;
      case "water":  //  stroke: CornflowerBlue; fill:none;
            $stroke = array(100,149,237);
            $fill = array(135,206,235);
      break;
      default:
            $stroke = array(0,0,0);
            $fill = array(255,255,255);
    }
    if ($fill == null) $fill = $stroke;
    if ($text == null) $text = $stroke;
    //print "  Fill: ".implode(' ',$fill)."  Text: ".implode(' ',$text)."  Stroke: ".implode(' ',$stroke).'<br>';
    $pdf->SetFillColorArray($fill);
    $pdf->SetDrawColorArray($stroke);
    $pdf->SetTextColor($text[0], $text[1], $text[2]);
}

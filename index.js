import "ol/ol.css";
import KML from "ol/format/KML";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom
} from "ol/interaction";
import { Heatmap as HeatmapLayer, Tile as TileLayer } from "ol/layer";
import Stamen from "ol/source/Stamen";
import VectorSource from "ol/source/Vector";
import { Map, View } from "ol/index";

var doc = document.implementation.createDocument(
  "http://www.opengis.net/kml/2.2",
  "kml",
  null
);

//https://stackoverflow.com/questions/3191179/generate-xml-document-in-memory-with-javascript

$(document).ready(function() {
  var blur = document.getElementById("blur");
  var radius = document.getElementById("radius");

  var vector = new HeatmapLayer({
    source: new VectorSource({
      url: "data/kml/2012_Earthquakes_Mag5.kml",
      format: new KML({
        extractStyles: false
      })
    }),
    blur: parseInt(blur.value, 10),
    radius: parseInt(radius.value, 10),
    weight: function(feature) {
      var name = feature.get("name");
      var magnitude = parseFloat(name.substr(2));
      return magnitude - 5;
    }
  });

  var raster = new TileLayer({
    source: new Stamen({
      layer: "terrain"
    })
  });

  var map = new Map({
    layers: [raster, vector],
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    target: "map",

    view: new View({
      center: [0, 0],
      zoom: 2
    })
  });

  $("#addPoint").click(function() {
    var placemarkElement = doc.createElement("Placemark");

    var nameElement = doc.createElement("name");
    var name = doc.createTextNode($("#dbm").val());

    var pointElement = doc.createElement("point");
    var point = doc.createTextNode($("#lat").val() + "," + $("#long").val());

    var descriptionElement = doc.createElement("description");
    var description = doc.createTextNode($("#remarks").val());

    var weatherElement = doc.createElement("weather");
    var weather = doc.createTextNode($("#weather").val());

    var buildingElement = doc.createElement("building");
    var building = doc.createTextNode($("#building").val());

    // append nodes to parents
    nameElement.appendChild(name);
    placemarkElement.appendChild(nameElement);

    pointElement.appendChild(point);
    placemarkElement.appendChild(pointElement);

    descriptionElement.appendChild(description);
    placemarkElement.appendChild(descriptionElement);

    weatherElement.appendChild(weather);
    placemarkElement.appendChild(weatherElement);

    buildingElement.appendChild(building);
    placemarkElement.appendChild(buildingElement);

    // Append to document
    doc.documentElement.appendChild(placemarkElement);
    // Close the modal
    $("#newlocation").modal("hide");
    // Clear the remarks field of the form
    $("#remarks").val("");
    // Render the new kml object
    var source = vector.getSource();
    source.refresh();

    ///////////////////////////

    var serializer = new XMLSerializer();
    alert(serializer.serializeToString(doc));
  });

  map.on("click", function(event) {
    var feature = map.getFeaturesAtPixel(event.pixel)[0];
    if (feature) {
      var coordinate = feature.getGeometry().getCoordinates();
      alert(coordinate);
    } else {
      //Not known, lets show the form
      document.getElementById("long").value = event.coordinate[0];
      document.getElementById("lat").value = event.coordinate[1];
      $("#newlocation").modal("show");
    }
  });

  var slider = document.getElementById("dbm");
  var output = document.getElementById("dbmHelp");
  output.innerHTML = slider.value + " DBm"; // Display the default slider value

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    output.innerHTML = this.value + " DBm";
  };

  var blurHandler = function() {
    vector.setBlur(parseInt(blur.value, 10));
  };
  blur.addEventListener("input", blurHandler);
  blur.addEventListener("change", blurHandler);

  var radiusHandler = function() {
    vector.setRadius(parseInt(radius.value, 10));
  };
  radius.addEventListener("input", radiusHandler);
  radius.addEventListener("change", radiusHandler);
});

import "ol/ol.css";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom
} from "ol/interaction";
import { Heatmap as HeatmapLayer, Tile as TileLayer } from "ol/layer";
import Stamen from "ol/source/Stamen";
import VectorSource from "ol/source/Vector";
import { Map, View } from "ol/index";

var serializer = new XMLSerializer();
var kmlDoc = document.implementation.createDocument(
  "http://earth.google.com/kml/2.0",
  "kml",
  null
);

var documentElement = kmlDoc.createElement("Document");
documentElement.removeAttribute("xmlns");
kmlDoc.documentElement.appendChild(documentElement);

var documentNameElement = kmlDoc.createElement("name");
var documentname = kmlDoc.createTextNode("RF Heatmap");

documentNameElement.appendChild(documentname);
documentElement.appendChild(documentNameElement);

var folderElement = kmlDoc.createElement("Folder");
documentElement.appendChild(folderElement);

var folderNameElement = kmlDoc.createElement("name");
var foldername = kmlDoc.createTextNode("Heatmap export");

folderNameElement.appendChild(foldername);
folderElement.appendChild(folderNameElement);

//https://stackoverflow.com/questions/3191179/generate-xml-document-in-memory-with-javascript

$(document).ready(function() {
  var blur = document.getElementById("blur");
  var radius = document.getElementById("radius");

  var vector = new HeatmapLayer({
    source: new VectorSource({
      url:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        serializer.serializeToString(kmlDoc).replace(' xmlns=""', ""),
      format: new KML({
        extractStyles: false
      })
    }),

    blur: parseInt(blur.value, 10),
    radius: parseInt(radius.value, 10),
    weight: function(feature) {
      //var name = feature.get("name");
      //var magnitude = parseFloat(name.substr(2));
      //return magnitude - 5;
      console.log(feature.get("name"));
      return feature.get("name");
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
    var placemarkElement = kmlDoc.createElement("Placemark");
    placemarkElement.setAttribute("id", $("#datetime").val());

    var nameElement = kmlDoc.createElement("name");
    var name = kmlDoc.createTextNode($("#dbm").val());

    var coordinatesElement = kmlDoc.createElement("coordinates");
    var coordinates = kmlDoc.createTextNode(
      $("#lat").val() + "," + $("#long").val() + ",0"
    );

    var descriptionElement = kmlDoc.createElement("description");
    var description = kmlDoc.createTextNode($("#remarks").val());

    var weatherElement = kmlDoc.createElement("weather");
    var weather = kmlDoc.createTextNode($("#weather").val());

    var buildingElement = kmlDoc.createElement("building");
    var building = kmlDoc.createTextNode($("#building").val());

    //<magnitude>5.9</magnitude>

    // append nodes to parents
    nameElement.appendChild(name);
    placemarkElement.appendChild(nameElement);

    var pointElement = kmlDoc.createElement("Point");
    placemarkElement.appendChild(pointElement);

    coordinatesElement.appendChild(coordinates);
    pointElement.appendChild(coordinatesElement);

    descriptionElement.appendChild(description);
    placemarkElement.appendChild(descriptionElement);

    weatherElement.appendChild(weather);
    placemarkElement.appendChild(weatherElement);

    buildingElement.appendChild(building);
    placemarkElement.appendChild(buildingElement);

    // Append to document
    folderElement.appendChild(placemarkElement);
    // Close the modal
    $("#newlocation").modal("hide");
    // Clear the remarks field of the form
    $("#remarks").val("");

    // Render the new kml object
    var source = vector.getSource();
    source.refresh();

    ///////////////////////////
    var res =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      serializer.serializeToString(kmlDoc).replace(' xmlns=""', "");
    console.log(res);
  });

  map.on("click", function(event) {
    var feature = map.getFeaturesAtPixel(event.pixel)[0];
    if (feature) {
      var coordinate = feature.getGeometry().getCoordinates();
      alert(coordinate);
    } else {
      //Not known, lets show the form

      var newDatetime = new Date();
      document.getElementById("long").value = event.coordinate[0];
      document.getElementById("lat").value = event.coordinate[1];
      document.getElementById("datetime").value = newDatetime.toISOString();
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

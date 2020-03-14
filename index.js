import "ol/ol.css";
import Geolocation from "ol/Geolocation";
import KML from "ol/format/KML";
//import GeoJSON from "ol/format/GeoJSON";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
  FullScreen
} from "ol/interaction";
import {
  Heatmap as HeatmapLayer,
  Tile as TileLayer,
  Vector as VectorLayer
} from "ol/layer";
import Stamen from "ol/source/Stamen";
import VectorSource from "ol/source/Vector";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import Point from "ol/geom/Point";
import { toPng } from "html-to-image";

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

  var view = new View({
    center: [0, 0],
    zoom: 2
  });

  var map = new Map({
    layers: [raster, vector],
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    target: "map",
    view: view
  });

  var geolocation = new Geolocation({
    // enableHighAccuracy must be set to true to have the heading value.
    trackingOptions: {
      enableHighAccuracy: true
    },
    projection: view.getProjection()
  });

  geolocation.setTracking(true);

  $(".footer").click(function() {
    map.setView(
      new View({
        center: geolocation.getPosition(),
        zoom: 15
      })
    );
  });

  $("#settings").click(function() {
    $("#settingsModal").modal("show");
  });

  $("#export-png").click(function() {
    var exportOptions = {
      filter: function(element) {
        return element.className
          ? element.className.indexOf("ol-control") === -1
          : true;
      }
    };

    map.once("rendercomplete", function() {
      toPng(map.getTargetElement(), exportOptions).then(function(dataURL) {
        var link = document.getElementById("image-download");
        link.href = dataURL;
        link.click();
      });
    });
    map.renderSync();
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

  // update the HTML page when the position changes.
  geolocation.on("change", function() {
    document.getElementById("accuracy").innerText =
      geolocation.getAccuracy() + " [m]";
    document.getElementById("altitude").innerText =
      geolocation.getAltitude() + " [m]";
    document.getElementById("altitudeAccuracy").innerText =
      geolocation.getAltitudeAccuracy() + " [m]";
    document.getElementById("heading").innerText =
      geolocation.getHeading() + " [rad]";
    document.getElementById("speed").innerText =
      geolocation.getSpeed() + " [m/s]";
  });

  // handle geolocation error.
  geolocation.on("error", function(error) {
    var info = document.getElementById("info");
    info.innerHTML = error.message;
    info.style.display = "";
  });

  var accuracyFeature = new Feature();
  geolocation.on("change:accuracyGeometry", function() {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });

  var positionFeature = new Feature();
  positionFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill({
          color: "#3399CC"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 1
        })
      })
    })
  );

  geolocation.on("change:position", function() {
    var coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });

  new VectorLayer({
    map: map,
    source: new VectorSource({
      features: [accuracyFeature, positionFeature]
    })
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

import "ol/ol.css";
import Geolocation from "ol/Geolocation";
//import KML from "ol/format/KML";
//import GeoJSON from "ol/format/GeoJSON";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom
} from "ol/interaction";
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Heatmap as HeatmapLayer
} from "ol/layer";
import Stamen from "ol/source/Stamen";
import VectorSource from "ol/source/Vector";
import Overlay from "ol/Overlay";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from "ol/style";
import Point from "ol/geom/Point";
import { toPng } from "html-to-image";

$(document).ready(function() {
  // Display message when user leaves the page
  $(window).bind("beforeunload", function() {
    return "Don't forget to save your data ;)";
  });

  // Some variables for the heatmap (Found in settings)
  var blur = document.getElementById("blur");
  var radius = document.getElementById("radius");

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
    layers: [raster],
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    target: "map",
    view: view
  });

  //Geolocation on page load
  var geolocation = new Geolocation({
    // enableHighAccuracy must be set to true to have the heading value.
    trackingOptions: {
      enableHighAccuracy: true
    },
    projection: view.getProjection()
  });

  geolocation.setTracking(true);

  //Center on current device location when clicked
  $(".footer").click(function() {
    map.setView(
      new View({
        center: geolocation.getPosition(),
        zoom: 15
      })
    );
  });

  //Show settings
  $("#settings").click(function() {
    $("#settingsModal").modal("show");
  });

  //Export PNG file
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

  // Create heatmap
  var heatmapSource = new VectorSource({});
  var heatmapLayer = new HeatmapLayer({
    map: map,
    source: heatmapSource,
    blur: parseInt(blur.value, 10),
    radius: parseInt(radius.value, 10)
  });

  function lookupWeight(power) {
    power = (parseFloat(power) + 120) / 100;
    return power;
  }

  var popup = new Overlay({
    element: document.getElementById("popup")
  });
  var element = popup.getElement();

  // Add feature to the map when user completes form
  $("#addPoint").click(function() {
    // Close the modal
    $("#newlocation").modal("hide");
    // Clear the remarks field of the form
    $("#remarks").val("");

    var pointFeature = new Feature();
    pointFeature.set("power", $("#dbm").val());
    pointFeature.set("type", $("#type").val());
    pointFeature.set("weather", $("#weather").val());
    pointFeature.set("building", $("#building").val());
    pointFeature.set("datetime", $("#datetime").val());
    pointFeature.set("remarks", $("#remarks").val());
    var coordinates = [$("#long").val(), $("#lat").val()];
    pointFeature.setGeometry(coordinates ? new Point(coordinates) : null);
    pointFeature.set("weight", lookupWeight($("#dbm").val()));
    heatmapSource.addFeature(pointFeature);
  });

  // Display information about feature or add new feature to the map
  map.on("click", function(event) {
    var feature = map.getFeaturesAtPixel(event.pixel)[0];
    if (feature) {
      var coordinate = feature.getGeometry().getCoordinates();

      map.addOverlay(popup);

      $(element).popover("hide");
      $(element).data("bs.popover", null);
      popup.setPosition(coordinate);

      $(element).popover({
        placement: "top",
        animation: false,
        html: true,
        content:
          "<p>Coordinates: <code>" +
          coordinate +
          "</code></p>" +
          "<p>Type: <code>" +
          feature.get("type") +
          "</code></p>" +
          "<p>Power: <code>" +
          feature.get("power") +
          "</code></p>" +
          "<p>Building: <code>" +
          feature.get("building") +
          "</code></p>" +
          "<p>Weather: <code>" +
          feature.get("weather") +
          "</code></p>" +
          "<p>Remarks: <code>" +
          feature.get("remarks") +
          "</code></p>"
      });

      //test
      $(element).popover("show");
    } else {
      //Not known, lets show the form
      $(element).popover("hide");
      $(element).data("bs.popover", null);

      var newDatetime = new Date();
      document.getElementById("long").value = event.coordinate[0];
      document.getElementById("lat").value = event.coordinate[1];
      document.getElementById("alt").value = event.coordinate[2];
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
    var info = document.getElementById("footer");
    info.innerHTML = error.message;
    info.style.display = "";
  });

  // Show current user location
  var positionFeature = new Feature();
  positionFeature.setStyle(
    new Style({
      zIndex: 101,
      image: new Icon({
        anchor: [0.5, 0.5],
        opacity: 0.8,
        scale: 0.8,
        src: "img/user.svg"
      })
    })
  );

  var backgroundFeature = new Feature();
  backgroundFeature.setStyle(
    new Style({
      zIndex: 100,
      image: new CircleStyle({
        radius: 14,
        fill: new Fill({
          color: "rgba(0, 60, 136, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(255, 255, 255, 0.5)",
          width: 4
        })
      })
    })
  );

  geolocation.on("change:position", function() {
    var coordinates = geolocation.getPosition();
    backgroundFeature.setGeometry(coordinates ? new Point(coordinates) : null);
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });

  new VectorLayer({
    map: map,
    source: new VectorSource({
      features: [backgroundFeature, positionFeature]
    })
  });

  // Fancy slider for the feature form (Add lcoation)
  var slider = document.getElementById("dbm");
  var output = document.getElementById("dbmHelp");
  output.innerHTML = slider.value + " DBm"; // Display the default slider value

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    output.innerHTML = this.value + " DBm";
  };

  // Event handlers for the settings
  var blurHandler = function() {
    heatmapLayer.setBlur(parseInt(blur.value, 10));
  };
  blur.addEventListener("input", blurHandler);
  blur.addEventListener("change", blurHandler);

  var radiusHandler = function() {
    heatmapLayer.setRadius(parseInt(radius.value, 10));
  };
  radius.addEventListener("input", radiusHandler);
  radius.addEventListener("change", radiusHandler);
});

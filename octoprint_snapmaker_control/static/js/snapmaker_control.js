/*
 * View model for OctoPrint - Snapmaker Control
 *
 * Author: Ron Lawrence
 * License: ISC
 */
$(function () {
  function Snapmaker_controlViewModel(parameters) {

    var self = this;
    //---------- variables -----------------
    self.laser = ko.observable(undefined);
    self.cnc = ko.observable(undefined);
    self.fileLoaded = ko.observable(undefined);
    self.showEntry = ko.observable(undefined);
    self.fileLoaded = ko.observable(undefined);
    self.toolPercentage = ko.observable(undefined);
    self.toolStatus = ko.observable(undefined);

    // assign the injected viewModel parameters
    self.connectionViewModel = parameters[0];
    self.navigationViewModel = parameters[1];
    self.settingsViewModel = parameters[2];

    self.toolPercentage(10);

    //---------  functions  ----------------
    self.onEventConnected = function (payload) {
      console.log('connected', payload);
      self.allOff();
      setTimeout(self.getSnapmakerInfo, 2000);
    };

    self.allOff = function () {
      self.cnc(false);
      self.laser(false);
      self.showEntry(false);
    };

    self.onEventDisconnected = function (payload) {
      console.log('Disconnected', payload);
      self.allOff();
    };

    self.selectAFunction = function (func) {
      console.log('Function: ', func);
    };

    self.sendOnCommand = function () {
      if (self.cnc()) {
        console.log('ON');
        OctoPrint.control.sendGcode("M3");
      } else {
        console.log('ON', self.toolPercentage());
        var pct = Math.trunc(self.toolPercentage());
        var pct255 = Math.trunc(self.toolPercentage() * 255 / 100);
        OctoPrint.control.sendGcode("M3 P"+ pct + " S" + pct255);
      }
    };

    self.sendOffCommand = function () {
      console.log('OFF');
      OctoPrint.control.sendGcode("M5");
    };

    self.attachControls = function () {
      var snapmaker = $("#snapmaker_controls");
      if (snapmaker) {
        // $("#control").after(snapmaker);
        ko.cleanNode(snapmaker[0]);
        $("#control-jog-custom").after(snapmaker);
        ko.applyBindings(self, snapmaker[0]);
      } else {
        console.error('Unable to get snapmaker_controls template!');
      }
    };

    self.getSnapmakerInfo = function () {
      var url = OctoPrint.options.baseurl;
      console.log('calling ', OctoPrint.options);
      OctoPrint.get('plugin/snapmaker_control/status')
        .then(function (response) {
          console.log('Snapmaker Status', response);
          self.firmware = response.firmware;
          self.tool = response.tool;
          if (response.status === true) {
            self.cnc(response.cnc);
            self.laser(response.laser);
            self.showEntry(true);
          } else {
            self.allOff();
          }
        });
    };

    self.getJobInfo = function () {
      OctoPrint.job.get().then(function (o) {
        // console.log('status', o.state);
        console.log('Job Info:', o);
        if (o.state && o.state.indexOf("Offline") === 0) {
          self.allOff();
        }
        self.fileLoaded(o);
        self.setFunctions();
      });
    };

    self.setFunctions = function () {
      self.functions = [
        {name: "Detect Module", visible: true},
        {name: "Run Boundary", visible: self.laser || self.cnc && self.fileLoaded},
        {name: "Focus Laser", visible: self.laser},
        {name: "Start Laser", visible: self.laser},
        {name: "Stop Laser", visible: self.laser},
        {name: "Start CNC tool", visible: self.cnc},
        {name: "Stop CNC tool", visible: self.cnc}
      ];
    };

    //------- startup code -------------
    self.attachControls();
    self.allOff();
    self.setFunctions();
    self.getSnapmakerInfo();

    console.log('This is my VM', self);
    self.getJobInfo();
  }

  /* view model class, parameters for constructor, container to bind to
   * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
   * and a full list of the available options.
   */
  OCTOPRINT_VIEWMODELS.push({
    construct: Snapmaker_controlViewModel,
    // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
    dependencies: ["connectionViewModel", "navigationViewModel", "settingsViewModel"],
    // Elements to bind to, e.g. #settings_plugin_snapmaker_control, #tab_plugin_snapmaker_control, ...
    elements: ["#snapmaker_menu" /* ... */]
  });
});

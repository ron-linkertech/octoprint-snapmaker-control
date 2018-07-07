/*
 * View model for OctoPrint - Snapmaker Control
 *
 * Author: Ron Lawrence
 * License: ISC
 */
$(function () {
  function Snapmaker_controlViewModel(parameters) {

    var self = this;
    self.isOn = false;
    //---------- variables -----------------
    self.laser = ko.observable(undefined);
    self.cnc = ko.observable(undefined);
    self.fileLoaded = ko.observable(undefined);
    self.showEntry = ko.observable(undefined);
    self.fileLoaded = ko.observable(undefined);
    self.toolPercentage = ko.observable(undefined);
    self.bounds = ko.observable(undefined);
    self.toolPercentageDebounced = self.toolPercentage.extend({
      rateLimit: {
        method: "notifyWhenChangeStop",
        timeout: 500
      }
    });
    self.toolStatus = ko.observable(undefined);

    self.toolPercentageDebounced.subscribe(function (val) {
      if (val !== '' && self.laser() && self.isOn) {
        self.sendOnCommand();
      }
    }, this);

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
      self.isOn = false;
      self.cnc(false);
      self.laser(false);
      self.showEntry(false);
      self.fileLoaded(undefined);
      self.bounds(undefined);
    };

    self.onEventFileSelected = function (payload) {
      console.log('File selected', payload);
      self.getJobInfo();
    };

    self.onEventMetadataAnalysisFinished = function (payload) {
      console.log('Metadata analysis finished', payload);
      self.getJobInfo();
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
        self.isOn = false;
        console.log('ON');
        OctoPrint.control.sendGcode("M3");
      } else {
        self.isOn = true;
        console.log('ON', self.toolPercentage());
        var pct = Math.trunc(self.toolPercentage());
        var pct255 = Math.trunc(self.toolPercentage() * 255 / 100);
        OctoPrint.control.sendGcode("M3 P" + pct + " S" + pct255);
      }
    };

    self.sendSetOriginCommand = function () {
      console.log('Set Origin');
      OctoPrint.control.sendGcode("G92 X0 Y0 Z0");
    };

    self.sendGoOriginCommand = function () {
      console.log('Go Origin');
      var feed = 3000; // for now... should be setting
      OctoPrint.control.sendGcode("G0 X0 Y0 Z0 F"+feed);
    };

    self.sendBoundaryCommands = function () {
      console.log('Run Boundary');
      var bounds = self.bounds();
      if (bounds) {
        var feed = 3000; // for now... should be setting
        var gcodeArr = [
          "G90",
          "G92 X0 Y0 Z0",
          "G1 X" + bounds.minX + " Y" + bounds.minY + " F" + feed,
          "G1 X" + bounds.minX + " Y" + bounds.maxY + " F" + feed,
          "G1 X" + bounds.maxX + " Y" + bounds.maxY + " F" + feed,
          "G1 X" + bounds.maxX + " Y" + bounds.minY + " F" + feed,
          "G1 X" + bounds.minX + " Y" + bounds.minY + " F" + feed,
          "G1 X0.00 Y0.00 Z0.00 F" + feed];
        console.log(gcodeArr);
        OctoPrint.control.sendGcode(gcodeArr);
      }

    };

    self.sendOffCommand = function () {
      console.log('OFF');
      self.isOn = false;
      OctoPrint.control.sendGcode("M5");
    };

    self.attachControls = function () {
      var snapmaker = $("#snapmaker_controls");
      if (snapmaker) {
        // $("#control").after(snapmaker);
        ko.cleanNode(snapmaker[0]);
        $("#tabs_content").after(snapmaker);
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
      OctoPrint.job.get()
        .then(function (o) {
          // console.log('status', o.state);
          console.log('Job Info:', o);
          if (o.state && o.state.indexOf("Offline") === 0) {
            self.allOff();
          }
          var file = o.job.file;
          OctoPrint.files.get(file.origin, file.path)
            .then(function (f) {
              if (f && f.gcodeAnalysis && f.gcodeAnalysis.printingArea) {
                self.bounds(f.gcodeAnalysis.printingArea);
              }
              console.log('File info', f);
            });
          self.fileLoaded(o);
        });
    };

    //------- startup code -------------
    self.attachControls();
    self.allOff();
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

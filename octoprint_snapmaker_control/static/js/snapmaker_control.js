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
        self.laser = false;
        self.cnc = false;
        self.fileLoaded = false;
        // assign the injected viewModel parameters
        self.connectionViewModel = parameters[0];
        self.navigationViewModel = parameters[1];
        self.settingsViewModel = parameters[2];

        //---------  functions  ----------------
        self.selectAFunction = function (func) {
            console.log('Function: ', func);

        };

        self.getJobInfo = function () {
            OctoPrint.job.get().then(function (o) {
                // console.log('status', o.state);
                console.log('Job Info:', o);
                if (o.state && o.state.indexOf("Offline") === 0) {
                    self.laser = false;
                    self.cnc = false;
                }
                else {
                    // detect laser, cnc
                }
                self.fileLoaded = (o.job.file.name != null);
                // self.menuVisible = true;
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
        self.setFunctions();
        divControls = $("#control-jog-custom"); // add to this id's div (insert at top?)

        console.log('This is my VM', self, divControls);
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
        elements: [ "#snapmaker_menu" /* ... */]
    });
});

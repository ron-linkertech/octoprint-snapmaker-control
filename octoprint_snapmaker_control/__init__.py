from __future__ import absolute_import

import json

# ## This plugin will provide laser and CNC controls for the snapmaker printer / laser / cnc machine
import flask
import octoprint.plugin
from octoprint.settings import settings

class SnapmakerControlPlugin(octoprint.plugin.StartupPlugin,
                             octoprint.plugin.EventHandlerPlugin,
                             octoprint.plugin.AssetPlugin,
                             octoprint.plugin.TemplatePlugin,
                             octoprint.plugin.BlueprintPlugin):

    def __init__(self):
        self.init()

    @octoprint.plugin.BlueprintPlugin.route("/status", methods=["GET"])
    def handleGet(self):
        self._logger.info('Get snapmaker info called')
        response = flask.make_response(self.status(), 200)
        response.headers['content-type'] = 'application/json'
        return response

    @octoprint.plugin.BlueprintPlugin.route("/status", methods=["POST"])
    def handlePost(self):
        if not "text" in flask.request.values:
            return flask.make_response("Expected a text to echo back.", 400)
        return flask.request.values["text"]

    def status(self):
        return json.dumps({
            'status': self.detected,
            'cnc': self.cnc,
            'laser': self.laser,
            'firmware': self.firmware_line,
            'tool': self.tool_line
        })

    def get_assets(self):
        return dict(
            js=["js/snapmaker_control.js"],
            css=["css/snapmaker_control.css"],
            less=["less/snapmaker_control.less"]
        )

    def get_template_configs(self):
        return [
            dict(type="navbar", custom_bindings=True),
            dict(type="settings", custom_bindings=False)
        ]

    def get_update_information(self):
        return dict(
            snapmaker_control=dict(
                displayName="Snapmaker_control Plugin",
                displayVersion=self._plugin_version,

                # version check: github repository
                type="github_release",
                user="ron-linkertech",
                repo="octoprint-snapmaker-control",
                current=self._plugin_version,

                # update method: pip
                pip="https://github.com/ron-linkertech/octoprint-snapmaker-control/archive/{target_version}.zip"
            )
        )

    def init(self):
        self.firmware_line = ''
        self.tool_line = ''
        self.detected = False
        self.cnc = False
        self.laser = False

    def on_event(self, event, payload):
        # FileSelected - path, origin (local == ok to do boundry)
        # MetadataAnalysisFinished path,origin, result-> printingArea (maxZ, etc (min/max)(X/Y/Z))
        # Connected
        # Disconnected
        method = getattr(self, 'on_event_' + event.lower(), None)
        if method is not None:
            self._logger.info('Handle event {} {}'.format(event.lower(), payload))
            method(payload)
        else:
            self._logger.info(
                'Did not handle event {} {}'.format(event, payload))

    def on_event_connected(self, params):
        self._logger.info('Connected!!!!!!')
        self.set_tool_status()

    def on_printer_add_message(self, data):
        self._logger.info('Printer message', data)

    def set_tool_status(self):
        """
        M1005 -
          Firmware Version: Snapmaker-Base-2.2
          Release Date: Mar 27 2018
        Send a M1006 - get tool: "Tool Head: LASER" "Tool Head: 3DP" "Tool Head: CNC"
        if not starting with "Tool Head":
        Send M105, and get response.
          If it has B0 and T300-499.99 then activate laser
          If it has B0 and T500+ then activate CNC
          else activate "normal"
        """
        self._logger.info('Sending M1005 and M1006')
        self._printer.commands('M1005', 'M1005')
        self._printer.commands('M1006', 'M1006')

    def handle_responses(self, comm, line, *args, **kwargs):
        self._logger.info('LINE {}'.format(line))
        # 1005 response
        if "Snapmaker" in line:
            self.firmware_line = line
            self.detected = True
        else:
            # 1006 response
            if "Tool Head:" in line:
                self.tool_line = line
                if "CNC" in line:
                    self.cnc = True
                    self.laser = False
                else:
                    if "LASER" in line:
                        self.cnc = False
                        self.laser = True
                    else:
                        self.cnc = False
                        self.laser = False

        return line

    def on_event_fileselected(self, params):
        self._logger.info('File selected!!!!!!')

    def on_event_metadataanalysisfinished(self, params):
        self._logger.info('File analyzed  !!!!', params)

    def on_event_disconnected(self, params):
        self._logger.info('Disconnected!!!!!!')
        self.cnc = False
        self.laser = False
        self.detected = False

    def on_after_startup(self):
        self._logger.info("after startup.")


# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Snapmaker Control"
__plugin_description__ = "Control for Snapmaker printer's CNC and laser modules"
__plugin_license__ = "ISC"
__plugin_url__ = "https://ron-linkertech.github.io/octoprint-snapmaker-control/"
__plugin_author__ = "Ron Lawrence"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = SnapmakerControlPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information,
        "octoprint.comm.protocol.gcode.received": __plugin_implementation__.handle_responses
    }
